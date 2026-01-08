from app import app, db
from db_models import User, Assessment, UserActivityLog, ChatSession, ChatMessage, ChatIntent, CrisisAlert, ConsultationRequest
import random
from datetime import datetime, timedelta, timezone
import json

FEATURES = ["meditation", "ar_breathing", "vr_meditation", "chat", "assessment", "inkblot", "breathing_exercise"]
SEVERITIES = ["None", "Mild", "Moderate", "Severe"]
CRISIS_KEYWORDS = ["suicide", "hopeless", "harm", "worthless", "die", "end it all"]
INTENTS = ["crisis", "anxiety", "depression", "stress", "support", "general"]

def utc_now():
    return datetime.now(timezone.utc)

def seed_insights():
    with app.app_context():
        print("Seeding insights and activity logs...")
        
        students = User.query.filter_by(role='student').all()
        
        for student in students:
            print(f"Processing student: {student.username}")
            
            for _ in range(random.randint(1, 4)):
                score = random.randint(0, 27)
                severity = "None"
                if score > 5: severity = "Mild"
                if score > 10: severity = "Moderate"
                if score > 15: severity = "Severe"
                
                assess = Assessment(
                    user_id=student.id,
                    assessment_type="PHQ-9",
                    responses=json.dumps({"q1": 1, "q2": 2}),
                    score=score,
                    severity_level=severity,
                    completed_at=utc_now() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(assess)
            
            for _ in range(random.randint(5, 11)):
                feature = random.choice(FEATURES)
                log = UserActivityLog(
                    user_id=student.id,
                    activity_type=feature,
                    action="complete",
                    duration=random.randint(60, 600),
                    timestamp=utc_now() - timedelta(hours=random.randint(1, 100))
                )
                db.session.add(log)
            
            if random.random() < 0.3:
                session = ChatSession(
                    user_id=student.id,
                    crisis_flag=True,
                    session_start=utc_now() - timedelta(days=random.randint(0, 5))
                )
                db.session.add(session)
                db.session.commit()
                
                msg = ChatMessage(
                    session_id=session.id,
                    message_type="user",
                    content="I feel really hopeless and I don't know what to do.",
                    crisis_keywords=json.dumps(["hopeless"])
                )
                db.session.add(msg)
                db.session.commit()
                
                intent = ChatIntent(
                    session_id=session.id,
                    message_id=msg.id,
                    user_id=student.id,
                    user_message="I feel really hopeless and I don't know what to do.",
                    intent_data=json.dumps({"intent": "crisis", "confidence": 0.95}),
                    intent_type="crisis",
                    emotional_state="distressed",
                    self_harm_crisis=True,
                    timestamp=utc_now() - timedelta(days=random.randint(0, 5))
                )
                db.session.add(intent)
                db.session.commit()
                
                alert = CrisisAlert(
                    user_id=student.id,
                    session_id=session.id,
                    intent_id=intent.id,
                    alert_type="self_harm",
                    severity="critical",
                    message_snippet="I feel really hopeless...",
                    intent_summary=json.dumps({"summary": "User expressing hopelessness"}),
                    acknowledged=random.choice([True, False])
                )
                db.session.add(alert)
            
            if random.random() < 0.6:
                session = ChatSession(
                    user_id=student.id,
                    crisis_flag=False,
                    session_start=utc_now() - timedelta(days=random.randint(0, 10))
                )
                db.session.add(session)
                db.session.commit()
                
                for _ in range(random.randint(2, 5)):
                    content = "This is a normal conversation message."
                    msg = ChatMessage(
                        session_id=session.id,
                        message_type=random.choice(["user", "bot"]),
                        content=content,
                        timestamp=utc_now() - timedelta(hours=random.randint(1, 48))
                    )
                    db.session.add(msg)
                    db.session.commit()
                    
                    if msg.message_type == "user":
                        intent_type = random.choice(["support", "general", "anxiety", "stress"])
                        intent = ChatIntent(
                            session_id=session.id,
                            message_id=msg.id,
                            user_id=student.id,
                            user_message=content,
                            intent_data=json.dumps({"intent": intent_type, "confidence": random.uniform(0.7, 0.99)}),
                            intent_type=intent_type,
                            emotional_state="neutral",
                            timestamp=utc_now() - timedelta(hours=random.randint(1, 48))
                        )
                        db.session.add(intent)
            
            # Skipping consultations for now
            if False and random.random() < 0.2:
                counsellors = User.query.filter_by(role='counsellor').all()
                if counsellors:
                    consultation = ConsultationRequest(
                        user_id=student.id,
                        counsellor_id=random.choice(counsellors).id,
                        preferred_date=utc_now() + timedelta(days=random.randint(1, 7)),
                        preferred_time="14:00",
                        reason="Need to discuss academic stress and anxiety",
                        status=random.choice(["pending", "confirmed", "completed"]),
                        timestamp=utc_now() - timedelta(days=random.randint(0, 3))
                    )
                    db.session.add(consultation)
                
            student.login_streak = random.randint(0, 20)
            
        db.session.commit()
        print("Insights seeded successfully!")

if __name__ == "__main__":
    seed_insights()
