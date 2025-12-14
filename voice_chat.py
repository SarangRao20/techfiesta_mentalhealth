import os
import queue
import sounddevice as sd
import vosk
import sys
import json
import pyttsx3
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY environment variable not set.")
    sys.exit(1)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-pro")

# Initialize Vosk
vosk_model_path = os.path.join(os.path.dirname(__file__), "vosk-model")
if not os.path.exists(vosk_model_path):
    print(f"Please download the Vosk model and place it in: {vosk_model_path}")
    sys.exit(1)
vosk_model = vosk.Model(vosk_model_path)
rec = vosk.KaldiRecognizer(vosk_model, 16000)

# Initialize TTS
engine = pyttsx3.init()
engine.setProperty("rate", 160)  # Adjust speed
engine.setProperty("volume", 1.0)

# Audio queue
q = queue.Queue()

def callback(indata, frames, time, status):
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))

def speak(text):
    print("Bot:", text)
    engine.say(text)
    engine.runAndWait()

def listen_and_reply():
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype="int16",
                           channels=1, callback=callback):
        print("🎤 Speak into your mic (Ctrl+C to stop)...")
        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                result = rec.Result()
                text = json.loads(result)["text"]
                if text.strip():
                    print("You:", text)
                    try:
                        # Send to Gemini
                        response = model.generate_content(text)
                        reply = response.text.strip()
                    except Exception as e:
                        reply = f"Error getting response from Gemini: {e}"
                    # Speak reply
                    speak(reply)

if __name__ == "__main__":
    try:
        listen_and_reply()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
