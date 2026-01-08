from flask import current_app
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import MeditationSession, CrisisAlert, ChatSession, ChatIntent
from database import db
from utils import get_meditation_content
from datetime import datetime, timedelta
from sqlalchemy import func
from app import r_streaks
from utils.common import update_user_streak, get_user_streak

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
        sos_trigger = data.get('sos_trigger', False)

        # SOS Breathing Alert - Create Crisis Alert
        if sos_trigger or session_type == 'sos_breathing':
            from db_models import CrisisAlert, ChatSession, ChatIntent
            
            # Create or get active chat session
            chat_session = ChatSession.query.filter_by(
                user_id=current_user.id
            ).order_by(ChatSession.session_start.desc()).first()
            
            if not chat_session:
                chat_session = ChatSession(
                    user_id=current_user.id,
                    session_start=datetime.utcnow(),
                    crisis_flag=True
                )
                db.session.add(chat_session)
                db.session.flush()
            else:
                chat_session.crisis_flag = True
            
            # Create ChatIntent for analytics
            chat_intent = ChatIntent(
                session_id=chat_session.id,
                user_id=current_user.id,
                user_message='[SOS Button Clicked - AR Breathing Emergency]',
                intent_data={
                    'emotional_state': 'anxious',
                    'emotional_intensity': 'critical',
                    'intent_type': 'emergency_grounding',
                    'self_harm_crisis': 'true',
                    'trigger_source': 'ar_breathing_sos'
                },
                emotional_state='anxious',
                intent_type='emergency_grounding',
                emotional_intensity='critical',
                self_harm_crisis=True,
                suggested_feature='AR Breathing',
                suggested_assessment='GAD-7'
            )
            db.session.add(chat_intent)
            db.session.flush()
            
            # Create Crisis Alert
            crisis_alert = CrisisAlert(
                user_id=current_user.id,
                session_id=chat_session.id,
                intent_id=chat_intent.id,
                alert_type='panic_attack',
                severity='high',
                message_snippet='Student triggered SOS during AR Breathing meditation - possible panic attack or severe anxiety',
                intent_summary={
                    'emotional_state': 'anxious',
                    'emotional_intensity': 'critical',
                    'trigger': 'ar_breathing_emergency_button'
                }
            )
            db.session.add(crisis_alert)
            
            current_app.logger.warning(f'🚨 SOS BREATHING TRIGGERED by user {current_user.id}')

        if duration <= 0 and not sos_trigger:
            return {'message': 'Invalid duration'}, 400

        # Save meditation session (even for SOS with duration=0)
        session = MeditationSession(
            user_id=current_user.id,
            session_type=session_type,
            duration=duration,
            date=datetime.utcnow().date()
        )
        db.session.add(session)
        
        # Universal Activity Log
        from db_models import UserActivityLog
        log = UserActivityLog(
            user_id=current_user.id,
            activity_type='meditation',
            action='complete',
            duration=duration,
            extra_data={'session_type': session_type},
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        # Redis Streak Update
        update_user_streak(r_streaks, current_user)
        
        # Invalidate Dashboard Cache
        from api.dashboard_api import invalidate_dashboard_cache
        invalidate_dashboard_cache(current_user.id)
        
        db.session.commit()
        return {'message': 'Meditation session saved'}, 201

@ns.route('/stats')
class MeditationStats(Resource):
    @login_required
    def get(self):
        """Get user's meditation statistics"""
        stats = db.session.query(
            func.count(MeditationSession.id).label('total_sessions'),
            func.sum(MeditationSession.duration).label('total_seconds')
        ).filter_by(user_id=current_user.id).first()

        total_minutes = int((stats.total_seconds or 0) / 60)
        
        # Calculate streak (simplified version: count of distinct days in last 7 days? Or just return login streak for now)
        # For better UX, let's use the login streak or just mock it in backend if not strict.
        # But wait, User model has 'login_streak'. Let's return that or calculate real meditation streak.
        # Let's calculate distinct dates for simplicity or loop.
        # For now, let's just return total counts.
        
        return {
            'total_sessions': stats.total_sessions or 0,
            'total_minutes': total_minutes,
            'streak': get_user_streak(r_streaks, current_user)
        }, 200
