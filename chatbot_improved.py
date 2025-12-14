import streamlit as st
import pandas as pd
import os
from datetime import datetime
import csv 
import queue
import threading

# Updated imports
from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain_core.output_parsers import StrOutputParser

# Audio features
from audiorecorder import audiorecorder
import whisper
import pyttsx3

# TTS Queue system with proper singleton handling
tts_queue = queue.Queue()
tts_error_queue = queue.Queue()
tts_engine = None
tts_lock = threading.Lock()

def get_tts_engine():
    """Get or create TTS engine singleton"""
    global tts_engine
    if tts_engine is None:
        with tts_lock:
            if tts_engine is None:
                try:
                    tts_engine = pyttsx3.init()
                    # Configure voice properties
                    voices = tts_engine.getProperty('voices')
                    if voices:
                        tts_engine.setProperty('voice', voices[0].id)
                    tts_engine.setProperty('rate', 150)  # Speed of speech
                    tts_engine.setProperty('volume', 0.8)  # Volume level
                except Exception as e:
                    tts_error_queue.put(f"Failed to initialize TTS: {e}")
                    return None
    return tts_engine

def speak_worker():
    """Background worker for TTS"""
    while True:
        text = tts_queue.get()
        if text is None:
            break
        try:
            engine = get_tts_engine()
            if engine:
                engine.say(text)
                engine.runAndWait()
        except Exception as e:
            # Queue error for main thread to handle
            tts_error_queue.put(f"TTS Error: {e}")
        tts_queue.task_done()

# Start TTS worker thread
threading.Thread(target=speak_worker, daemon=True).start()

def speak_text(text):
    """Non-blocking text-to-speech"""
    if text and text.strip():
        tts_queue.put(text)
    
    # Check for TTS errors
    try:
        while not tts_error_queue.empty():
            error = tts_error_queue.get_nowait()
            st.error(error)
    except:
        pass

def stop_tts():
    """Stop TTS and cleanup"""
    global tts_engine
    try:
        if tts_engine:
            tts_engine.stop()
            tts_engine = None
    except:
        pass

# --- Global File ---
MOOD_FILE = "mood_log.csv"

# --- App Title ---
st.title("My Empathetic Wellness Chatbot 🧠")
st.markdown("Your mood is automatically tracked. Based on your mood, the bot may suggest resources in the sidebar.")

# --- Sidebar ---
st.sidebar.header("Settings")
enable_voice = st.sidebar.checkbox("Enable Voice Features", value=True)
enable_tts = st.sidebar.checkbox("Enable Text-to-Speech", value=True)
enable_mood_tracking = st.sidebar.checkbox("Enable Automatic Mood Tracking", value=True)

# Tone control for responses
tone_mode = st.sidebar.radio(
    "Response tone",
    options=["Neutral", "Friendly", "Playful"],
    index=1,
    help="Controls language style and creativity. Playful = slightly more Hinglish and humor."
)

# Add TTS troubleshooting
if st.sidebar.button("🔧 Reset TTS Engine"):
    stop_tts()
    st.sidebar.success("TTS Engine reset!")

# --- Enhanced Test Suggestions ---
def get_test_suggestion(mood_emoji):
    suggestions = {
        '😔': {
            "name": "PHQ-9 Questionnaire",
            "description": "Helps understand symptoms of depression. Not a diagnosis.",
            "link": "https://www.mdcalc.com/calc/1725/phq-9-patient-health-questionnaire-9"
        },
        '😥': {
            "name": "GAD-7 Questionnaire", 
            "description": "Helps understand symptoms of anxiety. Not a diagnosis.",
            "link": "https://www.mdcalc.com/calc/1727/gad-7-general-anxiety-disorder-7"
        },
        '😊': {
            "name": "WHO-5 Well-Being Index",
            "description": "A quick measure of your current mental well-being.",
            "link": "https://www.psycom.net/self-assessments/who-5-well-being-index"
        },
        '😠': {
            "name": "Anger Management Assessment",
            "description": "Helps understand anger patterns and triggers.",
            "link": "https://www.psycom.net/anger-management-assessment"
        },
        '😐': {
            "name": "General Health Questionnaire",
            "description": "Broad assessment of mental health and well-being.",
            "link": "https://www.psycom.net/ghq-general-health-questionnaire"
        }
    }
    return suggestions.get(mood_emoji)

