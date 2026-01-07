from flask import request, session
from flask_restx import Namespace, Resource, fields
from flask_login import login_user, logout_user, login_required, current_user
from db_models import User, Organization
from datetime import datetime, timedelta
from database import db, r_streaks, r_sessions
from utils.common import update_user_streak
import json

ns = Namespace('auth', description='Authentication operations')

login_model = ns.model('Login', {
    'username': fields.String(required=True, description='Username'),
    'password': fields.String(required=True, description='Password')
})

register_model = ns.model('Register', {
    'username': fields.String(required=True),
    'email': fields.String(required=True),
    'password': fields.String(required=True),
    'full_name': fields.String(required=True),
    'role': fields.String(default='student'),
    'student_id': fields.String(),
    'accommodation_type': fields.String(),
    'organization_id': fields.Integer(),
    'new_organization_name': fields.String()
})

user_model = ns.model('User', {
    'id': fields.Integer(),
    'username': fields.String(),
    'email': fields.String(),
    'full_name': fields.String(),
    'role': fields.String(),
    'login_streak': fields.Integer(),
    'organization_id': fields.Integer(),
    'organization_name': fields.String(attribute=lambda x: x.organization.name if x.organization else None)
})

@ns.route('/login')
class Login(Resource):
    @ns.expect(login_model)
    def post(self):
        """User login"""
        data = ns.payload
        import time
        start_time = time.time()
        
        user = User.query.filter_by(username=data['username']).first()
        print(f"DEBUG: DB User Fetch took {time.time() - start_time:.4f}s")
        
        if user and user.check_password(data['password']):
            step_start = time.time()
            login_user(user, remember=True)
            print(f"DEBUG: Flask-Login login_user took {time.time() - step_start:.4f}s")
            
            step_start = time.time()
            # Update streak in Redis (Syncs to DB in background)
            streak_count = update_user_streak(r_streaks, user)
            print(f"DEBUG: Streak Update took {time.time() - step_start:.4f}s")
            
            step_start = time.time()
            # Invalidate profile cache
            r_sessions.delete(f"user_profile:{user.id}")
            print(f"DEBUG: Cache Invalidation took {time.time() - step_start:.4f}s")
            
            step_start = time.time()
            # Trigger background calculation so it's ready when dashboard calls
            from api.dashboard_api import precalculate_dashboard_task
            precalculate_dashboard_task.delay(user.id)
            print(f"DEBUG: Celery Task Trigger took {time.time() - step_start:.4f}s")

            print(f"DEBUG: TOTAL LOGIN TIME: {time.time() - start_time:.4f}s")

            return {'message': 'Login successful', 'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'full_name': user.full_name,
                'full_name': user.full_name,
                'login_streak': streak_count,
                'organization_id': user.organization_id,
                'organization_name': user.organization.name if user.organization else None
            }}, 200
        return {'message': 'Invalid credentials'}, 401

@ns.route('/register')
class Register(Resource):
    @ns.expect(register_model)
    def post(self):
        """User registration"""
        data = ns.payload
        if User.query.filter_by(username=data['username']).first():
            return {'message': 'Username already exists'}, 400
        if User.query.filter_by(email=data['email']).first():
            return {'message': 'Email already exists'}, 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'student'),
            accommodation_type=data.get('accommodation_type')
        )
        
        # Organization Logic
        org_id = data.get('organization_id')
        new_org_name = data.get('new_organization_name')
        
        if new_org_name:
            # Check if exists
            org = Organization.query.filter_by(name=new_org_name).first()
            if not org:
                org = Organization(name=new_org_name)
                db.session.add(org)
                db.session.commit()
            user.organization_id = org.id
        elif org_id:
            user.organization_id = org_id
            
        if data.get('student_id'):
            user.set_student_id(data['student_id'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return {'message': 'User registered successfully'}, 201

@ns.route('/logout')
class Logout(Resource):
    @login_required
    def post(self):
        """User logout"""
        logout_user()
        return {'message': 'Logout successful'}, 200

@ns.route('/organizations')
class OrganizationList(Resource):
    def get(self):
        """List all organizations"""
        orgs = Organization.query.all()
        return [{'id': o.id, 'name': o.name} for o in orgs], 200

@ns.route('/me')
class CurrentUser(Resource):
    @login_required
    @ns.marshal_with(user_model)
    def get(self):
        """Get current user info"""
        return current_user

@ns.route('/profile')
class Profile(Resource):
    @login_required
    def get(self):
        """Get full profile details"""
        user = current_user
        try:
            print(f"DEBUG: Fetching profile for {user.username}")
            org_name = user.organization.name if user.organization else None
            return {
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'student_id': user.student_id,
                'accommodation_type': user.accommodation_type,
                'bio': user.bio,
                'profile_picture': user.profile_picture,
                'organization_name': org_name,
                'organization_id': user.organization_id
            }, 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {'message': f'Internal Error: {str(e)}'}, 500

    @login_required
    def put(self):
        """Update profile details (supports JSON or Multipart)"""
        user = current_user
        data = {}
        
        # Handle both JSON and Multipart/Form-data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Handle Image Upload
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename != '':
                try:
                    from utils.supabase_client import supabase
                    import uuid
                    
                    if not supabase:
                        return {'message': 'Image upload unavailable (Server Config Error)'}, 500
                        
                    # Generate unique filename
                    file_ext = file.filename.split('.')[-1]
                    filename = f"{user.id}_{uuid.uuid4()}.{file_ext}"
                    file_content = file.read()
                    
                    # Upload to Supabase 'avatars' bucket
                    bucket_name = "avatars" 
                    # Ensure you have created this bucket in Supabase and made it public!
                    
                    res = supabase.storage.from_(bucket_name).upload(
                        path=filename,
                        file=file_content,
                        file_options={"content-type": file.content_type}
                    )
                    
                    # Get Public URL
                    public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                    user.profile_picture = public_url
                    print(f"INFO: Uploaded avatar for {user.username} -> {public_url}")
                    
                except Exception as e:
                    print(f"ERROR: Image upload failed: {e}")
                    return {'message': f'Image upload failed: {str(e)}'}, 500

        # Update text fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'bio' in data:
            user.bio = data['bio']
        # Only update profile_picture from text if NOT uploaded as file (e.g. clearing it)
        if 'profile_picture' in data and 'profile_picture' not in request.files:
             # If user sends null/empty string to remove image
             if not data['profile_picture']:
                 user.profile_picture = None

        if 'student_id' in data:
            user.student_id = data['student_id']
        if 'accommodation_type' in data:
            user.accommodation_type = data['accommodation_type']
            
        db.session.commit()
        
        # Invalidate profile cache so it re-fetches with new details
        r_sessions.delete(f"user_profile:{user.id}")
        
        return {
            'message': 'Profile updated successfully',
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'student_id': user.student_id,
            'accommodation_type': user.accommodation_type,
            'bio': user.bio,
            'profile_picture': user.profile_picture,
            'organization_name': user.organization.name if user.organization else None,
            'organization_id': user.organization_id
        }, 200
