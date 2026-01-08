from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import ChatSession, ChatMessage, ChatIntent, CrisisAlert
from database import db, cache
import requests
from ollama import Client
import json
from utils.celery_app import celery
from flask import current_app
import redis
import time
import os
import sys
import hashlib
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
from json_sanitizer import extract_json
from flask import current_app

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
        return msg.id  # Return message ID for linking

@celery.task
@celery.task
def save_intent_and_alert(session_id, user_id, user_message, intent_data, suggested_feature, suggested_assessment, crisis_detected):
    """Save intent analysis and create crisis alert if needed"""
    from app import app
    from database import db
    from db_models import User
    with app.app_context():
        try:
            # Extract fields from intent_data
            emotional_state = intent_data.get('emotional_state')
            intent_type = intent_data.get('intent_type')
            emotional_intensity = intent_data.get('emotional_intensity')
            cognitive_load = intent_data.get('cognitive_load')
            help_receptivity = intent_data.get('help_receptivity')
            
            # Save ChatIntent for analytics
            chat_intent = ChatIntent(
                session_id=session_id,
                user_id=user_id,
                user_message=user_message,
                intent_data=intent_data,
                emotional_state=emotional_state,
                intent_type=intent_type,
                emotional_intensity=emotional_intensity,
                cognitive_load=cognitive_load,
                help_receptivity=help_receptivity,
                self_harm_crisis=crisis_detected,
                suggested_feature=suggested_feature,
                suggested_assessment=suggested_assessment
            )
            db.session.add(chat_intent)
            db.session.flush()  # Get intent ID
            
            # Create CrisisAlert if crisis detected
            if crisis_detected:
                # Determine severity based on emotional intensity
                severity = 'critical' if emotional_intensity == 'critical' else 'high'
                
                crisis_alert = CrisisAlert(
                    user_id=user_id,
                    session_id=session_id,
                    intent_id=chat_intent.id,
                    alert_type='self_harm',
                    severity=severity,
                    message_snippet=user_message[:200],  # First 200 chars
                    intent_summary={
                        'emotional_state': emotional_state,
                        'emotional_intensity': emotional_intensity,
                        'intent_type': intent_type
                    }
                )
                db.session.add(crisis_alert)
                
                # Update ChatSession crisis flag
                chat_session = ChatSession.query.get(session_id)
                if chat_session:
                    chat_session.crisis_flag = True
                
                # Send notification to mentor via Redis
                student = User.query.get(user_id)
                if student and student.mentor_id:
                    from api.mentor_api import push_mentor_notification
                    push_mentor_notification(student.mentor_id, {
                        'type': 'crisis_alert',
                        'severity': severity,
                        'student_id': user_id,
                        'student_name': student.full_name,
                        'message': f"🚨 Crisis detected for {student.full_name}",
                        'details': user_message[:100]
                    })
            
            db.session.commit()
            print(f"✅ Saved intent {chat_intent.id} and crisis alert for user {user_id}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error saving intent/alert: {e}")

ns = Namespace('chatbot', description='AI Chatbot operations')

chat_message_model = ns.model('ChatMessage', {
    'message': fields.String(required=True, description='User message'),
    'session_id': fields.Integer(description='Chat session ID')
})

