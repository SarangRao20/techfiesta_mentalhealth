# Nivana: Comprehensive Project Documentation
## For LLM Analysis & Understanding

---

## 🎯 Project Overview

**Nivana** is a next-generation, **machine-centric proactive mental health ecosystem** built with Flask (Python) and React. Unlike traditional reactive chatbots that only respond to user queries, Nivana uses **intent-aware LLMs**, **proactive trend analysis**, and **event-driven architecture** to suggest interventions **before** a crisis occurs. It's designed as a "Guardian" rather than just a "Responder."

### Core Philosophy
- **Proactive over Reactive**: Monitors behavioral patterns and suggests interventions (venting, meditation, assessment) before distress escalates
- **Machine-Centric Analytics**: Background data processing layer continuously analyzes user trends
- **Intent-Aware Conversations**: Every message is classified by intent, emotional state, cognitive load, and crisis risk
- **Contextual Memory**: Uses Redis-based semantic memory to remember past sessions
- **Multi-Modal Support**: Text chat, voice conversations, AR/VR meditation, sound venting, projective tests

---

## 🏗️ System Architecture

### The 4-Layer Engine

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                             │
│  React + Vite + TailwindCSS + Socket.io-client               │
│  (Dashboard, Chat, Assessments, Meditation Hub, VR/AR)       │
└──────────────────────────────────────────────────────────────┘
                            ↓ REST API + WebSocket
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                          │
│  Flask + Flask-RESTx + Flask-SocketIO                        │
│  Auth, Chat, Assessments, Venting, Meditation, Analytics     │
└──────────────────────────────────────────────────────────────┘
                            ↓ Async Tasks
┌──────────────────────────────────────────────────────────────┐
│               DATA PROCESSING & AI LAYER                      │
│  - Ollama (Local Intent Classification)                      │
│  - Google Gemini 1.5 (Empathetic Responses)                  │
│  - Celery (Background Task Processing)                        │
│  - Redis (Session Management, Caching, Streaks)              │
└──────────────────────────────────────────────────────────────┘
                            ↓ Persistence
┌──────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                              │
│  PostgreSQL (Users, Assessments, Chats, Consultations)       │
│  Redis (Real-time Context, API Cache, User Streaks)          │
└──────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Decision Rationale:**
1. **Flask over Django**: Needed lightweight API-first approach with RESTx for automatic Swagger docs
2. **PostgreSQL + Redis hybrid**: PostgreSQL for relational integrity (user profiles, assessments), Redis for speed (chat context, streaks, caching)
3. **Local Ollama + Cloud Gemini**: Ollama runs locally for fast intent classification (~200ms), Gemini handles complex empathetic responses
4. **Celery for async processing**: Heavy tasks (PDF generation, email sending, analytics) don't block API responses
5. **Socket.IO for real-time**: Chat, community features, mentor notifications need instant updates

---

## 🛠️ Technology Stack Breakdown

### Backend (Python)

| Technology | Version | Purpose | Why This Choice |
|:-----------|:--------|:--------|:----------------|
| **Flask** | Latest | Web framework | Lightweight, perfect for REST APIs, extensive ecosystem |
| **Flask-RESTx** | Latest | REST API + Swagger | Auto-generates API docs, namespace organization |
| **Flask-Login** | Latest | Session management | Industry-standard authentication, easy to use |
| **Flask-SQLAlchemy** | Latest | ORM | Pythonic DB queries, prevents SQL injection |
| **Flask-Migrate** | Latest | DB migrations | Version control for database schema changes |
| **PostgreSQL** | 14+ | Primary database | ACID compliance, JSON support (JSONB), production-ready |
| **Redis** | 6+ | Cache + Sessions | Sub-millisecond latency, pub/sub for real-time features |
| **Celery** | Latest | Task queue | Distributed async processing, scheduled tasks |
| **Ollama** | Latest | Local LLM hosting | Privacy-first, no API costs, ~200ms response time |
| **Google Gemini** | 1.5 | Cloud LLM | Advanced reasoning, empathetic responses |
| **Socket.IO** | Latest | WebSocket | Real-time bidirectional communication |
| **ReportLab** | Latest | PDF generation | Counsellor assessment reports |
| **Werkzeug** | Latest | WSGI utilities | Password hashing, secure file uploads |

### Frontend (JavaScript/React)

| Technology | Version | Purpose | Why This Choice |
|:-----------|:--------|:--------|:----------------|
| **React** | 19.2.0 | UI framework | Component reusability, virtual DOM performance |
| **Vite** | 7.2.4 | Build tool | 10x faster than Webpack, HMR, ESM-native |
| **TailwindCSS** | 3.4.19 | Styling | Utility-first, rapid prototyping, small bundle |
| **React Router** | 7.11.0 | Routing | SPA navigation, nested routes |
| **Socket.io-client** | 4.8.3 | WebSocket client | Real-time chat, community, notifications |
| **Recharts** | 3.6.0 | Data visualization | Assessment trends, mood graphs |
| **GSAP** | 3.14.2 | Animations | Smooth UI transitions, gamification effects |
| **Lucide React** | Latest | Icons | Modern, lightweight icon library |
| **React Hook Form** | 7.69.0 | Form handling | Performance, validation, minimal re-renders |

### AI/ML Models

