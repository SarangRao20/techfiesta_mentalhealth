import streamlit as st
import pandas as pd
import os
from datetime import datetime
import csv 

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser

# Audio features
from audiorecorder import st_audiorecorder as st_audiorec
import whisper
import pyttsx3
import threading


engine = pyttsx3.init()
voices = engine.getProperty('voices')
for idx, v in enumerate(voices):
    print(idx, v.name, v.id)

# --- Global File ---
MOOD_FILE = "mood_log.csv"

# --- App Title ---
st.title("My Empathetic Wellness Chatbot 🧠")
st.markdown("Your mood is automatically tracked. Based on your mood, the bot may suggest resources in the sidebar.")

# --- Sidebar ---
st.sidebar.header("Settings")
enable_voice = st.sidebar.checkbox("Enable Voice Features", value=True)
enable_mood_tracking = st.sidebar.checkbox("Enable Automatic Mood Tracking", value=True)

# --- (NEW) Function to Suggest a Test Based on Mood ---
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

# --- Conversation Chain Setup ---
@st.cache_resource
def get_conversation_chain():
    llm = ChatOllama(model="llama3.1:latest")
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a warm, empathetic coach and friendly companion."
         " Give answers point-wise."
         " Use same language as user (Hindi/English/Hinglish)."
         " Keep responses human-like."
         " User is based in India."
         " Suggest small steps if situation is very bad."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])
    
    # Create a simple chain with message history
    chain = prompt | llm | StrOutputParser()
    
    # Store for message history
    store = {}
    
    def get_session_history(session_id: str):
        if session_id not in store:
            store[session_id] = ChatMessageHistory()
        return store[session_id]
    
    conversation_chain = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )
    
    return conversation_chain, llm, store

conversation_chain, llm, message_store = get_conversation_chain()

# --- Session State ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "suggestion" not in st.session_state:
    st.session_state.suggestion = None

# Replay old messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- TTS ---
def speak_text(text):
    def _speak():
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
        engine.stop()
    threading.Thread(target=_speak, daemon=True).start()

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
        with st.spinner("Thinking..."):
            response = conversation_chain.invoke(
                {"input": user_input},
                config={"configurable": {"session_id": "default"}}
            )
            st.markdown(response)

            if enable_voice:
                try:
                    speak_text(response)
                except Exception as e:
                    st.error(f"Couldn't generate audio: {e}")

    st.session_state.messages.append({"role": "assistant", "content": response})

# --- Sidebar Suggestion ---
if st.session_state.suggestion:
    with st.sidebar.expander("Based on your recent chat, you might find this helpful:", expanded=True):
        suggestion = st.session_state.suggestion
        st.subheader(suggestion["name"])
        st.write(suggestion["description"])
        st.markdown(f"[Learn More Here]({suggestion['link']})")
        st.warning("**Disclaimer:** This is not a diagnosis. Please consult a healthcare professional.")

# --- Mood Visualization ---
if enable_mood_tracking:
    st.sidebar.header("Your Mood History")
    if os.path.exists(MOOD_FILE):
        df = pd.read_csv(MOOD_FILE)
        if not df.empty:
            # Map moods to numeric values for chart
            mood_map = {'😊': 2, '😐': 1, '😔': -1, '😠': -2, '😥': -1.5}
            df['mood_value'] = df['mood'].map(mood_map)
            st.sidebar.line_chart(df.set_index('timestamp')['mood_value'])
        else:
            st.sidebar.write("No moods logged yet.")
    else:
        st.sidebar.write("No moods logged yet.")

# --- Voice Input ---
if enable_voice:
    st.sidebar.header("Voice Input")
    audio_bytes = st_audiorec()
    if audio_bytes:
        temp_file = "temp_audio.wav"
        with open(temp_file, "wb") as f:
            f.write(audio_bytes)
        try:
            with st.spinner("Transcribing..."):
                result = whisper_model.transcribe(temp_file)
                transcript = result["text"]
                process_and_respond(transcript)
        except Exception as e:
            st.sidebar.error(f"Error: {e}")
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

# --- Text Input ---
if prompt := st.chat_input("How are you feeling today?"):
    process_and_respond(prompt)
