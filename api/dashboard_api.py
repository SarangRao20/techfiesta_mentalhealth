from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import User, RoutineTask, Assessment, MeditationSession, ChatSession
from sqlalchemy import func
from datetime import datetime, timedelta

ns = Namespace('dashboard', description='User dashboard and statistics')

task_stats_model = ns.model('TaskStats', {
    'total': fields.Integer(),
    'completed': fields.Integer(),
    'progress': fields.Float()
})

dashboard_model = ns.model('Dashboard', {
    'login_streak': fields.Integer(),
    'meditation_streak': fields.Integer(),
    'weekly_sessions': fields.Integer(),
    'total_minutes_meditated': fields.Integer(),
    'crisis_sessions': fields.Integer(),
    'tasks': fields.Nested(task_stats_model),
    'recent_assessments': fields.List(fields.Raw())
})

@ns.route('')
class Dashboard(Resource):
    @login_required
    @ns.marshal_with(dashboard_model)
    def get(self):
        """Get user dashboard summary stats"""
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        # Routine Tasks
        tasks_today = RoutineTask.query.filter_by(user_id=current_user.id, created_date=today).all()
        completed_tasks = [t for t in tasks_today if t.status == 'completed']
        progress = (len(completed_tasks) / len(tasks_today) * 100) if tasks_today else 0
        
        # Meditation
        weekly_meditation = MeditationSession.query.filter_by(user_id=current_user.id).filter(
            MeditationSession.date >= start_of_week
        ).all()
        
        total_seconds = sum(s.duration or 0 for s in weekly_meditation)
        
        # Crisis
        crisis_count = ChatSession.query.filter_by(user_id=current_user.id, crisis_flag=True).count()
        
        # Assessments
        recent_assessments = Assessment.query.filter_by(user_id=current_user.id).order_by(
            Assessment.completed_at.desc()
        ).limit(5).all()
        
        return {
            'login_streak': current_user.login_streak or 0,
            'meditation_streak': 0, # Placeholder
            'weekly_sessions': len(weekly_meditation),
            'total_minutes_meditated': total_seconds // 60,
            'crisis_sessions': crisis_count,
            'tasks': {
                'total': len(tasks_today),
                'completed': len(completed_tasks),
                'progress': progress
            },
            'recent_assessments': [
                {
                    'id': a.id,
                    'type': a.assessment_type,
                    'severity': a.severity_level,
                    'date': a.completed_at.isoformat()
                } for a in recent_assessments
            ]
        }
