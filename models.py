from datetime import datetime, timedelta
from database import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
import json
from sqlalchemy.dialects.postgresql import JSONB

class RoutineTask(db.Model):
    __tablename__ = 'routine_tasks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    start_time = db.Column(db.String(5), nullable=False)  # HH:MM
    end_time = db.Column(db.String(5), nullable=False)    # HH:MM
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, completed, skipped
    created_date = db.Column(db.Date, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='routine_tasks')

    def duration_minutes(self):
        try:
            start_h, start_m = map(int, self.start_time.split(':'))
            end_h, end_m = map(int, self.end_time.split(':'))
            return (end_h * 60 + end_m) - (start_h * 60 + start_m)
        except Exception:
            return 0

    def as_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'notes': self.notes,
            'status': self.status,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<RoutineTask {self.id}: {self.title} ({self.start_time}-{self.end_time})>"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # student, teacher, admin
    full_name = db.Column(db.String(100), nullable=False)
    student_id_hash = db.Column(db.String(64))  # Hashed student ID for privacy
    accommodation_type = db.Column(db.String(20))  # hostel, local
    bio = db.Column(db.Text)  # User bio
    profile_picture = db.Column(db.Text)  # Base64 string or URL
    student_id = db.Column(db.String(50))  # Plain student ID for display
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    login_streak = db.Column(db.Integer, default=0)
    last_streak_date = db.Column(db.Date)
    mentor_id = db.Column(db.Integer, db.ForeignKey('user.id')) # Student's connected mentor
    
    # Relationships
    mentor = db.relationship('User', remote_side=[id], backref='students')
    chat_sessions = db.relationship('ChatSession', backref='user', lazy=True, cascade='all, delete-orphan')
    assessments = db.relationship('Assessment', backref='user', lazy=True, cascade='all, delete-orphan')
    meditation_sessions = db.relationship('MeditationSession', backref='user', lazy=True, cascade='all, delete-orphan')
    venting_posts = db.relationship('VentingPost', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_student_id(self, student_id):
        # Hash student ID for privacy
        self.student_id_hash = hashlib.sha256(str(student_id).encode()).hexdigest()
    
    def update_login_streak(self):
        today = datetime.utcnow().date()
        if self.last_streak_date:
            if self.last_streak_date == today:
                return  # Already updated today
            elif self.last_streak_date == today - timedelta(days=1):
                self.login_streak += 1
            else:
                self.login_streak = 1
        else:
            self.login_streak = 1
        
        self.last_streak_date = today
        self.last_login = datetime.utcnow()
        db.session.commit()

class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_start = db.Column(db.DateTime, default=datetime.utcnow)
    session_end = db.Column(db.DateTime)
    crisis_flag = db.Column(db.Boolean, default=False)
    keywords_detected = db.Column(JSONB)  # JSON string of detected keywords
    
    # Emotional Vector Dynamics (VD) State
    emotional_vectors = db.Column(JSONB)  # JSON string of current vectors (valence, arousal, etc.)
    emotional_history = db.Column(JSONB)  # JSON string of historical snapshots for trend analysis

    # Relationship
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade='all, delete-orphan')

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'), nullable=False)
    message_type = db.Column(db.String(10), nullable=False)  # user, bot
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    crisis_keywords = db.Column(JSONB)  # JSON string of crisis keywords in this message

class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assessment_type = db.Column(db.String(10), nullable=False)  # PHQ-9, GAD-7, GHQ
    responses = db.Column(JSONB, nullable=False)  # JSON string of responses
    score = db.Column(db.Integer, nullable=False)
    severity_level = db.Column(db.String(20), nullable=False)
    recommendations = db.Column(JSONB)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

class MeditationSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_type = db.Column(db.String(20), nullable=False)  # meditation, music
    duration = db.Column(db.Integer)  # in minutes
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    date = db.Column(db.Date, default=datetime.utcnow().date)

class VentingPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    anonymous = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    likes = db.Column(db.Integer, default=0)
    
    # Relationship
    responses = db.relationship('VentingResponse', backref='post', lazy=True, cascade='all, delete-orphan')

class VentingResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('venting_post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    anonymous = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='venting_responses')

class SoundVentingSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Session duration in seconds
    max_decibel = db.Column(db.Float)  # Maximum decibel level reached
    avg_decibel = db.Column(db.Float)  # Average decibel level
    scream_count = db.Column(db.Integer, default=0)  # Number of screams (90+ dB)
    session_type = db.Column(db.String(20), default='sound_venting')  # sound_venting, therapy_scream
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    
    user = db.relationship('User', backref='sound_venting_sessions')

class InkblotResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    responses = db.Column(JSONB, nullable=False) # Blot index -> short response
    story_elaborations = db.Column(JSONB) # Blot index -> detailed story
    sharing_status = db.Column(db.Boolean, default=False)
    pdf_path = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='inkblot_results')

class UserActivityLog(db.Model):
    __tablename__ = 'user_activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False) # assessment, venting, meditation, chat, ar_vr
    action = db.Column(db.String(50)) # start, complete, submit, result_generated
    duration = db.Column(db.Integer) # in seconds
    result_value = db.Column(db.Float) # e.g., assessment score, max decibel
    extra_data = db.Column(JSONB) # Any additional context
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    date = db.Column(db.Date, default=datetime.utcnow().date)

    user = db.relationship('User', backref='activity_logs')

class ConsultationRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    counsellor_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Link to counsellor
    urgency_level = db.Column(db.String(10), nullable=False)  # low, medium, high
    time_slot = db.Column(db.String(50))  # Selected time slot
    contact_preference = db.Column(db.String(20))  # phone, email, video
    additional_notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, booked, completed
    session_datetime = db.Column(db.DateTime)  # Scheduled session date/time
    session_notes = db.Column(db.Text)  # Notes by counsellor after session
    feedback_rating = db.Column(db.Integer)  # User rating (1-5)
    feedback_text = db.Column(db.Text)  # User feedback
    chat_video_link = db.Column(db.String(256))  # Secure chat/video link
    follow_up_datetime = db.Column(db.DateTime)  # Next follow-up session
    
    # Attachment for shared reports
    attachment_type = db.Column(db.String(20)) # 'assessment', 'inkblot'
    attachment_id = db.Column(db.Integer)     # ID of the report in its table
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='consultation_requests')
    counsellor = db.relationship('User', foreign_keys=[counsellor_id], backref='counsellor_consultations')

class AvailabilitySlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    counsellor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    counsellor = db.relationship('User', foreign_keys=[counsellor_id], backref='availability_slots')



