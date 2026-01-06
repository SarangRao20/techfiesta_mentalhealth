from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        print("Starting migration...")
        
        # Check columns using raw SQL for simplicity in this context
        with db.engine.connect() as conn:
            # Add bio
            try:
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN bio TEXT"))
                print("Added bio column")
            except Exception as e:
                print(f"Skipped bio (might exist): {e}")

            # Add profile_picture
            try:
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN profile_picture TEXT"))
                print("Added profile_picture column")
            except Exception as e:
                print(f"Skipped profile_picture (might exist): {e}")

            # Add student_id
            try:
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN student_id VARCHAR(50)"))
                print("Added student_id column")
            except Exception as e:
                print(f"Skipped student_id (might exist): {e}")
                
            conn.commit()
            
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
