from app import app, db
from db_models import Organization

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    
    # Create default organization
    if not Organization.query.filter_by(name='TechFiesta').first():
        org = Organization(name='TechFiesta')
        db.session.add(org)
        db.session.commit()
        print("Default Organization 'TechFiesta' created.")
        
    print("Database reset successfully.")
