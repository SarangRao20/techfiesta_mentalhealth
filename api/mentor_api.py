from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import User, UserActivityLog, Assessment
from app import db

ns = Namespace('mentor', description='Mentor and Student Management')

@ns.route('/students')
class MentorStudents(Resource):
    @login_required
    def get(self):
        """Get list of students connected to this mentor"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        students = User.query.filter_by(mentor_id=current_user.id).all()
        return [
            {
                'id': s.id,
                'full_name': s.full_name,
                'username': s.username,
                'email': s.email,
                'login_streak': s.login_streak
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
        if student.mentor_id != current_user.id and current_user.role != 'admin':
            return {'message': 'Forbidden: Student not connected to you'}, 403
            
        # Get recent assessments (basic info)
        assessments = Assessment.query.filter_by(user_id=student.id).order_by(Assessment.completed_at.desc()).limit(5).all()
        
        # Get recent activity logs
        logs = UserActivityLog.query.filter_by(user_id=student.id).order_by(UserActivityLog.timestamp.desc()).limit(20).all()
        
        return {
            'student_info': {
                'name': student.full_name,
                'streak': student.login_streak,
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
