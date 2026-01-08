from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Updating severity_level column length...")
    db.session.execute(text("ALTER TABLE assessment ALTER COLUMN severity_level TYPE VARCHAR(50);"))
    db.session.commit()
    print("Column updated successfully!")
