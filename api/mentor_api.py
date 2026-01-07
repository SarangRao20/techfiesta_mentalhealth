from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import User, UserActivityLog, Assessment, ChatSession, CrisisAlert, ChatIntent
from database import db
from datetime import datetime, timedelta

ns = Namespace('mentor', description='Mentor and Student Management')

@ns.route('/crisis-alerts')
class CrisisAlerts(Resource):
    @login_required
    def get(self):
        """Get unacknowledged crisis alerts for students under this mentor"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
        
        # Get students under this mentor
        from sqlalchemy import or_
        query = User.query.filter(User.role == 'student')
        conditions = [User.mentor_id == current_user.id]
        
        if current_user.organization_id:
            conditions.append(User.organization_id == current_user.organization_id)
        
        students = query.filter(or_(*conditions)).all()
        student_ids = [s.id for s in students]
        
        # Get crisis alerts for these students
        alerts = CrisisAlert.query.filter(
            CrisisAlert.user_id.in_(student_ids),
            CrisisAlert.acknowledged == False
        ).order_by(CrisisAlert.created_at.desc()).limit(50).all()
        
        return [{
            'id': a.id,
            'user_id': a.user_id,
            'student_name': User.query.get(a.user_id).full_name if User.query.get(a.user_id) else 'Unknown',
            'alert_type': a.alert_type,
            'severity': a.severity,
            'message_snippet': a.message_snippet,
            'intent_summary': a.intent_summary,
            'created_at': a.created_at.isoformat(),
            'time_ago': get_time_ago(a.created_at)
        } for a in alerts], 200

@ns.route('/crisis-alerts/<int:alert_id>/acknowledge')
class AcknowledgeCrisisAlert(Resource):
    @login_required
    def post(self, alert_id):
        """Acknowledge a crisis alert"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
        
        alert = CrisisAlert.query.get_or_404(alert_id)
        
        # Verify mentor has access to this student
        student = User.query.get(alert.user_id)
        if not student:
            return {'message': 'Student not found'}, 404
        
        is_connected = student.mentor_id == current_user.id
        is_same_org = (student.organization_id == current_user.organization_id) and (current_user.organization_id is not None)
        
        if not is_connected and not is_same_org and current_user.role != 'admin':
            return {'message': 'Forbidden'}, 403
        
        alert.acknowledged = True
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Alert acknowledged'}, 200

def get_time_ago(dt):
    """Helper to get human-readable time ago"""
    if not dt:
        return 'Unknown'
    
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds >= 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds >= 60:
        return f"{diff.seconds // 60}m ago"
    else:
        return "Just now"

