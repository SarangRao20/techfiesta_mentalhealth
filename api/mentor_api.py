from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import User, UserActivityLog, Assessment, ChatSession
from database import db

ns = Namespace('mentor', description='Mentor and Student Management')

@ns.route('/students')
class MentorStudents(Resource):
    @login_required
    def get(self):
        """Get list of students connected to this mentor"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        from sqlalchemy import or_
        
        query = User.query.filter(User.role == 'student')
        conditions = [User.mentor_id == current_user.id]
        
        if current_user.organization_id:
            print(f"DEBUG: Filtering by Org ID: {current_user.organization_id}")
            conditions.append(User.organization_id == current_user.organization_id)
        else:
            print("DEBUG: No Org ID found for current_user")
            
        students = query.filter(or_(*conditions)).all()
        print(f"DEBUG: Found {len(students)} students")
        for s in students:
            print(f" - Found: {s.username} (Org: {s.organization_id})")
            
        return [
            {
                'id': s.id,
                'full_name': s.full_name,
                'username': s.username,
                'email': s.email,
                'login_streak': s.login_streak,
                'profile_picture': s.profile_picture,
                'has_risk': ChatSession.query.filter_by(user_id=s.id, crisis_flag=True).count() > 0
            } for s in students
        ], 200

@ns.route('/student/<int:student_id>/insights')
class StudentInsights(Resource):
    @login_required
    def get(self, student_id):
        """Get insights for a specific student (only if connected)"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        student = User.query.get_or_404(student_id)
        is_connected = student.mentor_id == current_user.id
        is_same_org = (student.organization_id == current_user.organization_id) and (current_user.organization_id is not None)
        
        if not is_connected and not is_same_org and current_user.role != 'admin':
            return {'message': 'Forbidden: Student not connected to you'}, 403
            
        # Get recent assessments (basic info)
        assessments = Assessment.query.filter_by(user_id=student.id).order_by(Assessment.completed_at.desc()).limit(5).all()
        
        # Get recent activity logs
        logs = UserActivityLog.query.filter_by(user_id=student.id).order_by(UserActivityLog.timestamp.desc()).limit(20).all()

        # Get crisis flags (last 30 days)
        crisis_sessions = ChatSession.query.filter_by(user_id=student.id, crisis_flag=True).count()
        
        # Calculate consistency manually or use streak
        engagement_level = "Low"
        if student.login_streak > 5: engagement_level = "Medium"
        if student.login_streak > 15: engagement_level = "High"

        return {
            'student_info': {
                'name': student.full_name,
                'streak': student.login_streak,
                'email': student.email,
                'crisis_flags': crisis_sessions,
                'engagement': engagement_level
            },
            'recent_assessments': [
                {
                    'type': a.assessment_type,
                    'severity': a.severity_level,
                    'date': a.completed_at.isoformat()
                } for a in assessments
            ],
            'recent_activity': [
                {
                    'type': l.activity_type,
                    'action': l.action,
                    'date': l.timestamp.isoformat()
                } for l in logs
            ]
        }, 200

@ns.route('/connect')
class ConnectMentor(Resource):
    @login_required
    def post(self):
        """Connect the current user (student) to a mentor"""
        data = request.json
        mentor_id = data.get('mentor_id')
        
        if not mentor_id:
            return {'message': 'Mentor ID required'}, 400
            
        mentor = User.query.get(mentor_id)
        if not mentor or mentor.role not in ['teacher', 'admin']:
            return {'message': 'Invalid mentor ID'}, 404
            
        current_user.mentor_id = mentor.id
        db.session.commit()
        
        return {'message': f'Successfully connected to mentor {mentor.full_name}'}, 200

@ns.route('/list_mentors')
class ListMentors(Resource):
    @login_required
    def get(self):
        """List all available mentors"""
        mentors = User.query.filter(User.role.in_(['teacher', 'admin'])).all()
        return [
            {
                'id': m.id,
                'name': m.full_name
            } for m in mentors
        ], 200