#### Local Models (Ollama)
1. **intent_classifier:latest**
   - Based on: Llama 3.2 (7B parameters)
   - Custom-tuned with Modelfile
   - Purpose: Classify user intent in 8 dimensions
   - Response time: ~200-300ms
   - Runs on: http://localhost:11434

2. **convo_LLM:latest** (backup)
   - Based on: Llama 3.2
   - Purpose: Generate empathetic responses
   - Currently using Gemini for this task

#### Cloud Models
1. **Google Gemini 1.5**
   - Purpose: Complex reasoning, empathetic response generation
   - API: google-genai SDK
   - Fallback: If Gemini fails, use hardcoded therapeutic responses

### Infrastructure

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| **Session Store** | Redis DB 1 | Server-side Flask sessions |
| **API Cache** | Redis DB 2 | Cache frequent API responses (5 min TTL) |
| **Chat Context** | Redis DB 3 | Last 10 messages per session |
| **User Streaks** | Redis DB 4 | Daily login streaks, activity counters |
| **Task Queue** | Celery + Redis | Background PDF generation, emails |

---

## 🧠 AI Architecture & Intent Classification

### The Intent Classification Engine

**Location:** `models/engine.py` & `models/LLM.py`

#### 8-Dimensional Intent Classification

Every user message is analyzed across **8 independent axes**:

```json
{
  "emotional_state": "<calm|neutral|low|sad|anxious|stressed|overwhelmed|frustrated|angry|numb>",
  "intent_type": "<venting|reassurance|advice|grounding|reflection|action_planning|informational|casual_chat>",
  "cognitive_load": "<low|medium|high>",
  "emotional_intensity": "<mild|moderate|high|critical>",
  "help_receptivity": "<resistant|passive|open|seeking>",
  "time_focus": "<past|present|future|mixed>",
  "context_dependency": "<standalone|session_dependent>",
  "self_harm_crisis": "<true|false>"
}
```

#### How It Works (Technical Flow)

1. **User sends message** → Frontend Socket.io → Backend receives
2. **Intent Classification** (Local Ollama):
   ```python
   intent_json = ollama_client.generate(
       model='intent_classifier:latest',
       prompt=user_message
   )
   # Response: ~200ms, JSON object
   ```

3. **Context Retrieval** (Redis):
   ```python
   context_key = f"chat_context:{session_id}"
   chat_history = json.loads(r_context.get(context_key))
   # Last 10 messages for continuity
   ```

4. **Response Generation** (Gemini):
   ```python
   response = gemini_client.generate(
       prompt=f"{user_message}\n{intent_json}\n{chat_history}",
       context=CONVERSATIONAL_PROMPT  # 500-line detailed prompt
   )
   # Includes: response text + suggested_feature + suggested_assessment
   ```

5. **Crisis Detection** (Async):
   - If `self_harm_crisis: true` → Save to `CrisisAlert` table
   - Notify student's mentor via Redis pub/sub
   - Update `ChatSession.crisis_flag = True`

6. **Background Tasks** (Celery):
   - Save chat message to PostgreSQL (async)
   - Save intent analysis to `ChatIntent` table
   - Update user streaks in Redis

### Proactive Recommendation Logic

**Location:** `PROJECT_PROMPT.md` - Table of triggers

| Trigger Condition | System Action | AI Directive |
|:------------------|:--------------|:-------------|
| **High Stress Trend** (3+ days) | Suggest Venting | "I've been monitoring your mood trends. It might help to release some frustration in the Sound Vent Box today." |
| **Anxiety Keywords** in 50% of messages | Suggest GAD-7 | "You've mentioned feeling worried quite often lately. Would you like to take a quick GAD-7 screening?" |
| **Low Engagement** (7 days inactive) | Suggest Meditation | "We missed you! A 5-minute guided meditation might be a great way to restart your streak." |
| **Critical Severity** (PHQ/GAD score >20) | Direct to Specialist | "Based on your recent scores, I highly recommend booking a session with one of our licensed specialists." |

**Implementation:** Background Celery tasks run hourly to check these conditions.

---

## 💾 Database Schema (Complete)

### Core Tables

#### 1. User Table
```python
class User(UserMixin, db.Model):
    id = Integer (PK)
    username = String(80), unique
    email = String(120), unique
    password_hash = String(256)
    role = String(20)  # student, mentor, counsellor
    full_name = String(100)
    student_id = String(50)
    student_id_hash = String(64)  # SHA-256 for privacy
    accommodation_type = String(20)  # hostel, local
    bio = Text
    profile_picture = Text  # Base64 or URL
    organization_id = ForeignKey('organization.id')
    mentor_id = ForeignKey('user.id')  # Self-referential
    is_onboarded = Boolean, default=False
    login_streak = Integer, default=0
    last_streak_date = Date
    created_at = DateTime
    last_login = DateTime
```

**Design Decision:** Self-referential `mentor_id` allows mentor-student mapping without separate table.

#### 2. ChatSession Table
```python
class ChatSession(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    session_start = DateTime
    session_end = DateTime
    crisis_flag = Boolean, indexed  # For mentor dashboard queries
    keywords_detected = JSONB  # Crisis keywords found
    emotional_vectors = JSONB  # Current valence, arousal
    emotional_history = JSONB  # Trend over session
```

