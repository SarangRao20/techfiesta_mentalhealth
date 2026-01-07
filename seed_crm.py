from app import app, db
from db_models import User, Organization
from sqlalchemy import text
import time

# --- CONFIGURATION ---

ORG_NAMES = ["TechFiesta", "MindCare", "FutureLeaders"]

# Explicit mapping as requested
USERS_DATA = [
    {
        "email": "raosarang20@gmail.com",
        "role": "teacher",
        "username": "mentor_raosarang20",
        "org": "TechFiesta"
    },
    {
        "email": "raosarang2006@gmail.com",
        "role": "student",
        "username": "raosarang2006",
        "org": "TechFiesta"
    },

    {
        "email": "motivatwithus@gmail.com",
        "role": "counsellor",
        "username": "counsellor_motivat",
        "org": None
    },
    {
        "email": "Shahatharva20@gmail.com",
        "role": "counsellor",
        "username": "counsellor_shahatharva",
        "org": None
    },

    {
        "email": "sumitarya6217.dev@gmail.com",
        "role": "teacher",
        "username": "mentor_sumit",
        "org": "MindCare"
    },
    {
        "email": "krishna638738@gmail.com",
        "role": "teacher",
        "username": "mentor_krishna",
        "org": "FutureLeaders"
    },
    {
        "email": "sa1111study@gmail.com",
        "role": "teacher",
        "username": "mentor_sa1111",
        "org": "TechFiesta"
    },

    {
        "email": "krishna345542@gmail.com",
        "role": "student",
        "username": "krishna345542",
        "org": "MindCare"
    },
    {
        "email": "iitiansa24@gmail.com",
        "role": "student",
        "username": "iitiansa24",
        "org": "FutureLeaders"
    },
    {
        "email": "cetaspirant8@gmail.com",
        "role": "student",
        "username": "cetaspirant8",
        "org": "TechFiesta"
    },
    {
        "email": "24f2000232@ds.study.iitm.ac.in",
        "role": "student",
        "username": "24f2000232",
        "org": "MindCare"
    }
]

def seed_database():
    with app.app_context():
        print("WARNING: Resetting database with STATIC configuration...")
        time.sleep(2)
        
        # 1. Clear Schema
        print("Dropping schema...")
        try:
            with db.engine.connect() as conn:
                conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"))
                conn.commit()
        except Exception as e:
            print(f"Aggressive drop failed: {e}. Trying drop_all...")
            db.drop_all()

        print("Creating tables...")
        db.create_all()

        # 2. Create Organizations
        print("Creating Organizations...")
        org_map = {} # Name -> ID
        for name in ORG_NAMES:
            org = Organization(name=name)
            db.session.add(org)
            db.session.commit() # Commit each to get ID immediately
            org_map[name] = org.id
            print(f" - Created Org: {name}")

        # 3. Create Users
        print("Creating Users...")
        for user_data in USERS_DATA:
            # Determine Org ID
            org_id = None
            if user_data["org"]:
                org_id = org_map.get(user_data["org"])
            
            u = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["username"].replace('_', ' ').title(),
                role=user_data["role"],
                organization_id=org_id
            )
            u.set_password("password123")
            
            # Extra fields
            if user_data["role"] == "student":
                u.accommodation_type = "hostel"
                u.student_id = f"STU{int(time.time())%10000}"

            db.session.add(u)
            print(f" - Created {user_data['role'].upper()}: {u.username} ({u.email})")

        db.session.commit()
        print("\nSeeding Complete!")

if __name__ == "__main__":
    seed_database()
