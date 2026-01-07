from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import ChatSession, ChatMessage
from app import db
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
    from app import app, db
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
        assessment_suggestion = None

        # Fallback helper for Ollama
        def call_ollama(msg, hist):
            ollama_client = Client(host='http://localhost:11434')
            system_prompt = """You are a compassionate mental health assistant. 

STRICT FEATURE CATALOG (ONLY suggest features from this list by number):
1. 1/2-Minute Breathing Exercise - Quick anxiety relief, panic attacks
2. Body Scan Meditation - Physical tension, grounding, body awareness
3. Mindfulness Meditation - Overthinking, mental clarity, present moment
4. Nature Sounds - Background calm, relaxation, sleep
5. Piano Relaxation - Gentle stress relief, focus
6. Ocean Waves - Deep relaxation, sleep preparation
7. AR Breathing - Interactive breathing, tech-assisted calm
8. Text Venting - Need to write/express feelings, organize thoughts, rant
9. Sound Venting - Need to speak out loud, voice emotions, verbal release
10. VR Meditation - Immersive experience, escape, deep meditation

FEATURE SELECTION GUIDE (Use variety, not just breathing!):

VENTING (angry/frustrated/need to express): 8 or 9
- "everything is pissing me off" → 8 or 9
- "I feel like screaming" → 9
- "I just want to rant" → 8
- "don't tell me what to do" → 8 or 9
- "dimag ka dahi ho gaya hai" → 8
- "sab irritate kar rahe hain" → 9

OVERTHINKING (thoughts won't stop): 3, 2, or 4
- "my thoughts won't shut up" → 3
- "stuck in my own thoughts" → 3 or 2
- "head is too loud" → 3 or 4
- "can't focus" → 3

LOW/EMPTY/NUMB (sad but not crying): 4, 5, 6, or 2
- "I feel blank" → 4 or 6
- "nothing excites me" → 5 or 6
- "just existing" → 2 or 4
- "mann bohot bhara hua hai" → 6

ANXIOUS/STRESSED (panic, overwhelm): 1 or 7
- "anxious for no reason" → 1 or 7
- "my brain is buffering" → 1
- "mentally on 1% battery" → 7 or 1

CALM SEEKING (escape, quiet): 10, 6, or 4
- "I just want some quiet" → 6 or 4
- "take me somewhere peaceful" → 10
- "switch my mind off" → 10 or 6
- "bas shaant hona hai" → 10 or 6

IMPORTANT: 
- Use features 8 and 9 when user wants to EXPRESS/RANT/TALK
- Don't suggest breathing for everything!
- Match emotional state to appropriate feature

RETURN A VALID JSON WITHOUT ANY MARKUPS:

{
  "intent_analysis": {
    "emotional_state": "<calm|neutral|low|sad|anxious|stressed|overwhelmed|frustrated|angry|numb>",
    "intent_type": "<venting|reassurance|advice|grounding|reflection|action_planning|informational|casual_chat>",
    "cognitive_load": "<low|medium|high>",
    "emotional_intensity": "<mild|moderate|high|critical>",
    "help_receptivity": "<resistant|passive|open|seeking>",
    "time_focus": "<past|present|future|mixed>",
    "context_dependency": "<standalone|session_dependent>",
    "self_harm_crisis": "<true|false>"
  },
  "response": "<Your compassionate response here>",
  "suggested_feature": "<1-10 or none>"
}

Analyze the user's message and provide appropriate emotional support."""
            msgs = [{'role': 'system', 'content': system_prompt}]
            for h in hist: msgs.append({'role': 'assistant' if h['role'] == 'bot' else 'user', 'content': h['content']})
            msgs.append({'role': 'user', 'content': msg})
            
            res = ollama_client.chat(model='llama3.2:3b', messages=msgs)
            text = res['message']['content'].strip()
            
            try:
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1:
                    return json.loads(text[start:end+1])
            except: pass
            return {"response": text}

        # Main Logic: FastAPI -> Ollama
        try:
            fastapi_response = requests.post(
                'http://localhost:8000/send-message',
                json={'user_message': user_message, 'history': chat_history},
                timeout=10
            )
            fastapi_data = fastapi_response.json()
            bot_message = fastapi_data.get('reply', '...')
            crisis_detected = fastapi_data.get('self_harm_crisis') == 'true'
            # (Suggestion logic...)
            intent_json_str = fastapi_data.get('intent_json', '{}')
            try:
                intent_data = json.loads(intent_json_str)
                suggested_assessment = intent_data.get('suggested_assessment', 'none')
                if suggested_assessment != 'none':
                    assessment_suggestion = {'suggested_assessment': suggested_assessment, 'reason': f"Based on our talk, {suggested_assessment} might help."}
            except: pass
        except:
            # Fallback to direct Ollama
            unified_data = call_ollama(user_message, chat_history)
            bot_message = unified_data.get('response', 'I am here to listen.')
            intent_analysis = unified_data.get('intent_analysis', {})
            crisis_detected = str(intent_analysis.get('self_harm_crisis', 'false')).lower() == 'true'
            
            # Map feature number to feature name
            feature_catalog = {
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
            
            feat = unified_data.get('suggested_feature', 'none')
            if feat and feat != 'none':
                # Convert number to feature name
                feature_name = feature_catalog.get(str(feat), None)
                if feature_name:
                    assessment_suggestion = {
                        'suggested_assessment': feature_name, 
                        'reason': f"I think {feature_name} might help you right now."
                    }

        # Save bot message asynchronously
        save_chat_message.delay(session_id, 'bot', bot_message, crisis_detected)
        
        # Update Redis context
        chat_history.append({'role': 'user', 'content': user_message})
        chat_history.append({'role': 'bot', 'content': bot_message})
        r_context.setex(context_key, 3600, json.dumps(chat_history[-4:])) # Keep last 4
        
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
