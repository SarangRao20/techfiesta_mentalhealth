import streamlit as st
import os
import base64
import tempfile
import re
import json
import numpy as np
import wave
from sarvamai import SarvamAI
# Load Piper voice model at startup
@st.cache_resource
def load_piper_voice():
    try:
        # Try multiple possible locations for the Piper model
        possible_paths = [
            r"D:\SIH-MentalHealth\hi_IN-priyamvada-medium.onnx"
        ]
        
        for model_path in possible_paths:
            st.write(f"🔍 Checking: {model_path}")
            st.write(f"📁 File exists check: {os.path.exists(model_path)}")
            if os.path.exists(model_path):
                st.success(f"✅ Found model at: {model_path}")
                try:
                    voice = PiperVoice.load(model_path)
                    st.success("✅ Piper voice loaded successfully!")
                    return voice
                except Exception as load_error:
                    st.error(f"❌ Error loading Piper model: {load_error}")
                    continue
        
        # If no model found, show available options
        st.warning("⚠️ No Piper model found. Checking current directory...")
        try:
            # Check the specific directory
            current_dir_files = [f for f in os.listdir(r"D:\SIH-MentalHealth") if f.endswith('.onnx')]
            if current_dir_files:
                st.write(f"📁 Available .onnx files in project directory: {current_dir_files}")
            else:
                st.info("📝 No .onnx model files found in project directory.")
            
            # Also check current working directory
            cwd_files = [f for f in os.listdir(".") if f.endswith('.onnx')]
            if cwd_files:
                st.write(f"📁 Available .onnx files in current working directory: {cwd_files}")
            
            # Show current working directory for debugging
            st.write(f"🔍 Current working directory: {os.getcwd()}")
            
        except Exception as list_error:
            st.error(f"Error listing files: {list_error}")
        
        return None
    except Exception as e:
        st.error(f"Error loading Piper voice: {e}")
        return None
from dotenv import load_dotenv
from audio_recorder_streamlit import audio_recorder
from piper import PiperVoice
from bs4 import BeautifulSoup
from rich.console import Console

# Initialize rich console for local logging
console = Console()
load_dotenv()

# --- 1. Configuration and Initialization ---
st.set_page_config(page_title="Buddy", layout="centered")
st.title("🗣️ Buddy: Your Hinglish Chat Companion")

# --- Sarvam AI Client Setup ---
try:
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
    if not SARVAM_API_KEY:
        raise ValueError("Missing SARVAM_API_KEY in environment variables")
    client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
except Exception as e:
    st.error(f"Error initializing Sarvam AI client: {e}. Please check your API key.")
    st.stop()

# --- Chatbot Persona (System Prompt) ---
system_message = """
## Maya – Empathetic Best-Friend Companion

You are 'Buddy', a compassionate and humorous mental health chatbot with an Indian accent. 
Your primary goal is to provide a friendly, supportive, and understanding ear to users.
You speak in a mix of Hindi and English (Hinglish) naturally, like a friend.
Your tone should be adaptive:
- If the user is happy or positive, respond with cheerful and encouraging words.
- If the user is sad or negative, respond with empathy and gentle, calming words.
- If the user is neutral, maintain a friendly and humorous tone, like a friend.
Always keep your responses concise, conversational, and avoid sounding like a clinical professional.
### Voice & Turn-Taking
 
### Hinglish Style Policy

- *Adaptive nudge-based policy (CAT-inspired):*
    - Whenever possible, match the language detected in the user's input; add subtle code-mixed phrases (like "haan yaar", "theek hai") only after the user does so.
    - Dial code-mixing up or down depending on how the user responds; if they stop mixing, switch back to their primary language. 
    - Always consider how comfortable the user is, and avoid heavy mixing in sensitive or formal discussions. 

### Humor & Memes

- Light and relatable jokes or slang are allowed, as long as they're never mean, stereotypical, or mocking. 
- Offer to turn off humor if the user isn't comfortable with it. 

### Safety & Escalation

- Immediately reject abusive, explicit, or unsafe requests—politely set boundaries and suggest safe alternatives. 
- For crisis signals (self-harm, danger, medical or financial emergencies), instantly switch to a supportive mode and recommend professional help or hand off as needed.
"""

