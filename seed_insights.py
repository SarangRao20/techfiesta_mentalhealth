from app import app, db
from db_models import User, Assessment, UserActivityLog, ChatSession, ChatMessage
import random
from datetime import datetime, timedelta
import json

FEATURES = ["meditation", "ar_breathing", "vr_meditation", "chat", "assessment"]
SEVERITIES = ["None", "Mild", "Moderate", "Severe"]

def seed_insights():
    with app.app_context():
        print("Seeding insights and activity logs...")
        
        students = User.query.filter_by(role='student').all()
        
        for student in students:
            print(f"Processing student: {student.username}")
            
            # 1. Create Assessments
            # Create 1-3 random assessments
            for _ in range(random.randint(1, 4)):
                score = random.randint(0, 27)
                severity = "None"
                if score > 5: severity = "Mild"
                if score > 10: severity = "Moderate"
                if score > 15: severity = "Severe" # Crisis indicator
                
                assess = Assessment(
                    user_id=student.id,
                    assessment_type="PHQ-9",
                    responses=json.dumps({"q1": 1, "q2": 2}),
                    score=score,
                    severity_level=severity,
                    completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(assess)
            
            # 2. Create Activity Logs
            # Create 5-10 random activities
            for _ in range(random.randint(5, 11)):
                feature = random.choice(FEATURES)
                log = UserActivityLog(
                    user_id=student.id,
                    activity_type=feature,
                    action="complete",
                    duration=random.randint(60, 600),
                    timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 100))
                )
                db.session.add(log)
            
            # 3. Create Chat Session (Crisis Simulation for some)
            # 30% chance of having a crisis session
            if random.random() < 0.3:
                session = ChatSession(
                    user_id=student.id,
                    crisis_flag=True,
                    session_start=datetime.utcnow() - timedelta(days=random.randint(0, 5))
                )
                db.session.add(session)
                db.session.commit() # Need ID
                
                msg = ChatMessage(
                    session_id=session.id,
                    message_type="user",
                    content="I feel really hopeless and I don't know what to do.",
                    crisis_keywords=json.dumps(["hopeless"])
                )
                db.session.add(msg)
                
            # Random Login Streak
            student.login_streak = random.randint(0, 20)
            
        db.session.commit()
        print("Insights seeded successfully!")

if __name__ == "__main__":
    seed_insights()
