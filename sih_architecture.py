from graphviz import Digraph
import os

# Set Graphviz executable path for Windows
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"

# Create directed graph
dot = Digraph("SIH_Architecture", format="png")
dot.attr(rankdir="TB", splines="ortho", nodesep="0.6", ranksep="0.8")

# -------------------------
# Node styles
# -------------------------
frontend_style = {"shape": "box", "style": "filled,rounded", "fillcolor": "#ADD8E6", "color": "#004080"}
backend_style  = {"shape": "box", "style": "filled,rounded", "fillcolor": "#B0E0E6", "color": "#006666"}
ai_style       = {"shape": "box", "style": "filled,rounded", "fillcolor": "#FFD580", "color": "#CC8400"}
db_style       = {"shape": "cylinder", "style": "filled", "fillcolor": "#FF9999", "color": "#800000"}
external_style = {"shape": "ellipse", "style": "filled", "fillcolor": "#90EE90", "color": "#006400"}
admin_style    = {"shape": "box", "style": "filled,rounded", "fillcolor": "#DDA0DD", "color": "#660066"}

# -------------------------
# Layers
# -------------------------
# Frontend
dot.node("mobile", "📱 Mobile App (Android/iOS)", **frontend_style)
dot.node("web", "💻 Web App (React)", **frontend_style)

# API Gateway
dot.node("api", "API Gateway / Backend Service", **backend_style)

# AI/Processing Layer
dot.node("nlp", "🤖 LLM/NLP Engine (Sarvam AI, Local LLM)", **ai_style)
dot.node("voice", "🎤 Speech-to-Text & TTS", **ai_style)
dot.node("mood", "📊 Mood/Emotion Analyzer", **ai_style)

# Database Layer
dot.node("userdb", "🗄 User Data (Profiles, Sessions)", **db_style)
dot.node("convdb", "💬 Conversation History", **db_style)
dot.node("analyticsdb", "📈 Analytics & Reports", **db_style)

# External Integrations
dot.node("twilio", "📞 Twilio / WhatsApp / SMS", **external_style)
dot.node("email", "✉ Email Service", **external_style)
dot.node("webrtc", "🎥 WebRTC (Video/Voice Calls)", **external_style)
dot.node("gcloud", "☁ Google Cloud / Analytics", **external_style)

# Admin Panel
dot.node("admin", "🛠 Admin Dashboard", **admin_style)

# -------------------------
# Connections
# -------------------------
# Frontend → API
dot.edges([("mobile", "api"), ("web", "api")])

# API → AI Layer
dot.edge("api", "nlp")
dot.edge("api", "voice")
dot.edge("api", "mood")

# AI → Database
dot.edge("nlp", "convdb")
dot.edge("mood", "analyticsdb")
dot.edge("api", "userdb")

# AI ↔ External Integrations
dot.edge("nlp", "twilio")
dot.edge("nlp", "email")
dot.edge("voice", "webrtc")
dot.edge("mood", "gcloud")

# Admin → DB
dot.edge("admin", "userdb")
dot.edge("admin", "analyticsdb")
dot.edge("admin", "convdb")

# -------------------------
# Save files
# -------------------------
dot.render("sih_architecture", format="png", cleanup=True)  # PNG
dot.render("sih_architecture", format="pdf", cleanup=True)  # PDF

print("✅ Diagram generated: sih_architecture.png & sih_architecture.pdf")