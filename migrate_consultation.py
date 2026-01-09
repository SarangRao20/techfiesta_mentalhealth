from app import app, db
from sqlalchemy import text

with app.app_context():
    with db.engine.connect() as conn:
        conn.execute(text("ALTER TABLE consultation_request ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(512)"))
        conn.commit()
        print("Migration successful: Added meeting_link to consultation_request")