**Why JSONB?** PostgreSQL JSONB allows flexible schema for evolving emotional metrics without migrations.

#### 3. ChatMessage Table
```python
class ChatMessage(db.Model):
    id = Integer (PK)
    session_id = ForeignKey('chat_session.id')
    message_type = String(10)  # 'user' or 'bot'
    content = Text
    timestamp = DateTime
    crisis_keywords = JSONB  # ["suicide", "harm"] if detected
```

**Design Decision:** Separate from ChatSession for query performance (millions of messages).

#### 4. ChatIntent Table (Analytics)
```python
class ChatIntent(db.Model):
    id = Integer (PK)
    session_id = ForeignKey('chat_session.id'), cascade delete
    message_id = ForeignKey('chat_message.id')
    user_id = ForeignKey('user.id'), indexed
    user_message = Text
    intent_data = JSONB  # Full 8-dimensional classification
    emotional_state = String(50)  # Extracted for quick queries
    intent_type = String(50)
    emotional_intensity = String(20)
    cognitive_load = String(20)
    help_receptivity = String(20)
    self_harm_crisis = Boolean, indexed
    suggested_feature = String(100)  # E.g., "Sound Venting Hall"
    suggested_assessment = String(50)  # E.g., "PHQ-9"
    timestamp = DateTime, indexed
```

**Purpose:** Every user message gets an intent record for:
- Mentor dashboard analytics
- Proactive trend detection
- Research insights (anonymized)

#### 5. CrisisAlert Table
```python
class CrisisAlert(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    session_id = ForeignKey('chat_session.id')
    intent_id = ForeignKey('chat_intent.id')
    alert_type = String(50)  # 'self_harm', 'high_distress'
    severity = String(20)  # 'critical', 'high', 'moderate'
    message_snippet = Text  # First 200 chars
    intent_summary = JSONB  # Emotional state snapshot
    acknowledged = Boolean, indexed
    acknowledged_by = ForeignKey('user.id')  # Mentor who reviewed
    acknowledged_at = DateTime
    created_at = DateTime, indexed
```

**Real-time Flow:**
1. Crisis detected → Row inserted here
2. Redis notification pushed to mentor: `mentor:notifications:{mentor_id}`
3. Mentor dashboard polls Redis every 30s
4. Mentor clicks → `acknowledged = True`, `acknowledged_by = mentor.id`

#### 6. Assessment Table
```python
class Assessment(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    assessment_type = String(10)  # 'PHQ-9', 'GAD-7', 'GHQ'
    responses = JSONB  # {q1: 2, q2: 3, ...}
    score = Integer
    severity_level = String(50)  # 'Minimal', 'Mild', 'Moderate', 'Severe'
    recommendations = JSONB  # AI-generated insights
    completed_at = DateTime, indexed
```

**Scoring Logic:**
- PHQ-9: 0-4 (Minimal), 5-9 (Mild), 10-14 (Moderate), 15+ (Severe)
- GAD-7: Similar thresholds
- GHQ: 0-15 (Normal), 16+ (Distress)

#### 7. VentingPost Table (Community)
```python
class VentingPost(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id')
    content = Text
    anonymous = Boolean, default=True
    created_at = DateTime
    likes = Integer, default=0
```

**Privacy Design:** If `anonymous=True`, frontend shows "Anonymous User" instead of username.

#### 8. SoundVentingSession Table
```python
class SoundVentingSession(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id')
    duration = Integer  # Seconds
    max_decibel = Float  # Peak loudness
    avg_decibel = Float
    scream_count = Integer  # Instances >90dB
    session_type = String(20)  # 'sound_venting', 'therapy_scream'
    created_at = DateTime
    date = Date, indexed
```

**Feature Implementation:** Uses Web Audio API to measure microphone input decibels in real-time.

#### 9. InkblotResult Table (Projective Test)
```python
class InkblotResult(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id')
    responses = JSONB  # {blot_1: "butterfly", blot_2: "two people fighting"}
    story_elaborations = JSONB  # {blot_1: "Long story about..."}
    sharing_status = Boolean  # Share with counsellor?
    pdf_path = String(256)  # ReportLab-generated PDF
    created_at = DateTime
```

**AI Analysis:** Gemini analyzes inkblot responses for themes (e.g., conflict, isolation, hope).

#### 10. ConsultationRequest Table
```python
class ConsultationRequest(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    counsellor_id = ForeignKey('user.id')
    urgency_level = String(10)  # 'low', 'medium', 'high'
    time_slot = String(50)
    contact_preference = String(20)  # 'phone', 'email', 'video'
    additional_notes = Text
    status = String(20), indexed  # 'pending', 'accepted', 'booked', 'completed'
    session_datetime = DateTime
    session_notes = Text  # Post-session notes by counsellor
    feedback_rating = Integer  # 1-5
    feedback_text = Text
    attachments = JSONB  # [{type: 'assessment', id: 42}, {type: 'inkblot', id: 15}]
    created_at = DateTime
```

**Workflow:**
1. Student books → `status='pending'`
2. Counsellor accepts → `status='accepted'`, sets `session_datetime`
3. Session occurs → `status='completed'`, adds `session_notes`
4. Student provides feedback → `feedback_rating`, `feedback_text`