chat_response_model = ns.model('ChatResponse', {
    'response': fields.String(),
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
                'response': "You're sending messages too fast. Please take a deep breath.",
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

        # Check cache for similar messages (non-crisis only)
        msg_hash = hashlib.md5(user_message.lower().strip().encode()).hexdigest()
        cache_key = f"chatbot_resp:{msg_hash}"
        
        # Quick crisis keyword check (don't use cache for crisis) - EXPANDED LIST
        crisis_keywords = [
            'kill', 'suicide', 'die', 'end my life', 'harm myself', 'khudkushi',
            'marna', 'marna hai', 'nahi jeena', 'mar jaunga', 'marr jaunga',
            'jaan dena', 'suicide karna', 'hurt myself', 'want to die',
            'no reason to live', 'better off dead', 'can\'t go on', 'give up',
            'sos', 'help me please', 'emergency'
        ]
        is_potential_crisis = any(kw in user_message.lower() for kw in crisis_keywords)
        
        if not is_potential_crisis:
            cached_response = cache.get(cache_key)
            if cached_response:
                current_app.logger.info(f"💾 Cache HIT for message hash: {msg_hash[:8]}...")
                # Save user message
                save_chat_message.delay(session_id, 'user', user_message)
                # Save cached bot message
                save_chat_message.delay(session_id, 'bot', cached_response['response'], cached_response.get('crisis_detected', False))
                # Update Redis context
                chat_history.append({'role': 'user', 'content': user_message})
                chat_history.append({'role': 'bot', 'content': cached_response['response']})
                r_context.setex(context_key, 3600, json.dumps(chat_history[-4:]))
                
                return {
                    **cached_response,
                    'session_id': session_id
                }
            else:
                current_app.logger.info(f"💾 Cache MISS for message hash: {msg_hash[:8]}...")

        # Main Logic: Use Direct Ollama Models from app.config (2-tier system)
        try:
            # Get Ollama client and models from app config
            ollama_client = current_app.config.get('OLLAMA_CLIENT')
            intent_model = current_app.config.get('INTENT_MODEL', 'intent_classifier:latest')
            convo_model = current_app.config.get('CONVO_MODEL', 'convo_LLM:latest')
            
            if not ollama_client:
                raise Exception("Ollama client not configured in app.config")
            
            # STEP 1: Intent Classification
            current_app.logger.info(f"🔍 Classifying intent for: {user_message[:50]}...")
            intent_resp = ollama_client.generate(
                model=intent_model,
                prompt=user_message,
                stream=False
            )
            intent_raw = intent_resp['response'].strip()
            current_app.logger.info(f"📊 Intent response: {intent_raw[:100]}...")
            
            # Parse intent JSON
            try:
                intent_data = json.loads(intent_raw)
            except json.JSONDecodeError as e:
                current_app.logger.warning(f"⚠️ Intent JSON parse error: {e}. Using extract_json fallback.")
                intent_data = extract_json(intent_raw) or {}
            
            intent_json_str = json.dumps(intent_data) if intent_data else '{}'
            crisis_detected = str(intent_data.get('self_harm_crisis', 'false')).lower() == 'true'
            
            # STEP 2: Generate Conversation Response
            current_app.logger.info(f"💬 Generating response with convo_LLM")
            convo_resp = ollama_client.generate(
                model=convo_model,
                prompt=user_message + "\n" + intent_raw,
                stream=False
            )
            convo_raw = convo_resp['response'].strip()
            current_app.logger.info(f"🤖 Convo response: {convo_raw[:100]}...")
            
            # Parse conversation response
            try:
                reply_json = json.loads(convo_raw)
            except json.JSONDecodeError:
                reply_json = extract_json(convo_raw) or {}
            
            bot_message = reply_json.get('response') or reply_json.get('bot_message') or convo_raw
            suggested_feature = reply_json.get('suggested_feature', None)
            
            current_app.logger.info(f"✅ Parsed - Feature: {suggested_feature}")
            
            # CRISIS KEYWORD SAFETY CHECK (Override Ollama if crisis keywords detected)
            msg_lower = user_message.lower()
            crisis_keywords = [
                'suicide', 'kill myself', 'end my life', 'want to die', 'khudkushi', 
                'marna', 'marna hai', 'nahi jeena', 'mar jaunga', 'marr jaunga', 
                'jaan dena', 'suicide karna', 'harm myself', 'hurt myself',
                'no reason to live', 'better off dead', 'can\'t go on', 'give up',
                'sos', 'help me please', 'emergency'
            ]
            
            keyword_crisis_detected = any(kw in msg_lower for kw in crisis_keywords)
            
            if keyword_crisis_detected and not crisis_detected:
                current_app.logger.warning(f"⚠️ CRISIS OVERRIDE: Ollama missed crisis keywords in message!")
                # Override Ollama's classification
                intent_data['emotional_state'] = 'numb'
                intent_data['emotional_intensity'] = 'critical'
                intent_data['self_harm_crisis'] = 'true'
                intent_data['help_receptivity'] = 'seeking'
                intent_data['cognitive_load'] = 'high'
                intent_data['intent_type'] = 'reassurance'
                
                bot_message = "मैं यहाँ हूं तुम्हारे लिए। कृपया किसी से बात करो - परिवार, दोस्त, या हमारे counsellor से। You're not alone, and help is available. 💚"
                suggested_feature = 'VR Meditation'
                suggested_assessment = 'GHQ'
                crisis_detected = True
                intent_json_str = json.dumps(intent_data)
            
            # ASSESSMENT SUGGESTION LOGIC (Skip if already set by crisis override)
            emotional_state = intent_data.get('emotional_state', 'neutral')
            emotional_intensity = intent_data.get('emotional_intensity', 'mild')
            help_receptivity = intent_data.get('help_receptivity', 'passive')
            intent_type = intent_data.get('intent_type', 'casual_chat')
            cognitive_load = intent_data.get('cognitive_load', 'medium')
            
            if not crisis_detected:  # Only suggest if not already crisis-triggered
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
                
        except Exception as ollama_error:
            # KEYWORD-BASED FALLBACK (No Ollama needed)
            current_app.logger.error(f"❌ Ollama not available: {ollama_error}. Using keyword-based detection.")
            
            msg_lower = user_message.lower()
            
            # Crisis detection keywords (English + Hindi/Hinglish)
            crisis_keywords = [
                'suicide', 'kill myself', 'end my life', 'want to die', 'khudkushi', 
                'marna', 'marna hai', 'nahi jeena', 'mar jaunga', 'marr jaunga', 
                'jaan dena', 'suicide karna', 'harm myself', 'hurt myself',
                'no reason to live', 'better off dead', 'can\'t go on', 'give up',
                'sos', 'help me', 'emergency'
            ]
            
            is_crisis = any(kw in msg_lower for kw in crisis_keywords)
            
            # Keyword-based classification
            if is_crisis:
                intent_data = {
                    'emotional_state': 'numb',
                    'intent_type': 'reassurance',
                    'emotional_intensity': 'critical',
                    'help_receptivity': 'seeking',
                    'cognitive_load': 'high',
                    'self_harm_crisis': 'true'
                }
                bot_message = "मैं यहाँ हूं तुम्हारे लिए। कृपया किसी से बात करो - परिवार, दोस्त, या हमारे counsellor से। You're not alone, and help is available. 💚"
                suggested_feature = 'VR Meditation'
                suggested_assessment = 'GHQ'
                crisis_detected = True
            elif any(word in msg_lower for word in ['anxious', 'anxiety', 'panic', 'nervous', 'ghabrahat', 'tension']):
                intent_data = {
                    'emotional_state': 'anxious',
                    'intent_type': 'grounding',
                    'emotional_intensity': 'moderate',
                    'help_receptivity': 'seeking',
                    'cognitive_load': 'medium',
                    'self_harm_crisis': 'false'
                }
                bot_message = "I understand you're feeling anxious. Let's take it one step at a time. Try some deep breathing."
                suggested_feature = 'AR Breathing'
                suggested_assessment = 'GAD-7'
                crisis_detected = False
            elif any(word in msg_lower for word in ['sad', 'depressed', 'low', 'nahi lagra', 'bad', 'udaas']):
                intent_data = {
                    'emotional_state': 'low',
                    'intent_type': 'reassurance',
                    'emotional_intensity': 'moderate',
                    'help_receptivity': 'open',
                    'cognitive_load': 'medium',
                    'self_harm_crisis': 'false'
                }
                bot_message = "I hear you. It's okay to feel low sometimes. I'm here to listen and support you."
                suggested_feature = 'Piano Relaxation'
                suggested_assessment = 'PHQ-9'
                crisis_detected = False
            elif any(word in msg_lower for word in ['angry', 'frustrated', 'irritate', 'gussa']):
                intent_data = {
                    'emotional_state': 'frustrated',
                    'intent_type': 'venting',
                    'emotional_intensity': 'moderate',
                    'help_receptivity': 'resistant',
                    'cognitive_load': 'high',
                    'self_harm_crisis': 'false'
                }
                bot_message = "It sounds like you're frustrated. Would you like to vent about what's bothering you?"
                suggested_feature = 'Sound Venting'
                suggested_assessment = None
                crisis_detected = False
            else:
                intent_data = {
                    'emotional_state': 'neutral',
                    'intent_type': 'casual_chat',
                    'emotional_intensity': 'mild',
                    'help_receptivity': 'open',
                    'cognitive_load': 'low',
                    'self_harm_crisis': 'false'
                }
                bot_message = "I'm here to listen and support you. How are you feeling today?"
                suggested_feature = 'Nature Sounds'
                suggested_assessment = None
                crisis_detected = False
            
            intent_json_str = json.dumps(intent_data)

        # Save bot message asynchronously
        save_chat_message.delay(session_id, 'bot', bot_message, crisis_detected)
        
        # Save intent analysis and create crisis alert SYNCHRONOUSLY if crisis detected
        # (Async for non-crisis to avoid delays)
        if crisis_detected:
            try:
                intent_data_dict = json.loads(intent_json_str) if intent_json_str else {}
                current_app.logger.warning(f"🚨 CRISIS DETECTED - Saving alert SYNCHRONOUSLY for user {current_user.id}")
                
                # Extract fields from intent_data
                emotional_state = intent_data_dict.get('emotional_state')
                intent_type = intent_data_dict.get('intent_type')
                emotional_intensity = intent_data_dict.get('emotional_intensity')
                cognitive_load = intent_data_dict.get('cognitive_load')
                help_receptivity = intent_data_dict.get('help_receptivity')
                
                # Save ChatIntent for analytics
                chat_intent = ChatIntent(
                    session_id=session_id,
                    user_id=current_user.id,
                    user_message=user_message,
                    intent_data=intent_data_dict,
                    emotional_state=emotional_state,
                    intent_type=intent_type,
                    emotional_intensity=emotional_intensity,
                    cognitive_load=cognitive_load,
                    help_receptivity=help_receptivity,
                    self_harm_crisis=crisis_detected,
                    suggested_feature=suggested_feature,
                    suggested_assessment=suggested_assessment
                )
                db.session.add(chat_intent)
                db.session.flush()  # Get intent ID
                
                # Create CrisisAlert
                severity = 'critical' if emotional_intensity == 'critical' else 'high'
                crisis_alert = CrisisAlert(
                    user_id=current_user.id,
                    session_id=session_id,
                    intent_id=chat_intent.id,
                    alert_type='self_harm',
                    severity=severity,
                    message_snippet=user_message[:200],
                    intent_summary={
                        'emotional_state': emotional_state,
                        'emotional_intensity': emotional_intensity,
                        'intent_type': intent_type
                    }
                )
                db.session.add(crisis_alert)
                
                # Update ChatSession crisis flag
                chat_session = ChatSession.query.get(session_id)
                if chat_session:
                    chat_session.crisis_flag = True
                
                db.session.commit()
                current_app.logger.warning(f"✅ CRISIS ALERT SAVED: ID={crisis_alert.id}, Severity={severity}, User={current_user.id}")
                
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"❌ Failed to save crisis alert synchronously: {e}")
        else:
            # Non-crisis: use async task (Celery)
            try:
                intent_data_dict = json.loads(intent_json_str) if intent_json_str else {}
                save_intent_and_alert.delay(
                    session_id=session_id,
                    user_id=current_user.id,
                    user_message=user_message,
                    intent_data=intent_data_dict,
                    suggested_feature=suggested_feature,
                    suggested_assessment=suggested_assessment,
                    crisis_detected=crisis_detected
                )
            except Exception as e:
                current_app.logger.error(f"Failed to queue intent/alert save: {e}")
        
        # Update Redis context
        chat_history.append({'role': 'user', 'content': user_message})
        chat_history.append({'role': 'bot', 'content': bot_message})
        r_context.setex(context_key, 3600, json.dumps(chat_history[-4:])) # Keep last 4
        
        response_data = {
            'response': bot_message,
            'crisis_detected': crisis_detected,
            'sos': crisis_detected,  # SOS flag mirrors crisis detection
            'intent_json': intent_json_str,  # Include intent classification JSON
            'suggested_feature': suggested_feature,  # Feature from catalog (breathing, venting, etc.)
            'suggested_assessment': suggested_assessment,  # Assessment type (PHQ-9, GAD-7, GHQ)
            'session_id': session_id
        }
        
        # Cache response for non-crisis messages (10 min TTL)
        if not crisis_detected and not is_potential_crisis:
            cache.set(cache_key, response_data, timeout=600)
            current_app.logger.info(f"💾 Cached response for hash: {msg_hash[:8]}... (TTL: 10min)")
        elif crisis_detected or is_potential_crisis:
            # Clear any existing cache for crisis messages
            cache.delete(cache_key)
            current_app.logger.info(f"🚨 Cache CLEARED for crisis message hash: {msg_hash[:8]}")
        
        return response_data


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
