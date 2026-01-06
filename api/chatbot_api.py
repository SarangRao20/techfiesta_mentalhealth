from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import ChatSession, ChatMessage
from app import db
from gemini_service import chat_with_ai, suggest_assessment
import json

ns = Namespace('chatbot', description='AI Chatbot operations')

chat_message_model = ns.model('ChatMessage', {
    'message': fields.String(required=True, description='User message'),
    'session_id': fields.Integer(description='Chat session ID')
})

chat_response_model = ns.model('ChatResponse', {
    'bot_message': fields.String(),
    'crisis_detected': fields.Boolean(),
    'assessment_suggestion': fields.Raw(),
    'session_id': fields.Integer()
})

@ns.route('/chat')
class Chat(Resource):
    @login_required
    @ns.expect(chat_message_model)
    @ns.marshal_with(chat_response_model)
    def post(self):
        """Send a message to the AI chatbot"""
        data = ns.payload
        user_message = data.get('message')
        session_id = data.get('session_id')
        
        if not session_id:
            chat_session = ChatSession(user_id=current_user.id)
            db.session.add(chat_session)
            db.session.commit()
            session_id = chat_session.id
        else:
            chat_session = ChatSession.query.get_or_404(session_id)

        # Save user message
        user_msg = ChatMessage(session_id=session_id, message_type='user', content=user_message)
        db.session.add(user_msg)
        
        # Get AI Response
        try:
            bot_response = chat_with_ai(user_message, chat_history=[])
            bot_message = bot_response.get('response', 'I am here to listen.')
            crisis_detected = bot_response.get('crisis_detected', False)
            
            # Use original suggest_assessment function
            suggestion = suggest_assessment(user_message)
            assessment_suggestion = suggestion if suggestion.get('suggested_assessment') != 'none' else None
        except Exception:
            # Fallback logic
            bot_message = "I'm listening. Tell me more about how you feel."
            crisis_detected = False
            assessment_suggestion = None

        # Save bot message
        bot_msg = ChatMessage(session_id=session_id, message_type='bot', content=bot_message)
        db.session.add(bot_msg)
        
        if crisis_detected:
            chat_session.crisis_flag = True
            
        db.session.commit()
        
        return {
            'bot_message': bot_message,
            'crisis_detected': crisis_detected,
            'assessment_suggestion': assessment_suggestion,
            'session_id': session_id
        }

@ns.route('/history')
class ChatHistory(Resource):
    @login_required
    def get(self):
        """Get full chat history for the user"""
        sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.session_start.desc()).all()
        history = []
        for s in sessions:
            messages = ChatMessage.query.filter_by(session_id=s.id).order_by(ChatMessage.timestamp.asc()).all()
            history.append({
                'session_id': s.id,
                'start_time': s.session_start.isoformat(),
                'messages': [{'role': m.message_type, 'content': m.content, 'time': m.timestamp.isoformat()} for m in messages]
            })
        return history