#### 11. UserActivityLog Table (Universal Analytics)
```python
class UserActivityLog(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    activity_type = String(50)  # 'assessment', 'venting', 'meditation', 'chat', 'ar_vr'
    action = String(50)  # 'start', 'complete', 'submit'
    duration = Integer  # Seconds
    result_value = Float  # Assessment score, decibel level, etc.
    extra_data = JSONB
    timestamp = DateTime
    date = Date, indexed
```

**Purpose:** Single source of truth for all user actions. Powers:
- Dashboard analytics
- Streak calculations
- Engagement metrics

#### 12. RoutineTask Table
```python
class RoutineTask(db.Model):
    id = Integer (PK)
    user_id = ForeignKey('user.id'), indexed
    title = String(100)
    start_time = String(5)  # "09:00"
    end_time = String(5)    # "10:30"
    notes = Text
    status = String(20)  # 'pending', 'completed', 'skipped'
    created_date = Date, indexed
    created_at = DateTime
```

**Feature:** Daily task planner with time blocking for self-care routines.

### Redis Data Structures

#### DB 1: Flask Sessions
```
Key: mh_session:<session_id>
Type: String (serialized Flask session)
TTL: 7 days
```

#### DB 2: API Cache
```
Key: view//<route>?<query_params>
Type: String (JSON response)
TTL: 5 minutes
Example: "view//api/dashboard/insights?user_id=42"
```

#### DB 3: Chat Context
```
Key: chat_context:<session_id>
Type: String (JSON array of last 10 messages)
TTL: 1 hour
Structure: [
  {"role": "user", "content": "I feel anxious"},
  {"role": "assistant", "content": "Let's try breathing..."}
]
```

#### DB 4: User Streaks
```
Key: user_streak:<user_id>
Type: Hash
Fields: {
  "current_streak": "5",
  "last_activity": "2026-01-20",
  "longest_streak": "12"
}
TTL: None (persistent)
```

#### Mentor Notifications (Sorted Set)
```
Key: mentor:notifications:<mentor_id>
Type: Sorted Set
Score: Timestamp (for chronological ordering)
Member: JSON string of notification
Max size: 50 (auto-trim oldest)
TTL: 7 days
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.jsx
├── LandingPage (Public)
├── SignIn / Register (Auth)
├── Onboarding (First-time setup)
└── SideBar (Main App Layout)
    ├── DashboardFinal (Overview + Kalpvriksha tree)
    ├── Chat (AI Chatbot)
    │   └── ChatHistory (Past sessions)
    ├── MeditationHub (Portal to all meditation types)
    │   ├── BreathingExercise (1-2 min)
    │   ├── BodyScanMeditation (10 min)
    │   ├── MindfulnessMeditation (15 min)
    │   ├── NatureSounds (ambient)
    │   ├── PianoRelaxation (music)
    │   ├── OceanWaves (sleep)
    │   └── Ar_breathing (AR overlay)
    ├── VrMeditation (WebXR immersive)
    ├── PrivateVentingRoom (Text venting + SoundVenting)
    ├── Community (Anonymous sharing)
    ├── Assessments (PHQ-9, GAD-7, GHQ)
    ├── Inkblot (Projective test)
    ├── Consultant (Book counsellor)
    ├── TasksManager (Daily routines)
    ├── Resources (Mental health info)
    ├── MentorDashboard (For mentors)
    ├── CounsellorDashboardNew (For counsellors)
    └── Profile (User settings)
```

### Key Frontend Features

#### 1. Kalpvriksha Growth System (Gamification)
**File:** `components/Kalpvriksha.jsx`

**Concept:** Animated tree that grows based on user activity
- **Seedling** → **Sapling** → **Tree** → **Blooming Tree**
- Growth factors:
  - Login streak
  - Assessments completed
  - Meditation sessions
  - Chat engagement
  - Venting posts

**Implementation:**
- Uses GSAP for smooth animations
- SVG-based tree components (Stem, Leaf, Flower, Bud)
- Growth calculated server-side, rendered client-side
- Encourages daily engagement ("water your tree")

#### 2. Voice Conversation Mode
**File:** `components/Chat.jsx` + `VOICE_CONVERSATION_README.md`

**Features:**
- Web Speech API for continuous speech-to-text
- Supports English + Hindi (Hinglish)
- Auto-restarts listening after bot response
- Text-to-speech for bot replies
- 8-second silence timeout
- Keyboard shortcuts (Esc to exit)

**Technical Implementation:**
```javascript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-IN';  // Hinglish support

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  sendMessage(transcript);
};

// TTS
const utterance = new SpeechSynthesisUtterance(botResponse);
utterance.lang = 'hi-IN';
speechSynthesis.speak(utterance);
```

#### 3. AR Breathing Exercise
**File:** `components/Features/Ar_breathing.jsx`

**Concept:** Overlay a 3D expanding/contracting sphere on camera feed
- **Inhale** (4s): Sphere expands + blue color
- **Hold** (7s): Sphere stays + yellow color
- **Exhale** (8s): Sphere contracts + green color

**Tech:** AR.js + Three.js for WebXR in browser (no app install needed)

#### 4. VR Meditation
**File:** `components/VrMeditation.jsx` + `AR_VR_Integration_Plan.md`

