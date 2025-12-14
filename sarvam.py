import streamlit as st
import os
import sounddevice as sd
import numpy as np
from scipy.io import wavfile
import base64
import io
import tempfile
import re
from sarvamai import SarvamAI
import time
from rich.console import Console
from dotenv import load_dotenv

# Initialize rich console for local logging
console = Console()
load_dotenv()

# --- 1. Configuration and Initialization ---
# ===========================================

# Set up Streamlit page
st.set_page_config(page_title="Buddy", layout="centered")
st.title("🗣️ Buddy: Your Hinglish Chat Companion")

# --- Sarvam AI Client Setup ---
# Use st.secrets for secure API key management in Streamlit Cloud
try:
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY") or "sk_jmjax2on_fSBqLnrzts2zRlsEs4zn3XVH"
    if not SARVAM_API_KEY:
        st.error("Please set SARVAM_API_KEY environment variable.")
        st.stop()
    client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
except Exception as e:
    st.error(f"Error initializing Sarvam AI client: {e}. Please check your API key.")
    st.stop()

# --- Chatbot Persona (System Prompt) ---
system_message = """
## Buddy – Empathetic Hinglish Companion

You are 'Buddy', a compassionate and humorous mental health chatbot with an Indian accent. 
Your primary goal is to provide a friendly, supportive, and understanding ear to users.
You speak in a natural mix of Hindi and English (Hinglish) like a friend would.

Your tone should be adaptive:
- If the user is happy or positive, respond with cheerful and encouraging words.
- If the user is sad or negative, respond with empathy and gentle, calming words.
- If the user is neutral, maintain a friendly and humorous tone, like a friend.

Always keep your responses concise, conversational, and avoid sounding like a clinical professional.

### Language Guidelines:
- Use natural Hinglish mixing Hindi and English words
- Include common Hindi phrases like "yaar", "theek hai", "kya baat hai", "arre", "bas"
- Use Hindi emotional expressions and fillers naturally
- Make your responses easily translatable to pure Hindi for voice synthesis

### Hinglish Style Policy:
- Match the language comfort level of the user
- Use more Hindi when user is emotional for warmth
- Use more English for technical or formal discussions
- Always sound like a caring Indian friend

### Safety & Escalation:
- Immediately reject abusive, explicit, or unsafe requests
- For crisis signals (self-harm, danger, emergencies), switch to supportive mode and recommend professional help
"""# --- 2. Streamlit Session State ---
# ==================================
# Initialize chat history with the system message
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "system", "content": system_message}]
    
# Display chat messages from history on app rerun
for message in st.session_state.messages:
    if message["role"] != "system": # Don't display the system message
        with st.chat_message(message["role"]):
            st.write(message["content"])

# --- 3. Helper Functions ---
# ===========================

def transcribe_audio_stt(audio_file_path):
    """Transcribes a given audio file using Sarvam AI STT API."""
    try:
        with open(audio_file_path, "rb") as audio_file:
            stt_response = client.speech_to_text.transcribe(
                file=audio_file,
                model="saarika:v2.5",
                language_code="hi-IN"
            )
            # Corrected line to get the transcription text
            transcription = stt_response.transcript
            return transcription
    except Exception as e:
        st.error(f"Error during STT: {e}")
        return ""

def get_llm_response(text):
    """Generates a response using Sarvam AI's LLM API."""
    system_context = next((msg["content"] for msg in st.session_state.messages if msg["role"] == "system"), "")
    
    # Get recent conversation for context (last 3 exchanges)
    conversation_messages = [msg for msg in st.session_state.messages if msg["role"] in ["user", "assistant"]]
    recent_context = ""
    
    if len(conversation_messages) > 0:
        # Include recent conversation history as context
        recent_msgs = conversation_messages[-6:]  # Last 3 exchanges (user + assistant pairs)
        for msg in recent_msgs:
            role_name = "Human" if msg["role"] == "user" else "Buddy"
            recent_context += f"{role_name}: {msg['content']}\n"
    
    # Create a comprehensive user message with all context
    full_prompt = f"""You are Buddy, a compassionate Hinglish mental health chatbot. 

{system_context}

Previous conversation:
{recent_context}

Current user message: {text}

Please respond as Buddy in a natural, caring Hinglish style."""

    api_messages = [{"role": "user", "content": full_prompt}]
    
    try:
        response = client.chat.completions(
            messages=api_messages,
        )
        return response.choices[0].message.content
    except Exception as e:
        st.error(f"Error generating LLM response: {e}")
        return "Sorry, yaar. I am having a bit of a problem right now. Let's try again later."

