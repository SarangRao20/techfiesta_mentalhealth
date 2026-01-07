from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import UserActivityLog
from database import db
from datetime import datetime

ns = Namespace('activity', description='Universal Activity Logging')

activity_model = ns.model('ActivityLog', {
    'activity_type': fields.String(required=True, description='assessment, venting, meditation, chat, ar_vr'),
    'action': fields.String(description='start, complete, submit, result_generated'),
    'duration': fields.Integer(description='Duration in seconds'),
    'result_value': fields.Float(description='Numerical result or score'),
    'extra_data': fields.Raw(description='Additional context in JSON format')
})

@ns.route('/log')
class ActivityLog(Resource):
    @login_required
    @ns.expect(activity_model)
    def post(self):
        """Submit a new activity log entry"""
        data = ns.payload
        try:
            log_entry = UserActivityLog(
                user_id=current_user.id,
                activity_type=data.get('activity_type'),
                action=data.get('action'),
                duration=data.get('duration'),
                result_value=data.get('result_value'),
                extra_data=data.get('extra_data'),
                timestamp=datetime.utcnow(),
                date=datetime.utcnow().date()
            )
            db.session.add(log_entry)
            db.session.commit()
            return {'message': 'Activity logged successfully', 'id': log_entry.id}, 201
        except Exception as e:
            return {'message': f'Error logging activity: {str(e)}'}, 500

@ns.route('/stats')
class ActivityStats(Resource):
    @login_required
    def get(self):
        """Get summary stats for the current user's activities"""
        logs = UserActivityLog.query.filter_by(user_id=current_user.id).order_by(UserActivityLog.timestamp.desc()).limit(100).all()
        
        # Simple aggregation for summary
        stats = {
            'total_logs': len(logs),
            'by_type': {},
            'total_duration': sum((l.duration or 0) for l in logs)
        }
        
        for l in logs:
            stats['by_type'][l.activity_type] = stats['by_type'].get(l.activity_type, 0) + 1
            
        return stats, 200
