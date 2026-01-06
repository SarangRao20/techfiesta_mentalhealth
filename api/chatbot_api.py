from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import ChatSession, ChatMessage
from app import db
import json
import requests
from ollama import Client

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
        
        bot_message = "I'm here to listen."
        crisis_detected = False
        assessment_suggestion = None

        # Try FastAPI first, fallback to direct Ollama if unavailable
        try:
            fastapi_response = requests.post(
                'http://localhost:8000/send-message',
                json={'user_message': user_message},
                timeout=30
            )
            fastapi_data = fastapi_response.json()
            
            bot_message = fastapi_data.get('reply', 'I am here to listen.')
            crisis_detected = fastapi_data.get('self_harm_crisis') == 'true'
            
            # Parse intent for assessment suggestion
            intent_json_str = fastapi_data.get('intent_json', '{}')
            try:
                intent_data = json.loads(intent_json_str)
                suggested_assessment = intent_data.get('suggested_assessment', 'none')
                if suggested_assessment != 'none':
                    assessment_suggestion = {
                        'suggested_assessment': suggested_assessment,
                        'reason': f"Based on your conversation, a {suggested_assessment} assessment might be helpful."
                    }
            except:
                pass
                
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.RequestException):
            # Fallback: Direct Ollama call
            try:
                ollama_client = Client(host='http://localhost:11434')
                system_prompt = """You are a compassionate mental health assistant.
                
                HERE IS THE CATALOG OF FEATURES YOU MUST SUGGEST FROM (USE EXACT NAMES):
                1. 1/2-Minute Breathing Exercise (For quick stress/anxiety relief)
                2. Body Scan Meditation (For physical relaxation)
                3. Mindfulness Meditation (For mental clarity)
                4. Nature Sounds (For calming background)
                5. Piano Relaxation (For soothing music)
                6. Ocean Waves (For rhythmic relaxation)
                7. AR Breathing (For immersive breathing)
                8. Sound Venting Hall (For anonymous community sharing)
                9. Private Venting Room (For private emotional release)
                10. VR Meditation (For fully immersive environments)

                Return a SINGLE JSON object with:
                - intent_analysis: { emotional_state, intent_type, self_harm_crisis }
                - response: <empathetic response tailored to user's state>
                - suggested_feature: <EXACT feature name from the catalog above or "none">
                
                CRITICAL: The suggested_feature MUST match the primary suggestion in your response. 
                If you mention breathing, suggest "1/2-Minute Breathing Exercise". 
                If you mention venting, suggest "Private Venting Room".
                
                RESPONSE RULES: Speak naturally, be empathetic, non-judgmental.
                OUTPUT MUST BE JSON ONLY. NO PREAMBLE. NO POST-TEXT."""

                response = ollama_client.chat(model='llama3.2:3b', messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ])
                
                response_text = response['message']['content'].strip()
                
                def extract_json(text):
                    try:
                        start = text.find('{')
                        end = text.rfind('}')
                        if start != -1 and end != -1:
                            return json.loads(text[start:end+1])
                    except:
                        pass
                    return None

                unified_data = extract_json(response_text)
                if unified_data:
                    bot_message = unified_data.get('response', 'I am here to listen.')
                    intent_analysis = unified_data.get('intent_analysis', {})
                    crisis_detected = str(intent_analysis.get('self_harm_crisis', 'false')).lower() == 'true'
                    
                    feat = unified_data.get('suggested_feature', 'none')
                    if feat != 'none':
                        assessment_suggestion = {
                            'suggested_assessment': feat,
                            'reason': 'This feature might help you currently.'
                        }
                else:
                    bot_message = response_text.replace("```json", "").replace("```", "").strip()
            except:
                bot_message = "I'm listening. Tell me more about how you feel."

        # Save bot message to DB
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