**Environments:**
- Beach/Ocean (calming waves)
- Forest (birds, trees)
- Space (floating cosmos)
- Mountain valley

**Implementation:**
- A-Frame framework (built on Three.js)
- 360° video textures
- Spatial audio
- Works with Google Cardboard or Meta Quest

**Sample A-Frame code:**
```html
<a-scene>
  <a-sky src="360_beach.jpg"></a-sky>
  <a-sound src="ocean_waves.mp3" loop></a-sound>
  <a-entity text="value: Breathe In... Hold... Breathe Out..."></a-entity>
</a-scene>
```

#### 5. Sound Venting Hall
**File:** `components/Features/SoundVenting.jsx`

**Concept:** "Scream therapy" - let users yell into their mic to release frustration
- Measures decibel levels in real-time
- Visual feedback: Screen flashes red on screams >90dB
- Records: Duration, max/avg decibels, scream count
- Saves to `SoundVentingSession` table

**Implementation:**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function measureDecibel() {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const decibel = 20 * Math.log10(rms) + 94;  // Calibrated
      
      if (decibel > 90) screamCount++;
    }
  });
```

#### 6. Mentor Dashboard
**File:** `components/MentorDashboard.jsx` + `MENTOR_DASHBOARD_OPTIMIZATION.md`

**Features:**
1. **Real-time Crisis Alerts**
   - Bell icon with badge (unread count)
   - Polling Redis every 30s for new alerts
   - Click notification → Student insights open

2. **Student List**
   - All assigned students
   - Latest activity timestamp
   - Crisis flag indicator (red dot)

3. **Student Insights Panel**
   - Assessment scores (PHQ-9, GAD-7, GHQ)
   - Intent analysis trends (emotional state over time)
   - Activity logs (last 7 days)
   - Crisis history

**Performance Optimization:**
- Redis caching: First load from DB, subsequent loads from Redis (5-min TTL)
- Celery background task: `precalculate_student_insights()` runs periodically
- Lazy loading: Insights fetch only when panel opens

**Redis Notification Flow:**
```python
# Backend: When crisis detected
def push_mentor_notification(mentor_id, notification):
    key = f"mentor:notifications:{mentor_id}"
    timestamp = time.time()
    r_context.zadd(key, {json.dumps(notification): timestamp})
    r_context.zremrangebyrank(key, 0, -51)  # Keep only 50 latest
    r_context.expire(key, 604800)  # 7 days

# Frontend: Polling
setInterval(() => {
  fetch('/api/mentor/notifications')
    .then(res => res.json())
    .then(data => setNotifications(data));
}, 30000);  // Every 30s
```

#### 7. Counsellor Dashboard
**File:** `components/CounsellorDashboardNew.jsx`

**Features:**
1. **Consultation Requests**
   - Pending requests with urgency level
   - Accept/Reject buttons
   - Set session date/time

2. **Booked Sessions**
   - Upcoming appointments
   - Access to patient's shared assessments/inkblot
   - Video call link integration (future: Jitsi/Zoom)

3. **Completed Sessions**
   - Add session notes
   - View patient feedback
   - Schedule follow-ups

**Access Control:**
- Counsellor can only view assessments/inkblots if:
  1. Patient attached them to consultation request, OR
  2. Patient enabled `sharing_status=True`
- PDF generation endpoint checks: `ConsultationRequest.status == 'booked'`

---

## 🔄 Key User Flows

### 1. New User Journey

```
1. Landing Page → Click "Start Your Journey"
2. Register Form → Create account (username, email, password, role, student_id)
3. Auto-login → Redirect to /start-journey (Onboarding)
4. Onboarding Questions:
   - "How are you feeling lately?"
   - "What brings you here today?"
   - "What are your mental health goals?"
   - Saved to OnboardingResponse table (JSONB)
5. Dashboard appears → Kalpvriksha tree (seedling stage)
6. Sidebar unlocked → Full access to features
```

### 2. AI Chat Session Flow

```
1. User clicks "Chat" in sidebar
2. Frontend: Socket.io connects to backend
3. User types message: "I'm feeling really anxious about exams"
4. Frontend: Emits 'send_message' event via Socket.io
5. Backend receives:
   a. Save user message to Redis context
   b. Check rate limit (max 10 msgs/min)
   c. Intent classification via Ollama (~200ms):
      {
        "emotional_state": "anxious",
        "intent_type": "grounding",
        "cognitive_load": "high",
        "emotional_intensity": "moderate",
        "self_harm_crisis": "false"
      }
   d. Retrieve last 10 messages from Redis
   e. Generate response via Gemini (~2-3s):
      {
        "response": "I hear you're feeling anxious...",
        "suggested_feature": "1/2-Minute Breathing Exercise"
      }
   f. Save bot message to PostgreSQL (async via Celery)
   g. Save ChatIntent to PostgreSQL (async)
   h. Update chat context in Redis
   i. Update user streak in Redis