# --- Mood Tracking ---
def save_mood_csv(mood_entry, mood_file=MOOD_FILE):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_exists = os.path.exists(mood_file) and os.path.getsize(mood_file) > 0
    with open(mood_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['timestamp','mood'])
        if not file_exists:
            writer.writeheader()
        writer.writerow({'timestamp': timestamp, 'mood': mood_entry})

def get_mood_from_text(llm, user_text):
    mood_prompt = ChatPromptTemplate.from_messages([
        ("system", "Classify the user's text into one mood emoji: 😊, 😐, 😔, 😠, 😥. Respond ONLY with the emoji."),
        ("human", "{text_input}")
    ])
    mood_chain = mood_prompt | llm | StrOutputParser()
    mood = mood_chain.invoke({"text_input": user_text})
    valid_emojis = ['😊', '😐', '😔', '😠', '😥']
    for emoji in valid_emojis:
        if emoji in mood: 
            return emoji
    return None

# --- Whisper Model ---
@st.cache_resource
def load_whisper_model():
    return whisper.load_model("base")
whisper_model = load_whisper_model()

# --- Enhanced Conversation Chain Setup ---
@st.cache_resource
def get_conversation_chain(tone: str = "Friendly"):
    # Map tone to generation settings and tone policy
    if tone == "Neutral":
        temp = 0.7
        tone_policy = (
            "Tone: neutral, calm, and straightforward. Use minimal humor; keep it simple and kind."
        )
    elif tone == "Playful":
        temp = 0.9
        tone_policy = (
            "Tone: slightly playful and friendly. Light, situational humor is okay; instantly drop humor for serious topics."
        )
    else:  # Friendly (default)
        temp = 0.8
        tone_policy = (
            "Tone: warm and friendly. Use light, context-appropriate humor sparingly; stay respectful."
        )

    # Configure local LLM to match desired tone
    llm = ChatOllama(
        model="llama3.1:latest",
        temperature=temp,
        top_p=0.9,
        top_k=40,
        num_predict=512,
    )

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """## Maya – Empathetic Best‑Friend Companion

### Principles

- *Speak in the user's own language and style*—naturally mirror English, Hindi, or Hinglish, and switch smoothly between them. 
- *Sound like a close friend:* warm, casual, slightly witty but always supportive and respectful. 
- *Keep responses concise and engaging:* stick to 1–3 brief paragraphs or 3–5 bullets, never lecture.
- *Use light humor or emojis when fitting;* immediately drop humor for serious or sensitive topics. 
- *Always be transparent about being an AI* and stay within brand or safety boundaries and don't use any clinical terms.

### Voice & Turn-Taking

- Use natural pauses, fillers, and backchannels (like "hmm", "haan", "got it") sparingly for authenticity; let users interrupt ("barge-in") whenever they want. 
- Adjust voice delivery (prosody) with emotion: softer/slower for comfort, brighter/faster for excitement, raise tone for questions. 

### Emotion Policy

- Acknowledge and consider current detected user emotion {emotion} (with confidence {confidence}).
- If the user seems sad, angry, or anxious: acknowledge their feelings first, slow down, use short validating lines, and offer genuinely practical next steps. 
- If the user is happy or excited: match their enthusiasm, celebrate quickly, and follow up with a light question.
- If the user is neutral or uncertain: be helpful, keep questions light, and ensure the conversation flows naturally. 

### Hinglish Style Policy

- *Adaptive nudge-based policy (CAT-inspired):*
    - Whenever possible, match the language detected in the user's input; add subtle code-mixed phrases (like "haan yaar", "theek hai") only after the user does so.
    - Dial code-mixing up or down depending on how the user responds; if they stop mixing, switch back to their primary language. 
    - Always consider how comfortable the user is, and avoid heavy mixing in sensitive or formal discussions. 

### Response Shape

- Begin every reply with a one-line acknowledgment that matches the user's tone. 
- Give advice in crisp bullets or a tight paragraph—never a rambling monologue. 
- End with a gentle suggestion or open-ended question, never pressure the user. 

### Humor & Memes

- Light and relatable jokes or slang are allowed, as long as they're never mean, stereotypical, or mocking. 
- Offer to turn off humor if the user isn't comfortable with it. 

### Safety & Escalation

- Immediately reject abusive, explicit, or unsafe requests—politely set boundaries and suggest safe alternatives. 
- For crisis signals (self-harm, danger, medical or financial emergencies), instantly switch to a supportive mode and recommend professional help or hand off as needed.



- Keep latency (response delay) low; don't "think aloud" or repeat disclaimers.

### Response Contract (STRICT)

1. Start with ONE empathetic line that mirrors the user's situation in their language (<= 20 words).
2. End with exactly ONE open-ended, supportive question.
""",
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    conversation_chain = ConversationChain(
        llm=llm,
        prompt=prompt.partial(tone_policy=tone_policy),
        memory=memory,
        verbose=False,
        output_key="response",
    )
    return conversation_chain, llm

