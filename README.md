# Nivana: Proactive AI Mental Health Platform

![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)
![Stack](https://img.shields.io/badge/stack-PERN+Redis-blue.svg)
![AI](https://img.shields.io/badge/AI-Ollama+Gemini-orange.svg)

Nivana is a next-generation, **machine-centric** mental health ecosystem. It uses intent-aware LLMs, proactive trend analysis, and a high-performance event-driven architecture to suggest interventions before a crisis occurs.

---

## 🛠 Tech Stack & Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, TailwindCSS | Fast, responsive Single Page Application (SPA) |
| **Backend** | Python, Flask, RESTx | API Gateway, Logic, and Orchestration |
| **Database** | PostgreSQL | Relational data persistence (Users, Streaks breakdown) |
| **Real-time Store** | **Redis (Memurai)** | Session storage, API Caching, Streak Counters, Chat Context |
| **Async Broker** | **Celery** | Background task processing (PDFs, Emails, AI Analysis) |
| **Local AI** | **Ollama** | Running local interaction models (Intent Classification) |
| **Cloud AI** | Google Gemini 1.5 | Complex reasoning and empathetic response generation |

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

1. **Node.js (v18+)**: [Download Here](https://nodejs.org/)
2. **Python (v3.10+)**: [Download Here](https://www.python.org/)
3. **Memurai (Redis for Windows)**: [Download Here](https://www.memurai.com/)
    * *Why Memurai?* Redis doesn't officially support Windows. Memurai is the native Windows port.
4. **Ollama**: [Download Here](https://ollama.com/)
    * *For Local AI models.*

---

## 🤖 AI Models Setup (The "models" guide)

Nivana uses custom-tuned local models for speed and privacy. You must load these into Ollama before starting the app.

1. Open your terminal/command prompt.
2. Navigate to the `models` directory:

    ```powershell
    cd models
    ```

3. **Create the Conversation Model**:
    This model (`mental_health_core`) handles the base conversational structure.

    ```powershell
    ollama create mental_health_core -f Modelfile.convo_LLM
    ```

4. **Create the Intent Classifier**:
    This model (`intent_classifier`) detects if a user is in crisis, venting, or seeking advice.

    ```powershell
    ollama create intent_classifier -f Modelfile.intent_classifier
    ```

5. **Verify**:
    Run `ollama list` to see both models listed.

---

## ⚙️ Installation

### 1. Backend Setup

```powershell
# Navigate to project root
pip install -r requirements.txt

# Create .env file (if not exists)
# copy .env.example .env
```

### 2. Frontend Setup

```powershell
cd src
npm install
```

---

## � How to Run (The "Running Steps")

For the comprehensive application to work, you need 4 terminal windows running simultaneously.

### Terminal 1: Redis (Database)

Start the Redis/Memurai server.

```powershell
# If installed via MSI, it runs as a service automatically.
# To run manually:
./memurai.exe
```

### Terminal 2: Celery (Background Worker)

Processes background tasks like saving chat logs and updating long-term streaks.
**Important**: Run this in the project root.

```powershell
celery -A utils.common.celery worker --pool=solo --loglevel=info
```

*Note: We use `--pool=solo` because `prefork` is not supported on Windows.*

### Terminal 3: Flask Backend (API)

Starts the main API server at `http://localhost:2323`.

```powershell
python main.py
```

### Terminal 4: Frontend (UI)

Starts the React app.

```powershell
cd src
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## � Troubleshooting

### "Redis connection failed"

- Ensure Memurai is running. Open Task Manager -> Services and check if `Memurai` is active.
* Check `app.py` Redis URL `redis://localhost:6379`.

### "CORS Error" or "Network Error"

- We use a dynamic API URL configuration.
* If testing on mobile (LAN), ensure your phone and laptop are on the same Wi-Fi.
* The app automatically detects your IP (`192.168.x.x`) to configure CORS.

### "Module not found" in Celery

- Make sure you run the celery command from the **root directory** of the project, not inside `utils` or `api`.
