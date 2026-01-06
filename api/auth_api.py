from flask import request, session
from flask_restx import Namespace, Resource, fields
from flask_login import login_user, logout_user, login_required, current_user
from models import User
from datetime import datetime, timedelta
from app import db, r_streaks, r_sessions
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
    'accommodation_type': fields.String()
})

user_model = ns.model('User', {
    'id': fields.Integer(),
    'username': fields.String(),
    'email': fields.String(),
    'full_name': fields.String(),
    'role': fields.String(),
    'login_streak': fields.Integer()
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
                'login_streak': streak_count
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
        return {
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'student_id': user.student_id,
            'accommodation_type': user.accommodation_type,
            'bio': user.bio,
            'profile_picture': user.profile_picture
        }, 200

    @login_required
    def put(self):
        """Update profile details"""
        data = request.get_json()
        user = current_user
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
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
            'profile_picture': user.profile_picture
        }, 200