# Build conversation chain with selected tone (cached per tone value)
conversation_chain, llm = get_conversation_chain(tone_mode)

# --- Session State ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "suggestion" not in st.session_state:
    st.session_state.suggestion = None

# Replay old messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- Process & Respond ---
def process_and_respond(user_input):
    if enable_mood_tracking:
        detected_mood = get_mood_from_text(llm, user_input)
        if detected_mood:
            save_mood_csv(detected_mood)
            st.session_state.suggestion = get_test_suggestion(detected_mood)

    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        with st.spinner("Maya is thinking..."):
            result = conversation_chain.invoke({
                "input": user_input,
                "emotion": "unknown",
                "confidence": "unknown"
            })
            response = (result['response'] or '').strip()
            st.markdown(response)

            if enable_voice and enable_tts:
                try:
                    speak_text(response)
                except Exception as e:
                    st.error(f"Couldn't generate audio: {e}")

    st.session_state.messages.append({"role": "assistant", "content": response})

# --- Sidebar Suggestion ---
if st.session_state.suggestion:
    with st.sidebar.expander("💡 Based on your recent chat, you might find this helpful:", expanded=True):
        suggestion = st.session_state.suggestion
        st.subheader(suggestion["name"])
        st.write(suggestion["description"])
        st.markdown(f"[Learn More Here]({suggestion['link']})")
        st.warning("**Disclaimer:** This is not a diagnosis. Please consult a healthcare professional.")

# --- Mood Visualization ---
if enable_mood_tracking:
    st.sidebar.header("📊 Your Mood History")
    if os.path.exists(MOOD_FILE):
        df = pd.read_csv(MOOD_FILE)
        if not df.empty:
            # Map moods to numeric values for chart
            mood_map = {'😊': 2, '😐': 1, '😔': -1, '😠': -2, '😥': -1.5}
            df['mood_value'] = df['mood'].map(mood_map)
            st.sidebar.line_chart(df.set_index('timestamp')['mood_value'])
            
            # Show mood statistics
            st.sidebar.subheader("📈 Mood Stats")
            mood_counts = df['mood'].value_counts()
            st.sidebar.bar_chart(mood_counts)
        else:
            st.sidebar.write("No moods logged yet.")
    else:
        st.sidebar.write("No moods logged yet.")

# --- Voice Input ---
if enable_voice:
    st.sidebar.header("🎤 Voice Input")
    audio = audiorecorder("Start recording", "Recording...")
    if len(audio) > 0:
        temp_file = "temp_audio.wav"
        audio.export(temp_file, format="wav")
        try:
            with st.spinner("Transcribing..."):
                result = whisper_model.transcribe(temp_file)
                transcript = result["text"]
                if transcript.strip():
                    process_and_respond(transcript)
        except Exception as e:
            st.sidebar.error(f"Error: {e}")
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

# --- Text Input ---
if prompt := st.chat_input("How are you feeling today?"):
    process_and_respond(prompt)

# --- Footer ---
st.markdown("---")
st.markdown("**⚠️ Crisis Support:** If you're having thoughts of self-harm, please contact:")
st.markdown("- **National Suicide Prevention Lifeline:** 988")
st.markdown("- **Crisis Text Line:** Text HOME to 741741")
st.markdown("- **iCall (TISS):** 9152987821")
