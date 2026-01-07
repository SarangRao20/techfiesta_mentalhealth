from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from database import db, cache, r_streaks
from db_models import User, RoutineTask, Assessment, MeditationSession, ChatSession, ConsultationRequest
from datetime import datetime, timedelta
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload
from utils.common import update_user_streak, get_user_streak

ns = Namespace('dashboard', description='User dashboard and statistics')

task_stats_model = ns.model('TaskStats', {
    'total': fields.Integer(),
    'completed': fields.Integer(),
    'progress': fields.Float()
})

dashboard_model = ns.model('Dashboard', {
    'username': fields.String(),
    'full_name': fields.String(),
    'login_streak': fields.Integer(),
    'meditation_streak': fields.Integer(),
    'weekly_sessions': fields.Integer(),
    'total_minutes_meditated': fields.Integer(),
    'crisis_sessions': fields.Integer(),
    'tasks': fields.Nested(task_stats_model),
    'recent_assessments': fields.List(fields.Raw()),
    'consultations': fields.List(fields.Raw()),
    'recent_meditation_logs': fields.List(fields.Raw())
})

def get_dashboard_summary(user):
    """Utility function to get dashboard stats for a user (used by API and Login)"""
    today = datetime.utcnow().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    # Routine Tasks - Optimized with .count() to avoid object initialization
    tasks_today_query = RoutineTask.query.filter_by(user_id=user.id, created_date=today)
    tasks_today_count = tasks_today_query.count()
    completed_tasks_count = tasks_today_query.filter_by(status='completed').count()
    progress = (completed_tasks_count / tasks_today_count * 100) if tasks_today_count > 0 else 0
    
    # Meditation Stats - Aggregate query for speed
    med_stats = db.session.query(
        func.count(MeditationSession.id).label('count'),
        func.sum(MeditationSession.duration).label('total_duration')
    ).filter(
        MeditationSession.user_id == user.id,
        MeditationSession.date >= start_of_week
    ).first()
    
    weekly_sessions = med_stats.count or 0
    total_seconds = med_stats.total_duration or 0
    
    # Crisis
    crisis_count = ChatSession.query.filter_by(user_id=user.id, crisis_flag=True).count()
    
    # Assessments
    recent_assessments = Assessment.query.filter_by(user_id=user.id).order_by(
        Assessment.completed_at.desc()
    ).limit(5).all()
    
    # Update Streak in Redis (r_streaks is imported globally from database)
    streak_count = update_user_streak(r_streaks, user)
    
    return {
        'username': user.username,
        'full_name': user.full_name,
        'login_streak': streak_count,
        'meditation_streak': streak_count,
        'weekly_sessions': weekly_sessions,
        'total_minutes_meditated': total_seconds // 60,
        'crisis_sessions': crisis_count,
        'tasks': {
            'total': tasks_today_count,
            'completed': completed_tasks_count,
            'progress': progress
        },
        'recent_assessments': [
            {
                'id': a.id,
                'type': a.assessment_type,
                'severity': a.severity_level,
                'date': a.completed_at.isoformat()
            } for a in recent_assessments
        ],
        'consultations': [
            {
                'id': c.id,
                'counsellor_name': c.counsellor.username if c.counsellor else 'Assigned Counselor',
                'time_slot': c.time_slot,
                'date': c.session_datetime.isoformat() if c.session_datetime else None,
                'status': c.status
            } for c in ConsultationRequest.query.options(joinedload(ConsultationRequest.counsellor)).filter_by(user_id=user.id, status='booked').filter(ConsultationRequest.session_datetime >= datetime.utcnow()).order_by(ConsultationRequest.session_datetime.asc()).limit(3).all()
        ],
        'recent_meditation_logs': [
            {
                'type': m.session_type,
                'duration': m.duration,
                'date': m.date.isoformat()
            } for m in MeditationSession.query.filter_by(user_id=user.id).order_by(MeditationSession.completed_at.desc()).limit(5).all()
        ]
    }

from utils.common import celery

@celery.task
def precalculate_dashboard_task(user_id):
    """Background task to pre-calculate dashboard stats and store in Redis"""
    import sys
    import os
    # Ensure root directory is in sys.path
    if os.getcwd() not in sys.path:
        sys.path.append(os.getcwd())
    import app as flask_app
    from database import cache
    from db_models import User
    with flask_app.app.app_context():
        user = User.query.get(user_id)
        if user:
            summary = get_dashboard_summary(user)
            cache.set(f"dashboard_user_{user_id}", summary, timeout=600)

def invalidate_dashboard_cache(user_id, proactive=True):
    """Invalidate cache and optionally trigger background re-calculation"""
    # cache is imported globally from database
    cache.delete(f"dashboard_user_{user_id}")
    if proactive:
        precalculate_dashboard_task.delay(user_id)

@ns.route('')
class Dashboard(Resource):
    @login_required
    @ns.marshal_with(dashboard_model)
    def get(self):
        """Get user dashboard summary stats"""
        cache_key = f"dashboard_user_{current_user.id}"
        cached_data = cache.get(cache_key)
        
        # If cache exists, return immediately for "Instant Load"
        if cached_data:
            return cached_data

        # If not, calculate, cache, and return
        result = get_dashboard_summary(current_user)
        
        # Cache for 10 minutes (invalidated on activity)
        cache.set(cache_key, result, timeout=600)
        return result
