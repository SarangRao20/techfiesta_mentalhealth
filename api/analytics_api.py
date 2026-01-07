from flask_restx import Namespace, Resource
from flask_login import login_required, current_user
from db_models import User, ChatSession
from sqlalchemy import and_
from datetime import datetime, timedelta
from database import db

ns = Namespace('analytics', description='Platform analytics')

@ns.route('/trends')
class UserTrends(Resource):
    @login_required
    def get(self):
        """Get mood and activity trends for the current user"""
        from db_models import UserActivityLog, Assessment
        from sqlalchemy import func
        
        # Last 7 days activity counts
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        activity_counts = db.session.query(
            UserActivityLog.activity_type, 
            func.count(UserActivityLog.id)
        ).filter(
            UserActivityLog.user_id == current_user.id,
            UserActivityLog.timestamp >= seven_days_ago
        ).group_by(UserActivityLog.activity_type).all()
        
        # Severity trends from assessments
        assessments = Assessment.query.filter(
            Assessment.user_id == current_user.id
        ).order_by(Assessment.completed_at.asc()).limit(10).all()
        
        return {
            'activity_distribution': {k: v for k, v in activity_counts},
            'severity_history': [
                {
                    'date': a.completed_at.strftime('%Y-%m-%d'),
                    'score': a.score,
                    'type': a.assessment_type,
                    'severity': a.severity_level
                } for a in assessments
            ]
        }, 200

@ns.route('/overview')
class PlatformOverview(Resource):
    @login_required
    def get(self):
        """Get platform stats (Admin only)"""
        if current_user.role != 'admin':
            return {'message': 'Access denied'}, 403
            
        total_students = User.query.filter_by(role='student').count()
        return {
            'total_students': total_students
        }, 200
