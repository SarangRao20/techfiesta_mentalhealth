from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import ChatSession, ChatMessage
from database import db
import requests
from ollama import Client
import json
from utils.celery_app import celery
from flask import current_app
import redis
import time
import os

# Initialize redis client for chatbot context (DB index 3 as per plan)
r_context = redis.from_url(f"{os.environ.get('REDIS_URL', 'redis://localhost:6379')}/3")
r_streaks = redis.from_url(f"{os.environ.get('REDIS_URL', 'redis://localhost:6379')}/4")
from utils.common import update_user_streak

@celery.task
def save_chat_message(session_id, message_type, content, crisis_detected=False):
    from app import app
    from database import db
    with app.app_context():
        msg = ChatMessage(session_id=session_id, message_type=message_type, content=content)
        db.session.add(msg)
        if crisis_detected and message_type == 'bot':
            chat_session = ChatSession.query.get(session_id)
            if chat_session:
                chat_session.crisis_flag = True
        db.session.commit()

ns = Namespace('chatbot', description='AI Chatbot operations')

chat_message_model = ns.model('ChatMessage', {
    'message': fields.String(required=True, description='User message'),
    'session_id': fields.Integer(description='Chat session ID')
})

chat_response_model = ns.model('ChatResponse', {
    'bot_message': fields.String(),
    'crisis_detected': fields.Boolean(),
    'sos': fields.Boolean(description='Emergency SOS flag when crisis detected'),
    'intent_json': fields.String(description='Intent classification JSON from FastAPI'),
    'suggested_feature': fields.String(description='Suggested meditation/venting feature from catalog'),
    'suggested_assessment': fields.String(description='Suggested assessment (PHQ-9, GAD-7, GHQ, Inkblot)'),
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

        # Rate Limiting: Max 10 messages per minute
        rate_limit_key = f"chat_limit:{current_user.id}"
        count = r_context.get(rate_limit_key)
        if count and int(count) >= 10:
            return {
                'bot_message': "You're sending messages too fast. Please take a deep breath.",
                'crisis_detected': False,
                'session_id': session_id
            }, 429
        r_context.incr(rate_limit_key)
        if not count: r_context.expire(rate_limit_key, 60)

        # Context Management (Redis)
        context_key = f"chat_context:{session_id}"
        history_raw = r_context.get(context_key)
        chat_history = json.loads(history_raw) if history_raw else []

        # Save user message asynchronously
        save_chat_message.delay(session_id, 'user', user_message)
        
        # Redis Streak Update
        update_user_streak(r_streaks, current_user)
        
        bot_message = "I'm here to listen."
        crisis_detected = False
        suggested_feature = None  # Feature from catalog (breathing, venting, etc.)
        suggested_assessment = None  # Assessment type (PHQ-9, GAD-7, GHQ, Inkblot)
        intent_json_str = '{}' # Store intent JSON for response

        # Fallback helper for Ollama (when FastAPI unavailable)
        def call_ollama(msg, hist):
            ollama_client = Client(host='http://localhost:11434')
            
            # STEP 1: Intent Classification
            intent_prompt = f"""Classify this mental health message into JSON format.

User message: "{msg}"

Return ONLY valid JSON (no explanation, no markdown):
{{
  "emotional_state": "calm|neutral|low|sad|anxious|stressed|overwhelmed|frustrated|angry|numb",
  "intent_type": "venting|reassurance|advice|grounding|reflection|action_planning|informational|casual_chat",
  "cognitive_load": "low|medium|high",
  "emotional_intensity": "mild|moderate|high|critical",
  "help_receptivity": "resistant|passive|open|seeking",
  "time_focus": "past|present|future|mixed",
  "context_dependency": "standalone|session_dependent",
  "self_harm_crisis": "true|false"
}}"""

            try:
                intent_res = ollama_client.generate(model='llama3.2:3b', prompt=intent_prompt)
                intent_text = intent_res['response'].strip()
                
                # Extract JSON from response
                start = intent_text.find('{')
                end = intent_text.rfind('}')
                if start != -1 and end != -1:
                    intent_analysis = json.loads(intent_text[start:end+1])
                else:
                    raise ValueError("No JSON found in intent response")
            except Exception as e:
                print(f"DEBUG: Intent classification failed: {e}")
                # Keyword-based fallback
                msg_lower = msg.lower()
                if any(w in msg_lower for w in ['sad', 'low', 'nahi lagra', 'bad', 'udaas', 'depressed']):
                    intent_analysis = {"emotional_state": "low", "intent_type": "reassurance", "emotional_intensity": "moderate", "help_receptivity": "open", "cognitive_load": "medium", "self_harm_crisis": "false"}
                elif any(w in msg_lower for w in ['anxious', 'panic', 'nervous', 'ghabrahat', 'tension']):
                    intent_analysis = {"emotional_state": "anxious", "intent_type": "grounding", "emotional_intensity": "moderate", "help_receptivity": "seeking", "cognitive_load": "high", "self_harm_crisis": "false"}
                elif any(w in msg_lower for w in ['angry', 'frustrated', 'irritate', 'gussa']):
                    intent_analysis = {"emotional_state": "frustrated", "intent_type": "venting", "emotional_intensity": "moderate", "help_receptivity": "resistant", "cognitive_load": "high", "self_harm_crisis": "false"}
                else:
                    intent_analysis = {"emotional_state": "neutral", "intent_type": "casual_chat", "emotional_intensity": "mild", "help_receptivity": "open", "cognitive_load": "low", "self_harm_crisis": "false"}
            
            # STEP 2: Generate Response with Feature Suggestion
            convo_prompt = f"""You are a compassionate mental health assistant. User speaks in English/Hinglish.

User message: "{msg}"
Intent analysis: {json.dumps(intent_analysis)}

Based on the intent, suggest ONE feature:
- Text Venting (for writing feelings)
- Sound Venting (for verbal expression)
- AR Breathing (high anxiety/panic)
- 1/2-Minute Breathing Exercise (quick calm)
- Body Scan Meditation (physical tension)
- Mindfulness Meditation (overthinking)
- Nature Sounds (background calm)
- Piano Relaxation (gentle mood lift)
- Ocean Waves (deep relaxation)
- VR Meditation (intense escape/immersion)

Return ONLY valid JSON:
{{
  "response": "Your empathetic response in user's language (English/Hinglish)",
  "suggested_feature": "Feature name or none"
}}"""

            try:
                convo_res = ollama_client.generate(model='llama3.2:3b', prompt=convo_prompt)
                convo_text = convo_res['response'].strip()
                
                # Extract JSON
                start = convo_text.find('{')
                end = convo_text.rfind('}')
                if start != -1 and end != -1:
                    convo_data = json.loads(convo_text[start:end+1])
                    response_text = convo_data.get('response', convo_text)
                    suggested_feature = convo_data.get('suggested_feature', None)
                else:
                    response_text = convo_text
                    suggested_feature = None
            except Exception as e:
                print(f"DEBUG: Conversation generation failed: {e}")
                response_text = "I'm here to listen and support you."
                suggested_feature = None
            
            return {
                "response": response_text,
                "intent_analysis": intent_analysis,
                "suggested_feature": suggested_feature
            }

        # Main Logic: FastAPI -> Ollama
        try:
            fastapi_response = requests.post(
                'http://localhost:8000/send-message',
                json={'user_message': user_message, 'history': chat_history},
                timeout=10
            )
            fastapi_data = fastapi_response.json()
            
            # FastAPI returns: reply, intent_json, self_harm_crisis
            intent_json_str = fastapi_data.get('intent_json', '{}')
            crisis_detected = fastapi_data.get('self_harm_crisis') == 'true'
            reply_text = fastapi_data.get('reply', 'I am here to listen.')
            
            print(f"DEBUG FastAPI reply_text: {reply_text[:200]}...")  # Debug
            
            # Parse reply_text to extract response and suggested_feature
            # FastAPI convo_LLM returns JSON: {"response": "...", "suggested_feature": "..."}
            try:
                # Try to parse as JSON
                reply_json = json.loads(reply_text)
                bot_message = reply_json.get('response', reply_text)
                suggested_feature = reply_json.get('suggested_feature', None)
                print(f"DEBUG: Parsed reply JSON, feature={suggested_feature}")  # Debug
            except json.JSONDecodeError as e:
                # If reply is not JSON, use it as-is
                print(f"DEBUG: Reply not JSON, using as plain text: {e}")  # Debug
                bot_message = reply_text
                suggested_feature = None
            
            # Parse intent_json to suggest assessment
            try:
                intent_data = json.loads(intent_json_str)
                emotional_state = intent_data.get('emotional_state', 'neutral')
                emotional_intensity = intent_data.get('emotional_intensity', 'mild')
                help_receptivity = intent_data.get('help_receptivity', 'passive')
                intent_type = intent_data.get('intent_type', 'casual_chat')
                cognitive_load = intent_data.get('cognitive_load', 'medium')
                
                # ASSESSMENT SUGGESTION LOGIC
                # PHQ-9: Depression screening (sad, low, numb)
                if emotional_state in ['sad', 'numb', 'low'] and emotional_intensity in ['moderate', 'high']:
                    suggested_assessment = 'PHQ-9'
                # GAD-7: Anxiety screening (anxious, stressed, overwhelmed)
                elif emotional_state in ['anxious', 'stressed', 'overwhelmed'] and emotional_intensity in ['moderate', 'high']:
                    suggested_assessment = 'GAD-7'
                # GHQ: General health for critical cases
                elif emotional_intensity == 'critical':
                    suggested_assessment = 'GHQ'
                # Inkblot: For emotional numbness, dissociation, difficulty expressing, complex trauma
                elif (emotional_state == 'numb' and emotional_intensity in ['moderate', 'high']) or \
                     (help_receptivity == 'resistant' and emotional_intensity == 'high') or \
                     (intent_type in ['reflection', 'venting'] and emotional_state in ['numb', 'frustrated', 'angry'] and cognitive_load == 'high'):
                    suggested_assessment = 'Inkblot'
            except Exception as e:
                print(f"Error parsing intent_json from FastAPI: {e}")
                
        except Exception as fastapi_error:
            # Fallback to direct Ollama if FastAPI fails
            print(f"FastAPI unavailable, using Ollama fallback: {fastapi_error}")
            unified_data = call_ollama(user_message, chat_history)
            bot_message = unified_data.get('response', 'I am here to listen.')
            intent_analysis = unified_data.get('intent_analysis', {})
            
            # If intent_analysis is empty, set defaults based on message keywords
            if not intent_analysis:
                print("DEBUG: Intent analysis empty, using keyword-based fallback")
                msg_lower = user_message.lower()
                
                # Simple keyword-based classification
                if any(word in msg_lower for word in ['anxious', 'anxiety', 'panic', 'nervous', 'ghabrahat']):
                    intent_analysis = {
                        'emotional_state': 'anxious',
                        'intent_type': 'grounding',
                        'emotional_intensity': 'moderate',
                        'help_receptivity': 'seeking',
                        'cognitive_load': 'medium'
                    }
                elif any(word in msg_lower for word in ['sad', 'depressed', 'low', 'nahi lagra', 'bad', 'udaas']):
                    intent_analysis = {
                        'emotional_state': 'low',
                        'intent_type': 'reassurance',
                        'emotional_intensity': 'moderate',
                        'help_receptivity': 'open',
                        'cognitive_load': 'medium'
                    }
                elif any(word in msg_lower for word in ['angry', 'frustrated', 'irritate', 'gussa']):
                    intent_analysis = {
                        'emotional_state': 'frustrated',
                        'intent_type': 'venting',
                        'emotional_intensity': 'moderate',
                        'help_receptivity': 'resistant',
                        'cognitive_load': 'high'
                    }
                else:
                    intent_analysis = {
                        'emotional_state': 'neutral',
                        'intent_type': 'casual_chat',
                        'emotional_intensity': 'mild',
                        'help_receptivity': 'open',
                        'cognitive_load': 'low'
                    }
            
            crisis_detected = str(intent_analysis.get('self_harm_crisis', 'false')).lower() == 'true'
            
            # Store intent_analysis as JSON string for response
            intent_json_str = json.dumps(intent_analysis) if intent_analysis else '{}'
            
            # Get suggested_feature from Ollama response (could be name or number)
            suggested_feature_raw = unified_data.get('suggested_feature', 'none')
            
            # Feature mapping (if Ollama returns number instead of name)
            feature_map = {
                '1': '1/2-Minute Breathing Exercise',
                '2': 'Body Scan Meditation',
                '3': 'Mindfulness Meditation',
                '4': 'Nature Sounds',
                '5': 'Piano Relaxation',
                '6': 'Ocean Waves',
                '7': 'AR Breathing',
                '8': 'Text Venting',
                '9': 'Sound Venting',
                '10': 'VR Meditation'
            }
            
            # Check if it's a number or already a feature name
            if suggested_feature_raw and suggested_feature_raw != 'none':
                if suggested_feature_raw in feature_map:
                    suggested_feature = feature_map[suggested_feature_raw]
                elif suggested_feature_raw in feature_map.values():
                    suggested_feature = suggested_feature_raw
                else:
                    # Fallback to intent-based suggestion
                    suggested_feature = None
            
            # If no valid feature from Ollama, determine from intent
            if not suggested_feature:
                # Get emotional parameters
                emotional_state = intent_analysis.get('emotional_state', 'neutral')
                emotional_intensity = intent_analysis.get('emotional_intensity', 'mild')
                intent_type = intent_analysis.get('intent_type', 'casual_chat')
                help_receptivity = intent_analysis.get('help_receptivity', 'passive')
                cognitive_load = intent_analysis.get('cognitive_load', 'medium')
                
                # FEATURE SUGGESTION (same logic as FastAPI path)
                if intent_type == 'venting':
                    suggested_feature = 'Text Venting' if help_receptivity in ['resistant', 'passive'] else 'Sound Venting'
                elif emotional_state in ['anxious', 'stressed', 'overwhelmed']:
                    if cognitive_load == 'high' or emotional_intensity == 'high':
                        suggested_feature = 'AR Breathing'
                    else:
                        suggested_feature = '1/2-Minute Breathing Exercise'
                elif emotional_state in ['sad', 'low', 'numb']:
                    if emotional_state == 'numb':
                        suggested_feature = 'Ocean Waves'
                    else:
                        suggested_feature = 'Piano Relaxation'
                elif intent_type == 'grounding':
                    suggested_feature = 'Body Scan Meditation'
                elif emotional_state in ['frustrated', 'angry']:
                    suggested_feature = 'Sound Venting'
                elif intent_type == 'reflection':
                    suggested_feature = 'Mindfulness Meditation'
                elif emotional_intensity == 'critical':
                    suggested_feature = 'VR Meditation'
                else:
                    suggested_feature = 'Nature Sounds'
            
            # Get emotional parameters for assessment
            emotional_state = intent_analysis.get('emotional_state', 'neutral')
            emotional_intensity = intent_analysis.get('emotional_intensity', 'mild')
            intent_type = intent_analysis.get('intent_type', 'casual_chat')
            help_receptivity = intent_analysis.get('help_receptivity', 'passive')
            cognitive_load = intent_analysis.get('cognitive_load', 'medium')
            
            # ASSESSMENT SUGGESTION
            if emotional_state in ['sad', 'numb', 'low'] and emotional_intensity in ['moderate', 'high']:
                suggested_assessment = 'PHQ-9'
            elif emotional_state in ['anxious', 'stressed', 'overwhelmed'] and emotional_intensity in ['moderate', 'high']:
                suggested_assessment = 'GAD-7'
            elif emotional_intensity == 'critical':
                suggested_assessment = 'GHQ'
            # Inkblot: For numb, resistant, complex emotional states
            elif (emotional_state == 'numb' and emotional_intensity in ['moderate', 'high']) or \
                 (help_receptivity == 'resistant' and emotional_intensity == 'high') or \
                 (intent_type in ['reflection', 'venting'] and emotional_state in ['numb', 'frustrated', 'angry'] and cognitive_load == 'high'):
                suggested_assessment = 'Inkblot'

        # Save bot message asynchronously
        save_chat_message.delay(session_id, 'bot', bot_message, crisis_detected)
        
        # Update Redis context
        chat_history.append({'role': 'user', 'content': user_message})
        chat_history.append({'role': 'bot', 'content': bot_message})
        r_context.setex(context_key, 3600, json.dumps(chat_history[-4:])) # Keep last 4
        
        return {
            'bot_message': bot_message,
            'crisis_detected': crisis_detected,
            'sos': crisis_detected,  # SOS flag mirrors crisis detection
            'intent_json': intent_json_str,  # Include intent classification JSON
            'suggested_feature': suggested_feature,  # Feature from catalog (breathing, venting, etc.)
            'suggested_assessment': suggested_assessment,  # Assessment type (PHQ-9, GAD-7, GHQ)
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