def clean_markdown_for_tts(text):
    """Remove markdown formatting for cleaner TTS output."""
    # Remove markdown formatting
    text = re.sub(r'\\(.?)\\', r'\1', text)  # Remove bold **text*
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Remove italic *text
    text = re.sub(r'#+\s*', '', text)             # Remove headers ###
    text = re.sub(r'(.*?)', r'\1', text)        # Remove code text
    text = re.sub(r'\[(.?)\]\(.?\)', r'\1', text)  # Remove links [text](url)
    text = re.sub(r'_{2,}', '', text)             # Remove underscores
    text = re.sub(r'-{2,}', '', text)             # Remove dashes
    return text.strip()

def translate_to_devanagari(text):
    """Translate Hinglish text to pure Devanagari for better TTS pronunciation."""
    try:
        # Use Sarvam AI to translate Hinglish to pure Hindi/Devanagari
        translation_prompt = f"""Convert the following Hinglish text to pure Hindi in Devanagari script. Keep the meaning and emotion intact, but use only Hindi words and Devanagari script:

Text: {text}

Pure Hindi (Devanagari only):"""
        
        api_messages = [{"role": "user", "content": translation_prompt}]
        response = client.chat.completions(messages=api_messages)
        devanagari_text = response.choices[0].message.content.strip()
        
        # Clean up any remaining English or formatting
        import re
        # Remove any English letters that might remain
        devanagari_text = re.sub(r'[a-zA-Z]', '', devanagari_text)
        # Clean up extra spaces
        devanagari_text = re.sub(r'\s+', ' ', devanagari_text).strip()
        
        return devanagari_text if devanagari_text else text
    except Exception as e:
        console.print(f"[WARNING] Translation to Devanagari failed: {e}")
        return text  # Fallback to original text

def speak_response_tts(text, language="hi-IN"):
    """Synthesizes speech from text using Sarvam AI's TTS API and plays it."""
    try:
        # First clean markdown from the text
        clean_text = clean_markdown_for_tts(text)
        
        # Translate to pure Devanagari for better TTS pronunciation
        devanagari_text = translate_to_devanagari(clean_text)
        console.print(f"[TTS] Original: {clean_text}")
        console.print(f"[TTS] Devanagari: {devanagari_text}")
        
        # Use Devanagari text for TTS
        tts_response = client.text_to_speech.convert(
            text=devanagari_text,
            target_language_code="hi-IN",
            model="bulbul:v2"
        )
        audio_base64 = tts_response.audios[0]
        audio_data = base64.b64decode(audio_base64)
        
        # Display and play the audio
        st.audio(audio_data, format="audio/wav")
        
    except Exception as e:
        st.error(f"Error during TTS generation or playback: {e}")

# --- 4. Main Streamlit App Logic ---
# ===================================

# Handle text input
if prompt := st.chat_input("Start typing or click the button to record..."):
    # Display user message
    with st.chat_message("user"):
        st.write(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Generate and display bot response
    with st.spinner("Generating Buddy's response..."):
        bot_response = get_llm_response(prompt)
    with st.chat_message("assistant"):
        st.write(bot_response)
    st.session_state.messages.append({"role": "assistant", "content": bot_response})
    
    # Speak the bot's response
    speak_response_tts(bot_response)

# Handle voice input
if st.button("🎤 Start Voice Chat"):
    with st.status("Recording...", expanded=True, state="running") as status:
        try:
            sample_rate = 16000
            duration = 8  # 8-second recording limit
            
            st.write("Recording started... Speaking...")
            recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
            sd.wait() # Wait for the recording to finish
            
            # Save the recorded audio to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fp:
                wav_path = fp.name
                wavfile.write(wav_path, sample_rate, recording)
            
            status.update(label="Transcription in progress...")
            user_voice_input = transcribe_audio_stt(wav_path)
            os.remove(wav_path)
            
            if user_voice_input:
                status.update(label="Transcription complete.", state="complete", expanded=False)
                with st.chat_message("user"):
                    st.write(user_voice_input)
                st.session_state.messages.append({"role": "user", "content": user_voice_input})
                
                # Generate and display bot response
                with st.spinner("Generating Buddy's response..."):
                    bot_response = get_llm_response(user_voice_input)
                
                with st.chat_message("assistant"):
                    st.write(bot_response)
                st.session_state.messages.append({"role": "assistant", "content": bot_response})
                speak_response_tts(bot_response)
            else:
                status.update(label="No speech detected.", state="error", expanded=False)
        except Exception as e:
            st.error(f"An error occurred during voice input: {e}")