6. Frontend: Receives bot response via Socket.io
7. Display message + "Try this feature" button
8. User clicks → Redirects to /app/meditation-hub
```

### 3. Crisis Detection Flow

```
1. User message: "I just want to end it all"
2. Backend:
   a. Ollama classifies: "self_harm_crisis": "true"
   b. Saves to CrisisAlert table:
      - alert_type: 'self_harm'
      - severity: 'critical'
      - message_snippet: "I just want to end it all"
   c. Updates ChatSession.crisis_flag = True
   d. Finds student's mentor_id from User table
   e. Pushes notification to Redis:
      key: mentor:notifications:{mentor_id}
      value: {
        "type": "crisis_alert",
        "student_id": 42,
        "student_name": "John Doe",
        "message": "🚨 Crisis detected",
        "details": "I just want to end it all",
        "timestamp": 1737345947
      }
3. Mentor Dashboard:
   a. Polling detects new notification (next 30s cycle)
   b. Bell badge updates: "1"
   c. Notification dropdown shows red alert
   d. Mentor clicks → Student insights panel opens
   e. Mentor sees: Crisis history, assessment scores, recent messages
   f. Mentor acknowledges → CrisisAlert.acknowledged = True
4. Bot Response (to user):
   "I'm very concerned about what you've shared. Your life has value.
   National Suicide Prevention Lifeline: 988
   Crisis Text Line: Text HOME to 741741
   Emergency: 911
   Would you like me to help you find local resources?"
```

### 4. Assessment Submission Flow

```
1. User navigates to /app/assessments
2. Selects "PHQ-9 Depression Screening"
3. Answers 9 questions (0-3 scale each)
4. Clicks "Submit"
5. Frontend: POST /api/assessments
   {
     "assessment_type": "PHQ-9",
     "responses": {
       "q1": 2, "q2": 3, "q3": 1, ... "q9": 2
     }
   }
6. Backend:
   a. Calculates score: Sum of all responses (0-27)
      - Example: 2+3+1+2+1+3+2+1+2 = 17 (Moderately Severe)
   b. Determines severity:
      - 0-4: Minimal
      - 5-9: Mild
      - 10-14: Moderate
      - 15-19: Moderately Severe
      - 20-27: Severe
   c. Generates AI analysis via utils.generate_analysis():
      - User-friendly explanation
      - Counsellor-detailed clinical interpretation
      - Risk assessment (suicide risk, functional impairment)
      - Treatment recommendations
   d. Saves to Assessment table
   e. Logs activity to UserActivityLog
   f. Invalidates dashboard cache
7. Frontend: Receives response, displays:
   - Score: 17/27
   - Severity: "Moderately Severe Depression"
   - Analysis: "Your responses suggest significant symptoms..."
   - Recommendations: "Consider booking a counsellor session"
   - Button: "Book Consultation Now"
```

### 5. Counsellor Booking Flow

```
1. User: /app/consultation → "Book New Consultation"
2. Form:
   - Urgency: High/Medium/Low
   - Preferred time slots (multiple select)
   - Contact preference: Video/Phone/Email
   - Additional notes
   - Attach assessments (checkboxes for past PHQ-9/GAD-7/GHQ)
   - Attach inkblot (if completed)
3. Submit → POST /api/consultation/book
4. Backend:
   - Creates ConsultationRequest (status='pending')
   - Sends email to all counsellors (SMTP)
5. Counsellor logs in → CounsellorDashboardNew
6. Sees pending request with:
   - Student name
   - Urgency: 🔴 High
   - Preferred slots
   - Attached reports
7. Counsellor clicks "Accept"
8. Modal: Select exact date/time, add video call link
9. Submit → PATCH /api/consultation/{id}/accept
10. Backend:
    - Updates status='accepted'
    - Sets session_datetime
    - Sends confirmation email to student
11. Student sees: "Your session is confirmed for Jan 25, 3 PM"
12. Session occurs (external video call)
13. Counsellor adds session notes
14. Status → 'completed'
15. Student rates session (1-5 stars + feedback)
```

---

## 🧪 Testing & Validation

### How to Validate Each Feature

#### 1. Intent Classification Accuracy
```bash
# Terminal test
cd models
python LLM.py

# Modify user_message variable
user_message = "I feel like hurting myself"

# Expected output:
{
  "emotional_state": "despair",
  "intent_type": "crisis",
  "self_harm_crisis": "true",
  "emotional_intensity": "critical"
}
```

#### 2. Redis Connectivity
```bash
# Windows PowerShell
redis-cli ping
# Should return: PONG

# Check streak data
redis-cli -n 4
127.0.0.1:6379[4]> HGETALL user_streak:1
1) "current_streak"
2) "5"
3) "last_activity"
4) "2026-01-20"
```

#### 3. Celery Task Queue
```bash
# Check if tasks are being processed
celery -A utils.celery_app inspect active

# Should show:
- save_chat_message
- save_intent_and_alert
- precalculate_student_insights
```

#### 4. Crisis Alert System
```bash
# Test message
User: "I want to die"

# Check database
psql -d mental_health_db
SELECT * FROM crisis_alert WHERE acknowledged = FALSE;

# Check Redis notification
redis-cli -n 3
ZRANGE mentor:notifications:2 0 -1 WITHSCORES
```

#### 5. Assessment Scoring
```python
# Python console test
from utils import calculate_phq9_score