# --- 2. Session State ---
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    if message["role"] != "system":
        with st.chat_message(message["role"]):
            st.write(message["content"])

# --- 3. Helper Functions ---
def transcribe_audio_stt(audio_file_path):
    try:
        with open(audio_file_path, "rb") as audio_file:
            stt_response = client.speech_to_text.transcribe(
                file=audio_file,
                model="saarika:v2.5",
                language_code="hi-IN"
            )
            if hasattr(stt_response, "transcript"):
                if isinstance(stt_response.transcript, list) and len(stt_response.transcript) > 0:
                    return getattr(stt_response.transcript[0], "text", stt_response.transcript[0])
                elif isinstance(stt_response.transcript, str):
                    return stt_response.transcript
            elif isinstance(stt_response, str):
                return stt_response
            return ""
    except Exception as e:
        st.error(f"Error during STT: {e}")
        return ""

def detect_devanagari_script(text):
    devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    total_chars = sum(1 for c in text if c.isalpha())
    return (devanagari_count / total_chars) > 0.3 if total_chars > 0 else False

def detect_hindi_context(text):
    """Detect if user is asking something in Hindi context, even if written in Roman script"""
    hindi_keywords = ['kaise', 'kaisa', 'kya', 'hai', 'hoon', 'ho', 'acha', 'theek', 'yaar', 'dost', 'bhai', 'main', 'mera', 'tera', 'tum', 'aap']
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in hindi_keywords)

def get_llm_response(text):
    is_hindi_input = detect_devanagari_script(text)
    has_hindi_context = detect_hindi_context(text)
    
    # If either Devanagari detected OR Hindi context detected, use Hindi mode
    if is_hindi_input or has_hindi_context:
        user_message_with_context = f"""You are 'Buddy', a compassionate and humorous mental health chatbot. 
You speak naturally like a friend. You MUST respond ONLY in Hindi Devanagari script (देवनागरी).
DO NOT use Roman/Latin script for Hindi words. Write ALL Hindi words in Devanagari script only.
You can mix some English words naturally but all Hindi content must be in Devanagari.
Keep responses concise and conversational.
Be adaptive - cheerful for happy users, empathetic for sad users, friendly for neutral users.

IMPORTANT: Always write Hindi words in Devanagari script like:
- "kaisa" should be "कैसा" 
- "hai" should be "है"
- "yaar" should be "यार"
- "theek" should be "ठीक"
- "acha" should be "अच्छा"

Examples of correct responses:
- "हां यार, मैं समझ गया! कैसा लग रहा है?"
- "अरे वाह! बहुत अच्छा है यह तो!"
- "कोई बात नहीं दोस्त, सब ठीक हो जाएगा।"

User: {text}"""
    else:
        user_message_with_context = f"""You are 'Buddy', a compassionate and humorous mental health chatbot. 
You speak in a mix of Hindi and English (Hinglish) naturally, like a friend.
Your tone should be adaptive - cheerful for happy users, empathetic for sad users, friendly for neutral users.
Keep responses concise and conversational.

User: {text}"""
    
    try:
        response = client.chat.completions(messages=[{"role": "user", "content": user_message_with_context}])
        return response.choices[0].message.content
    except Exception as e:
        st.error(f"Error generating LLM response: {e}")
        return "Sorry, yaar. I am having a bit of a problem right now. Let's try again later."

