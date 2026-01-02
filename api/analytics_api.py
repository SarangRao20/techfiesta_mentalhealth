from flask_restx import Namespace, Resource
from flask_login import login_required, current_user
from models import User, ChatSession
from sqlalchemy import and_
from datetime import datetime, timedelta

ns = Namespace('analytics', description='Platform analytics')

@ns.route('/overview')
class PlatformOverview(Resource):
    @login_required
    def get(self):
        """Get platform stats (Admin only)"""
        if current_user.role != 'admin':
            return {'message': 'Access denied'}, 403
            
        total_students = User.query.filter_by(role='student').count()
        crisis_count = ChatSession.query.filter(
            and_(ChatSession.crisis_flag == True,
                 ChatSession.session_start >= datetime.utcnow() - timedelta(days=30))
        ).count()
        
        return {
            'total_students': total_students,
            'crisis_trends_30d': crisis_count
        }, 200