responses = {"q1": 3, "q2": 3, "q3": 3, "q4": 3, "q5": 3, "q6": 3, "q7": 3, "q8": 3, "q9": 3}
score, severity = calculate_phq9_score(responses)
print(f"Score: {score}, Severity: {severity}")
# Expected: Score: 27, Severity: Severe Depression
```

---

## 🚀 Deployment Checklist

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mental_health_db

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs
GOOGLE_API_KEY=your_gemini_api_key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=nivana@example.com
MENTOR_EMAIL=mentor@example.com
COUNSELLOR_EMAIL=counsellor@example.com

# Flask
SESSION_SECRET=your_super_secret_key_change_in_production
FLASK_ENV=production
```

### Production Checklist
- [ ] Set `FLASK_ENV=production` (disables debug mode)
- [ ] Use `gunicorn` instead of Flask dev server
- [ ] Set up PostgreSQL with proper backup schedule
- [ ] Redis persistence enabled (AOF or RDB)
- [ ] Celery running as systemd service
- [ ] Ollama running as systemd service
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] CORS configured for production domain only
- [ ] Database connection pooling configured
- [ ] Error logging to file/Sentry
- [ ] Rate limiting enforced (Flask-Limiter)
- [ ] Regular DB backups (daily)
- [ ] Monitor Redis memory usage
- [ ] Set up Nginx reverse proxy

### Scaling Considerations
1. **Database:** PostgreSQL read replicas for mentor/counsellor dashboards
2. **Redis:** Redis Cluster if user base >100k
3. **Celery:** Multiple workers (one per CPU core)
4. **Ollama:** Move to dedicated GPU server if >1000 concurrent chats
5. **Static assets:** CDN for meditation videos/audio

---

## 📊 Analytics & Insights

### Data Available for Analysis

1. **User Engagement:**
   - Daily active users
   - Feature usage breakdown (chat, assessments, meditation)
   - Login streaks distribution
   - Session durations

2. **Mental Health Trends:**
   - Average PHQ-9/GAD-7 scores over time
   - Crisis alert frequency
   - Most common emotional states
   - Intent type distribution

3. **Intervention Effectiveness:**
   - Features suggested by AI vs. features actually used
   - Correlation: Using suggested feature → Improved next assessment score
   - Counsellor session outcomes (feedback ratings)

4. **Proactive System Performance:**
   - How often proactive suggestions are followed
   - Time from crisis detection to mentor acknowledgment
   - Venting usage after high-stress trends

### Privacy Compliance
- All analytics are **aggregate and anonymized**
- Individual data requires user consent
- GDPR-compliant data export/deletion endpoints
- Student IDs hashed (SHA-256) for privacy

---

## 🎓 Learning & Research Applications

### For Academic Analysis
This codebase can be used to study:
1. **Intent classification in mental health contexts** (NLP research)
2. **Proactive vs. reactive intervention efficacy** (Psychology)
3. **Gamification impact on therapy adherence** (HCI)
4. **AI-human collaboration in crisis detection** (AI Safety)
5. **Privacy-preserving mental health platforms** (Security)

### Dataset Generation
With user consent, can export:
- Anonymized chat transcripts with intent labels
- Assessment scores correlated with chat sentiment
- Feature usage patterns
- Crisis detection precision/recall metrics

---

## 🛡️ Security & Privacy

### Authentication
- Password hashing: Werkzeug's `generate_password_hash()` (PBKDF2)
- Session management: Server-side in Redis (prevents tampering)
- CSRF protection: Flask-WTF
- Rate limiting: Max 10 chat messages/min per user

### Data Protection
- Student IDs hashed before storage
- Chat messages encrypted at rest (PostgreSQL TDE in production)
- Crisis alerts only visible to assigned mentor
- Counsellor access requires active consultation

### Compliance
- **HIPAA-ready architecture** (pending formal audit)
- GDPR: Right to data export/deletion implemented
- Audit logs: All data access logged in `UserActivityLog`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Redis connection failed"
**Cause:** Redis not running or wrong port
**Solution:**
```bash
# Windows
net start Memurai

# Check
redis-cli ping
```

### Issue 2: "Ollama model not found"
**Cause:** Local models not created
**Solution:**
```bash
cd models
ollama create intent_classifier -f Modelfile.intent_classifier
ollama create convo_LLM -f Modelfile.convo_LLM
ollama list  # Verify
```

### Issue 3: "Celery tasks not processing"
**Cause:** Celery worker not running
**Solution:**
```bash
# Windows
celery -A utils.common.celery worker --pool=solo --loglevel=info
```

### Issue 4: "Frontend can't reach API"
**Cause:** CORS misconfiguration
**Solution:**
- Check `app.py`: `CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})`
- Ensure frontend config.js has correct API URL

### Issue 5: "Database migration error"
**Cause:** Schema change without migration
**Solution:**
```bash
flask db migrate -m "Description of change"
flask db upgrade
```

---

## 🔮 Future Enhancements

### Planned Features (Priority Order)
1. **WebSocket for mentor notifications** (replace polling)
2. **Voice emotion analysis** (detect stress from voice tone)
3. **Biometric integration** (heart rate, sleep data from wearables)
4. **Multi-language support** (Hindi, Tamil, Bengali UI)
5. **AI therapist training mode** (Counsellors can fine-tune responses)
6. **Peer support matching** (Connect users with similar experiences)
7. **Family/guardian dashboard** (with user consent)
8. **Integration with EHR systems** (HL7 FHIR)

