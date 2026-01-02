from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import MeditationSession
from app import db
from utils import get_meditation_content
from datetime import datetime, timedelta
from sqlalchemy import func

ns = Namespace('meditation', description='Meditation content and session tracking')

meditation_session_model = ns.model('MeditationSession', {
    'duration': fields.Integer(required=True, description='Duration in seconds'),
    'session_type': fields.String(default='meditation', description='Type of session')
})

@ns.route('/content')
class MeditationContent(Resource):
    @login_required
    def get(self):
        """Get all available meditation content"""
        return get_meditation_content(), 200

@ns.route('/complete')
class CompleteMeditation(Resource):
    @login_required
    @ns.expect(meditation_session_model)
    def post(self):
        """Log a completed meditation session"""
        data = ns.payload
        duration = data.get('duration', 0)
        session_type = data.get('session_type', 'meditation')

        if duration <= 0:
            return {'message': 'Invalid duration'}, 400

        session = MeditationSession(
            user_id=current_user.id,
            session_type=session_type,
            duration=duration,
            date=datetime.utcnow().date()
        )
        db.session.add(session)
        db.session.commit()

        return {'message': 'Session recorded'}, 201
