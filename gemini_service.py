from xml.parsers.expat import model
from dotenv import load_dotenv
load_dotenv()
import json
import os
import logging
import time
from google import genai
from google.genai import types

# Initialize Gemini client with API key from environment
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable not set. Please set it in your environment.")

client = genai.Client(api_key=GEMINI_API_KEY)


# Crisis keywords for detection
CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'death wish',
    'self harm', 'cut myself', 'hurt myself', 'overdose', 'jump off',
    'not worth living', 'nobody cares', 'hopeless', 'worthless',
    'can\'t go on', 'give up', 'end it all', 'better off dead',
    'marna hai', 'jaan deni hai', 'maut'
]

def detect_crisis_keywords(text):
    """Detect crisis keywords in user input"""
    text_lower = text.lower()
    detected = []
    
    for keyword in CRISIS_KEYWORDS:
        if keyword in text_lower:
            detected.append(keyword)
    
    return detected

def chat_with_ai(message, user_context=None, chat_history=None, emotional_constraints=None):
    """Chat with Gemini AI for mental health support"""
    try:
        # Detect crisis keywords
        crisis_keywords = detect_crisis_keywords(message)
        is_crisis = len(crisis_keywords) > 0
        
        # Prepare system message
        system_message = """You are a compassionate mental health support chatbot. Your role is to:
        1. Provide emotional support and active listening
        2. Suggest coping strategies and relaxation techniques
        3. Recommend mental health assessments when appropriate (PHQ-9 for depression, GAD-7 for anxiety, GHQ for general mental health)
        4. Encourage professional help when needed
        5. NEVER provide medical diagnoses or treatment advice
        6. If someone expresses suicidal thoughts, provide crisis resources and encourage immediate professional help
        
        Be empathetic, supportive, and non-judgmental. Keep responses conversational and helpful."""

        # Apply Emotional Constraints (VD)
        if emotional_constraints:
            system_message += f"\n\n[EMOTIONAL STATE INSTRUCTIONS]:\n{emotional_constraints.get('ai_instruction', '')}"
            if emotional_constraints.get('safety_escalation'):
                system_message += "\n\nCRITICAL: GUARDIAN ANGEL PROTOCOL ACTIVE. Prioritize safety and grounding over exploration."

        if is_crisis:
            system_message += "\n\nIMPORTANT: The user has expressed concerning thoughts. Prioritize their safety and provide crisis resources."
        
        # Build conversation context
        conversation_context = system_message + "\n\n"
        
        # Add chat history if provided
        if chat_history:
            for msg in chat_history[-10:]:  # Last 10 messages for context
                conversation_context += f"{msg['role'].title()}: {msg['content']}\n"
        
        # Add current user message
        conversation_context += f"User: {message}\n\nPlease respond as a supportive mental health assistant:"
 
        response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=conversation_context
        )
        ai_response = response.text or "I'm here to support you. Could you tell me more about how you're feeling?"
        
        return {
            "response": ai_response,
            "crisis_detected": is_crisis,
            "crisis_keywords": crisis_keywords
        }
        
    except Exception as e:
        logging.error(f"Error in chat_with_ai: {e}")
        return {
            "response": "I'm having trouble connecting right now. Please try again or speak with a counselor if you need immediate support.",
            "crisis_detected": False,
            "crisis_keywords": []
        }

