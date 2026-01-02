from flask import request, session
from flask_restx import Namespace, Resource, fields
from flask_login import login_user, logout_user, login_required, current_user
from models import User
from app import db
from datetime import datetime

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
        user = User.query.filter_by(username=data['username']).first()
        if user and user.check_password(data['password']):
            login_user(user)
            
            # Update streak
            today = datetime.utcnow().date()
            if user.last_streak_date:
                if user.last_streak_date == today - datetime.timedelta(days=1):
                    user.login_streak += 1
                elif user.last_streak_date < today - datetime.timedelta(days=1):
                    user.login_streak = 1
            else:
                user.login_streak = 1
            user.last_streak_date = today
            db.session.commit()
            
            return {'message': 'Login successful', 'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'login_streak': user.login_streak
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
        
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'student'),
            student_id=data.get('student_id'),
            accommodation_type=data.get('accommodation_type')
        )
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
