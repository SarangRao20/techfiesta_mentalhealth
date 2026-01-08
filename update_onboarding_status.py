"""
Update is_onboarded status for existing non-student users
Teachers, mentors, counsellors, and admins don't need onboarding
"""
from app import app
from database import db
from db_models import User

def update_onboarding_status():
    with app.app_context():
        # Get all non-student users
        non_students = User.query.filter(
            User.role.in_(['teacher', 'admin', 'counsellor'])
        ).all()
        
        count = 0
        for user in non_students:
            if not user.is_onboarded:
                user.is_onboarded = True
                count += 1
        
        db.session.commit()
        
        print(f"✅ Updated {count} non-student users to is_onboarded=True")
        print(f"   Total non-students: {len(non_students)}")
        
        # Show stats
        students = User.query.filter_by(role='student').count()
        students_onboarded = User.query.filter_by(role='student', is_onboarded=True).count()
        students_pending = students - students_onboarded
        
        print(f"\n📊 Current Status:")
        print(f"   Students (total): {students}")
        print(f"   Students (onboarded): {students_onboarded}")
        print(f"   Students (pending onboarding): {students_pending}")
        print(f"   Non-students (all onboarded): {len(non_students)}")

if __name__ == "__main__":
    update_onboarding_status()