def calculate_user_status(student_id):
    """Calculate user status based on emotional state, crisis alerts, and activity"""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Check for recent crisis alerts
    recent_crisis = CrisisAlert.query.filter(
        CrisisAlert.user_id == student_id,
        CrisisAlert.created_at >= seven_days_ago
    ).order_by(CrisisAlert.created_at.desc()).first()
    
    if recent_crisis and recent_crisis.severity in ['critical', 'high']:
        return "Critical"
    
    # Check recent emotional states from chat intents
    recent_intents = ChatIntent.query.filter(
        ChatIntent.user_id == student_id,
        ChatIntent.timestamp >= seven_days_ago
    ).order_by(ChatIntent.timestamp.desc()).limit(10).all()
    
    if recent_intents:
        # Count negative emotional states
        negative_states = ['low', 'sad', 'anxious', 'stressed', 'overwhelmed', 'frustrated', 'angry', 'numb']
        high_intensity_count = sum(1 for intent in recent_intents 
                                   if intent.emotional_state in negative_states 
                                   and intent.emotional_intensity in ['moderate', 'high', 'critical'])
        
        if high_intensity_count >= 5:  # More than half are negative
            return "Needs attention"
    
    # Check activity engagement
    recent_activity = UserActivityLog.query.filter(
        UserActivityLog.user_id == student_id,
        UserActivityLog.timestamp >= seven_days_ago
    ).count()
    
    # Check student login streak
    student = User.query.get(student_id)
    
    # Positive indicators
    if recent_activity >= 3 and student.login_streak >= 3 and not recent_crisis:
        return "Doing well"
    
    # Default to needs attention if low engagement
    if recent_activity < 2 or student.login_streak < 2:
        return "Needs attention"
    
    return "Neutral"

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
                'has_risk': ChatSession.query.filter_by(user_id=s.id, crisis_flag=True).count() > 0,
                'status': calculate_user_status(s.id),
                'last_login': s.last_login.isoformat() if s.last_login else None
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
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        crisis_sessions = ChatSession.query.filter_by(user_id=student.id, crisis_flag=True).count()
        
        # Get recent crisis alerts with details
        recent_crisis_alerts = CrisisAlert.query.filter(
            CrisisAlert.user_id == student.id,
            CrisisAlert.created_at >= thirty_days_ago
        ).order_by(CrisisAlert.created_at.desc()).limit(5).all()
        
        # Get recent emotional states from chat intents
        recent_intents = ChatIntent.query.filter(
            ChatIntent.user_id == student.id,
            ChatIntent.timestamp >= thirty_days_ago
        ).order_by(ChatIntent.timestamp.desc()).limit(10).all()
        
        # Calculate current emotional state (most recent)
        current_emotional_state = None
        current_emotional_intensity = None
        if recent_intents:
            latest_intent = recent_intents[0]
            current_emotional_state = latest_intent.emotional_state
            current_emotional_intensity = latest_intent.emotional_intensity
        
        # Calculate consistency manually or use streak
        engagement_level = "Low"
        if student.login_streak > 5: engagement_level = "Medium"
        if student.login_streak > 15: engagement_level = "High"
        
        # Activity stats
        activity_stats = {
            'total_activities': len(logs),
            'meditation_count': sum(1 for l in logs if l.activity_type == 'meditation'),
            'assessment_count': sum(1 for l in logs if l.activity_type == 'assessment'),
            'chat_count': sum(1 for l in logs if l.activity_type == 'chat'),
            'venting_count': sum(1 for l in logs if l.activity_type == 'venting')
        }

        # Parse assessment insights for mentor view
        assessment_insights = []
        for a in assessments:
            if a.recommendations:
                import json
                try:
                    full_analysis = json.loads(a.recommendations)
                    mentor_data = full_analysis.get('mentor_view', {})
                    assessment_insights.append({
                        'type': a.assessment_type,
                        'severity': a.severity_level,
                        'score': a.score,
                        'date': a.completed_at.isoformat(),
                        'mentor_guidance': mentor_data.get('guidance', ''),
                        'action_items': mentor_data.get('action_items', []),
                        'red_flags': mentor_data.get('red_flags', []),
                        'requires_counselor': mentor_data.get('requires_counselor', False)
                    })
                except:
                    assessment_insights.append({
                        'type': a.assessment_type,
                        'severity': a.severity_level,
                        'score': a.score,
                        'date': a.completed_at.isoformat()
                    })
            else:
                assessment_insights.append({
                    'type': a.assessment_type,
                    'severity': a.severity_level,
                    'score': a.score,
                    'date': a.completed_at.isoformat()
                })

        return {
            'student_info': {
                'name': student.full_name,
                'streak': student.login_streak,
                'email': student.email,
                'crisis_flags': crisis_sessions,
                'engagement': engagement_level,
                'status': calculate_user_status(student.id),
                'current_emotional_state': current_emotional_state,
                'current_emotional_intensity': current_emotional_intensity,
                'last_login': student.last_login.isoformat() if student.last_login else None,
                'profile_picture': student.profile_picture
            },
            'recent_assessments': assessment_insights,
            'crisis_alerts': [
                {
                    'id': ca.id,
                    'severity': ca.severity,
                    'alert_type': ca.alert_type,
                    'message_snippet': ca.message_snippet,
                    'created_at': ca.created_at.isoformat(),
                    'acknowledged': ca.acknowledged
                } for ca in recent_crisis_alerts
            ],
            'emotional_trends': [
                {
                    'emotional_state': intent.emotional_state,
                    'emotional_intensity': intent.emotional_intensity,
                    'intent_type': intent.intent_type,
                    'timestamp': intent.timestamp.isoformat()
                } for intent in recent_intents
            ],
            'recent_activity': [
                {
                    'type': l.activity_type,
                    'action': l.action,
                    'date': l.timestamp.isoformat(),
                    'duration': l.duration
                } for l in logs
            ],
            'activity_stats': activity_stats
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