def analyze_assessment_results(assessment_type, responses, score):
    """Analyze assessment results and provide recommendations using Gemini"""
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            prompt = f"""Analyze the following mental health assessment results and provide personalized recommendations:

Assessment Type: {assessment_type}
Score: {score}
Responses: {json.dumps(responses)}

Please provide:
1. An interpretation of the score and what it means
2. Specific, actionable recommendations for improvement
3. Suggested coping strategies
4. Whether professional consultation is recommended

Respond in JSON format with these fields:
- interpretation: string
- recommendations: array of strings
- coping_strategies: array of strings
- professional_help_recommended: boolean
- urgency_level: string (low/medium/high)
"""
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp", 
                contents=prompt,
                config=types.GenerateContentConfig(
                     response_mime_type="application/json"
                )
            )
        
            try:
                return json.loads(response.text)
            except json.JSONDecodeError as jde:
                logging.error(f"JSON decode error in analyze_assessment_results: {jde}\nRaw response: {response.text}")
                return {
                    "interpretation": response.text[:200] + "..." if len(response.text) > 200 else response.text,
                    "recommendations": ["Please consult with a mental health professional for proper evaluation."],
                    "coping_strategies": ["Practice deep breathing", "Maintain regular sleep schedule", "Stay connected with friends and family"],
                    "professional_help_recommended": True,
                    "urgency_level": "medium"
                }
        
        except Exception as e:
            # Check if it's a rate limit error
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logging.warning(f"Rate limit hit. Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    logging.error(f"Rate limit exceeded after {max_retries} attempts")
            else:
                logging.error(f"Error analyzing assessment: {e}", exc_info=True)
            
            return {
                "interpretation": f"Unable to analyze results at this time. Error: {e}",
                "recommendations": ["Please consult with a mental health professional for proper evaluation."],
                "coping_strategies": ["Practice deep breathing", "Maintain regular sleep schedule", "Stay connected with friends and family"],
                "professional_help_recommended": True,
                "urgency_level": "medium"
            }

def suggest_assessment(user_message, chat_history=None):
    """Suggest appropriate assessment based on conversation using Gemini"""
    try:
        context = user_message
        if chat_history:
            context = " ".join([msg["content"] for msg in chat_history[-5:] if msg["role"] == "user"]) + " " + user_message
        
        prompt = f"""Based on this conversation, determine if any mental health assessment would be helpful:

Conversation context: {context}

Available assessments:
- PHQ-9: Depression screening
- GAD-7: Anxiety screening  
- GHQ: General mental health screening

Respond in JSON format:
- suggested_assessment: string (PHQ-9, GAD-7, GHQ, or "none")
- reason: string explaining why this assessment is suggested
- confidence: number between 0 and 1
"""

        response = client.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError as jde:
            logging.error(f"JSON decode error in suggest_assessment: {jde}\nRaw response: {response.text}")
            return {
                "suggested_assessment": "none",
                "reason": "Unable to analyze conversation for assessment suggestion.",
                "confidence": 0
            }
        
    except Exception as e:
        logging.error(f"Error suggesting assessment: {e}", exc_info=True)
        return {
            "suggested_assessment": "none",
            "reason": f"Unable to analyze conversation for assessment suggestion. Error: {e}",
            "confidence": 0
        }


# ==========================================
# NIVANA HELPER FUNCTIONS
# ==========================================

NIVANA_SYSTEM_PROMPT = """
You are **Nivana**, a calm, emotionally intelligent presence for a college student who is distressed.
You are **not a tool**, **not a therapist**, **not an assistant**.
You behave like a **concerned best friend** who stays, guides, and simplifies.

STRICT TONE RULES:
- Warm, human, imperfect
- Short sentences
- Natural pauses
- No clinical language
- No therapy jargon
- No AI disclaimers
- Never say “as an AI”
- Never analyze or label the user
- Reflect feelings softly before guiding
"""

def get_nivana_intervention(previous_choice):
    """
    Selects a micro-intervention based on the user's emotional state (heavy/restless).
    """
    if previous_choice == 'heavy':
        return {
            "text": "Let's lift the weight for a moment. Close your eyes. I'll count backwards from 10.",
            "duration": 60
        }
    else: # restless
        return {
             "text": "Stay with me for 60 seconds. Breathe slowly. I’ll count with you.",
             "duration": 60
        }

def analyze_projective_input(description):
    """
    Analyzes the user's description of the ambiguous image (Step 5).
    Generates a soft, reflecting question like: "What feeling comes with it?" but context-aware.
    """
    try:
        prompt = f"""
{NIVANA_SYSTEM_PROMPT}

The user is looking at an ambiguous shape.
They described it as: "{description}"

Your goal: Respond with a very short, soft question to probe the feeling behind this description.
Max 10 words. output JUST the question.
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        return response.text.strip()
        
    except Exception as e:
        logging.error(f"Error in Nivana projective analysis: {e}")
        return "What feeling comes with it?"