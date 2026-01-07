from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ollama import Client
from pydantic import BaseModel
import json as jsonlib
from .json_sanitizer import extract_json

client = Client(host='http://localhost:11434')
intent_classifier = 'intent_classifier:latest' 
convo_LLM = 'convo_LLM:latest'

class ChatRequest(BaseModel):
    user_message: str

class ChatResponse(BaseModel):
    intent_json: str
    reply: str
    self_harm_crisis: str 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React (Vite / CRA)
        "http://localhost:5173"    # Vite default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# {
#   "emotional_state": "<value>",
#   "intent_type": "<value>",
#   "cognitive_load": "<value>",
#   "emotional_intensity": "<value>",
#   "help_receptivity": "<value>",
#   "time_focus": "<value>",
#   "context_dependency": "<value>",
#   "self_harm_crisis": "<value>"
# }


@app.get("/")
def root():
    return "hello world"
@app.post("/send-message", response_model=ChatResponse)
def send_message(req: ChatRequest):
    user_message = req.user_message

    # -------- Intent classifier --------
    intent_resp = client.generate(
        model=intent_classifier,
        prompt=user_message,
        stream=False
    )

    intent_raw = intent_resp["response"]          # STRING
    intent_json = jsonlib.loads(intent_raw)          # DICT

    # -------- Conversation model --------
    convo_resp = client.generate(
        model=convo_LLM,
        prompt=user_message + "\n" + intent_raw,
        stream=False
    )["response"]
        # STRING
    parsed = extract_json(convo_resp)

    replied_text = None
    suggested_feature = None

    if parsed:
        replied_text = parsed.get("response") or parsed.get("bot_message")
        suggested_feature = parsed.get("suggested_feature")

    reply_text = {
        "response":replied_text,
        "suggested_feature":suggested_feature
    }

    self_harm_crisis = "false"
    if intent_json.get("self_harm_crisis") == "true":
        self_harm_crisis = "true"
        # you can act on this later

    # -------- Return (must match ChatResponse) --------
    print(str(reply_text))
    return {
        "intent_json": intent_raw,   # keep as string (your model expects str)
        "reply": str(reply_text),
        "self_harm_crisis": self_harm_crisis
    }