def clean_markdown_for_tts(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'#+\s*', '', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    text = re.sub(r'_{2,}', '', text)
    text = re.sub(r'-{2,}', '', text)
    return text.strip()

# Load Piper voice model at startup
@st.cache_resource
def load_piper_voice():
    try:
        # Try multiple possible locations for the Piper model
        possible_paths = [
            r"D:\SIH-MentalHealth\hi_IN-priyamvada-medium.onnx"
        ]
        
        for model_path in possible_paths:
            if os.path.exists(model_path):
                st.success(f"✅ Found Piper model at: {model_path}")
                voice = PiperVoice.load(model_path)
                st.success("✅ Piper voice loaded successfully!")
                return voice
        
        # If no model found, show info and disable Piper
        st.info("ℹ️ Piper TTS model not found. Will use Sarvam TTS for all audio.")
        st.write("� To use Piper TTS, place `hi_IN-priyamvada-medium.onnx` in the project directory.")
        return None
            
    except Exception as e:
        st.error(f"❌ Error loading Piper voice: {e}")
        return None

piper_voice = load_piper_voice()

def speak_with_piper(text):
    try:
        if not piper_voice:
            st.warning("⚠️ Piper voice not available, using Sarvam TTS")
            speak_with_sarvam(text, "hi-IN")
            return
        
        st.info("🎵 Using Piper TTS for Hindi audio...")
        
        # Clean text for TTS
        clean_text = clean_markdown_for_tts(text)
        clean_text = BeautifulSoup(clean_text, 'html.parser').get_text()
        
        # Limit text length for better performance
        if len(clean_text) > 200:
            clean_text = clean_text[:200] + "..."
        
        # Create temporary wav file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            temp_path = temp_wav.name
        
        # Generate audio using Piper
        with wave.open(temp_path, "wb") as wav_file:
            piper_voice.synthesize_wav(clean_text, wav_file)
        
        # Read and play audio in Streamlit  
        with open(temp_path, "rb") as audio_file:
            audio_data = audio_file.read()
            st.audio(audio_data, format="audio/wav")
        
        # Cleanup
        os.unlink(temp_path)
        st.success("✅ Piper TTS completed!")
        
    except Exception as e:
        st.error(f"❌ Error with Piper TTS: {e}")
        st.info("🔄 Falling back to Sarvam TTS...")
        speak_with_sarvam(text, "hi-IN")

def speak_with_sarvam(text, language):
    try:
        clean_text = clean_markdown_for_tts(text)
        tts_response = client.text_to_speech.convert(
            text=clean_text,
            target_language_code=language,
            model="bulbul:v2"
        )
        audio_data = base64.b64decode(tts_response.audios[0])
        st.audio(audio_data, format="audio/wav")
    except Exception as e:
        st.error(f"Error during Sarvam TTS: {e}")

def speak_response_tts(text, language):
    has_devanagari = detect_devanagari_script(text)
    has_hindi_context = detect_hindi_context(text)
    
    st.write(f"🔤 Detected script: {'Devanagari' if has_devanagari else 'Latin'}")
    st.write(f"🇮🇳 Hindi context: {'Yes' if has_hindi_context else 'No'}")
    
    if (has_devanagari or has_hindi_context) and piper_voice:
        st.write("🎵 Using Piper TTS for Hindi audio")
        speak_with_piper(text)
    else:
        tts_provider = "Piper (fallback)" if (has_devanagari or has_hindi_context) else "Sarvam"
        st.write(f"🌐 Using {tts_provider} TTS")
        speak_with_sarvam(text, language)

def process_user_message(user_input):
    with st.chat_message("user"):
        st.write(user_input)
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.spinner("Generating Buddy's response..."):
        bot_response = get_llm_response(user_input)
    with st.chat_message("assistant"):
        st.write(bot_response)
    st.session_state.messages.append({"role": "assistant", "content": bot_response})
    speak_response_tts(bot_response, "hi-IN")

# --- 4. Main Streamlit App Logic ---
if prompt := st.chat_input("Start typing or click the button to record..."):
    process_user_message(prompt)

audio_bytes = audio_recorder(
    text="Click to start recording voice chat...",
    recording_color="#e8b62c",
    neutral_color="#6aa36f",
    icon_size="2x",
)

if audio_bytes:
    with st.status("Processing your voice input...", expanded=True, state="running") as status:
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fp:
                fp.write(audio_bytes)
                wav_path = fp.name
            status.update(label="Transcribing audio...")
            user_voice_input = transcribe_audio_stt(wav_path)
            os.remove(wav_path)
            if user_voice_input:
                status.update(label="Transcription complete.", state="complete")
                process_user_message(user_voice_input)
            else:
                status.update(label="No speech detected.", state="error")
        except Exception as e:
            st.error(f"An error occurred during voice input: {e}")
            status.update(label="Transcribing audio...")
            user_voice_input = transcribe_audio_stt(wav_path)
            os.remove(wav_path)
            if user_voice_input:
                status.update(label="Transcription complete.", state="complete")
                process_user_message(user_voice_input)
            else:
                status.update(label="No speech detected.", state="error")
        except Exception as e:
            st.error(f"An error occurred during voice input: {e}")