### Research Directions
1. **Predictive crisis models:** Train ML on historical data to predict crisis 24-48h before
2. **Personalized intervention:** A/B test which features work best for each user
3. **Cultural adaptation:** Modify AI prompts for different cultural contexts
4. **Longitudinal studies:** Track user outcomes over 6-12 months

---

## 📚 References & Inspirations

### Academic Papers
1. "Mental Health Chatbots: A Review" (Fitzpatrick et al., 2017)
2. "Proactive Intervention in Digital Mental Health" (Patel et al., 2020)
3. "Intent Detection in Crisis Counseling" (Zhang et al., 2022)

### Open Source Projects
- Rasa (Conversational AI framework)
- MindLogger (Mental health data collection)
- Crisis Text Line data insights

### Clinical Guidelines
- DSM-5 criteria for depression/anxiety
- PHQ-9/GAD-7 validated scoring
- SAMHSA crisis intervention protocols

---

## 👨‍💻 Developer Notes

### Code Style
- Backend: PEP 8 (Python), Flake8 linting
- Frontend: ESLint (Airbnb config)
- Database: Snake_case for columns, CamelCase for models
- API: RESTful conventions, HTTP status codes

### Git Workflow
- Main branch: Production-ready
- Develop branch: Integration testing
- Feature branches: `feature/crisis-alerts`, `fix/redis-cache`
- Commit messages: Conventional Commits format

### Documentation Standards
- All API endpoints: Swagger/OpenAPI docs at `/docs`
- Python functions: Docstrings with type hints
- React components: JSDoc comments
- Database: ER diagrams in `docs/`

---

## 🎯 Key Differentiators

### What Makes Nivana Unique?

1. **Proactive, Not Reactive:**
   - Most mental health apps wait for users to report distress
   - Nivana monitors trends and suggests interventions **before** escalation
   - Example: Detects 3 days of anxiety keywords → Suggests GAD-7 assessment

2. **Dual LLM Architecture:**
   - Local Ollama for fast intent classification (privacy + speed)
   - Cloud Gemini for complex empathy (quality + reasoning)
   - Best of both worlds: Privacy + Performance

3. **Machine-Centric Analytics:**
   - Not just a chatbot, but a full analytics engine
   - Background Celery tasks continuously analyze user patterns
   - Mentor dashboard gets **predictive** insights, not just reactive logs

4. **Gamification with Purpose:**
   - Kalpvriksha tree isn't just decoration
   - Growth tied to **meaningful** actions (assessments, meditation)
   - Creates intrinsic motivation for self-care

5. **Multi-Modal Intervention:**
   - Most apps: Just chat or just meditation
   - Nivana: Chat, voice, AR, VR, venting (text+sound), projective tests
   - AI suggests the **right modality** for the user's current state

6. **Crisis-Aware Architecture:**
   - Real-time crisis detection with mentor notification pipeline
   - Sub-30-second alert delivery (via Redis + polling)
   - Built-in escalation protocols

7. **Privacy-First Design:**
   - Local AI processing where possible (Ollama)
   - Hashed student IDs
   - Anonymous venting
   - Granular sharing controls (only share assessments with counsellor if chosen)

---

## 📝 Final Summary

**Nivana** is a **full-stack mental health platform** built on a **proactive AI architecture**. It combines:
- **Backend:** Flask + PostgreSQL + Redis + Celery + Ollama + Gemini
- **Frontend:** React + Vite + TailwindCSS + Socket.IO
- **Core Innovation:** Intent-aware chatbot that monitors trends and prescribes interventions
- **Features:** AI chat, voice conversations, assessments (PHQ-9/GAD-7/GHQ/Inkblot), meditation hub (7 types), AR/VR support, sound venting, community, counsellor booking, mentor dashboard
- **Architecture:** 4-layer engine (Frontend → API Gateway → Data Processing → Storage)
- **Scalability:** Redis caching, Celery async tasks, PostgreSQL indexing
- **Privacy:** Local AI, hashed IDs, granular permissions
- **Target Users:** Students (primary), Mentors (monitoring), Counsellors (professional care)

**Tech Highlights:**
- Custom-tuned Ollama models for intent classification
- 8-dimensional intent analysis (emotional state, cognitive load, crisis detection)
- Real-time crisis alerts via Redis sorted sets
- Contextual memory using Redis chat context
- Gamification via Kalpvriksha growth system
- Multi-language support (English + Hindi)
- WebXR for AR/VR meditation

**Deployment Requirements:**
- Python 3.10+, Node.js 18+
- PostgreSQL 14+, Redis 6+
- Ollama (local LLM server)
- Celery worker process
- Memurai (Redis for Windows)

**Use Cases:**
1. Student feels anxious → Chat suggests breathing exercise → Tracks effectiveness
2. Mentor sees 3 students in crisis → Dashboard shows trends → Proactive outreach
3. Counsellor reviews assessment history before session → Evidence-based treatment
4. Background task detects worsening PHQ-9 scores → AI suggests specialist consultation

**Impact Potential:**
- Early intervention reduces crisis severity
- Continuous monitoring catches trends humans miss
- Accessible mental health support for underserved populations
- Data-driven insights for institutional mental health programs

---

**This is the complete technical and conceptual blueprint of Nivana. Every feature, every design decision, every line of code serves the mission: Proactive, compassionate, evidence-based mental health support at scale.**