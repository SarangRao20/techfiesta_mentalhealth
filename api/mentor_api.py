from flask import request, send_file
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import User, UserActivityLog, Assessment, ChatSession, CrisisAlert, ChatIntent, OnboardingResponse
from database import db, r_sessions, cache
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from utils.celery_app import celery
import json

ns = Namespace('mentor', description='Mentor and Student Management')

@celery.task
def precalculate_student_insights(student_id):
    """Background task to calculate and cache student insights"""
    try:
        student = User.query.get(student_id)
        if not student:
            return None
            
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get all data
        assessments = Assessment.query.filter_by(user_id=student_id).order_by(Assessment.completed_at.desc()).limit(5).all()
        logs = UserActivityLog.query.filter_by(user_id=student_id).order_by(UserActivityLog.timestamp.desc()).limit(20).all()
        crisis_sessions = ChatSession.query.filter_by(user_id=student_id, crisis_flag=True).count()
        recent_crisis_alerts = CrisisAlert.query.filter(
            CrisisAlert.user_id == student_id,
            CrisisAlert.created_at >= thirty_days_ago
        ).order_by(CrisisAlert.created_at.desc()).limit(5).all()
        recent_intents = ChatIntent.query.filter(
            ChatIntent.user_id == student_id,
            ChatIntent.timestamp >= thirty_days_ago
        ).order_by(ChatIntent.timestamp.desc()).limit(10).all()
        
        # Calculate stats
        current_emotional_state = None
        current_emotional_intensity = None
        if recent_intents:
            latest_intent = recent_intents[0]
            current_emotional_state = latest_intent.emotional_state
            current_emotional_intensity = latest_intent.emotional_intensity
        
        engagement_level = "Low"
        if student.login_streak > 5: engagement_level = "Medium"
        if student.login_streak > 15: engagement_level = "High"
        
        activity_stats = {
            'total_activities': len(logs),
            'meditation_count': sum(1 for l in logs if l.activity_type == 'meditation'),
            'assessment_count': sum(1 for l in logs if l.activity_type == 'assessment'),
            'chat_count': sum(1 for l in logs if l.activity_type == 'chat'),
            'venting_count': sum(1 for l in logs if l.activity_type == 'venting')
        }
        
        # Build insights object
        insights = {
            'student_info': {
                'name': student.full_name,
                'username': student.username,
                'login_streak': student.login_streak,
                'last_login': student.last_login.isoformat() if student.last_login else None,
                'engagement_level': engagement_level,
                'crisis_flags': crisis_sessions,
                'current_emotional_state': current_emotional_state,
                'current_emotional_intensity': current_emotional_intensity,
                'status': calculate_user_status(student_id)
            },
            'activity_stats': activity_stats,
            'crisis_alerts': [{
                'severity': a.severity,
                'alert_type': a.alert_type,
                'message_snippet': a.message_snippet,
                'created_at': a.created_at.isoformat(),
                'time_ago': get_time_ago(a.created_at)
            } for a in recent_crisis_alerts],
            'recent_activity': [{
                'type': l.activity_type,
                'action': l.action_description or l.activity_type,
                'date': l.timestamp.isoformat(),
                'duration': getattr(l, 'duration_minutes', None)
            } for l in logs],
            'emotional_trends': [{
                'date': i.timestamp.strftime('%m/%d'),
                'state': i.emotional_state,
                'intensity': i.emotional_intensity
            } for i in recent_intents]
        }
        
        # Cache for 5 minutes
        cache_key = f"mentor:student_insights:{student_id}"
        r_sessions.setex(cache_key, 300, json.dumps(insights))
        
        return insights
    except Exception as e:
        print(f"Error calculating insights for student {student_id}: {e}")
        return None

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
                'last_login': s.last_login.isoformat() if s.last_login else None,
                'is_onboarded': s.is_onboarded
            } for s in students
        ], 200

@ns.route('/student/<int:student_id>/insights')
class StudentInsights(Resource):
    @login_required
    def get(self, student_id):
        """Get insights for a specific student (only if connected) - CACHED"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        student = User.query.get_or_404(student_id)
        is_connected = student.mentor_id == current_user.id
        is_same_org = (student.organization_id == current_user.organization_id) and (current_user.organization_id is not None)
        
        if not is_connected and not is_same_org and current_user.role != 'admin':
            return {'message': 'Forbidden: Student not connected to you'}, 403
        
        # Try to get from Redis cache first
        cache_key = f"mentor:student_insights:{student_id}"
        cached_insights = r_sessions.get(cache_key)
        
        if cached_insights:
            return json.loads(cached_insights), 200
        
        # If not in cache, trigger background calculation and return quick version
        precalculate_student_insights.delay(student_id)
        
        # Return quick basic info while background task runs
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        assessments = Assessment.query.filter_by(user_id=student.id).order_by(Assessment.completed_at.desc()).limit(5).all()
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

@ns.route('/notifications')
class MentorNotifications(Resource):
    @login_required
    def get(self):
        """Get real-time notifications for mentor from Redis"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
        
        # Get notifications from Redis (sorted set by timestamp)
        notif_key = f"mentor:notifications:{current_user.id}"
        notifications = []
        
        # Get last 20 notifications
        notif_data = r_sessions.zrevrange(notif_key, 0, 19, withscores=True)
        
        for notif_json, timestamp in notif_data:
            try:
                notif = json.loads(notif_json)
                notif['timestamp'] = timestamp
                notifications.append(notif)
            except:
                pass
        
        return {'notifications': notifications, 'count': len(notifications)}, 200
    
    @login_required
    def delete(self):
        """Clear all notifications for mentor"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
        
        notif_key = f"mentor:notifications:{current_user.id}"
        r_sessions.delete(notif_key)
        
        return {'message': 'Notifications cleared'}, 200

def push_mentor_notification(mentor_id, notification_data):
    """Push notification to mentor's Redis notification queue"""
    try:
        notif_key = f"mentor:notifications:{mentor_id}"
        timestamp = datetime.utcnow().timestamp()
        
        # Add to sorted set (keeps them ordered by time)
        r_sessions.zadd(notif_key, {json.dumps(notification_data): timestamp})
        
        # Keep only last 50 notifications
        r_sessions.zremrangebyrank(notif_key, 0, -51)
        
        # Set expiry of 7 days
        r_sessions.expire(notif_key, 604800)
    except Exception as e:
        print(f"Error pushing notification: {e}")

@ns.route('/student/<int:student_id>/onboarding-report')
class StudentOnboardingReport(Resource):
    @login_required
    def get(self, student_id):
        """Get onboarding report for a specific student"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        student = User.query.get_or_404(student_id)
        is_connected = student.mentor_id == current_user.id
        is_same_org = (student.organization_id == current_user.organization_id) and (current_user.organization_id is not None)
        
        if not is_connected and not is_same_org and current_user.role != 'admin':
            return {'message': 'Forbidden: Student not connected to you'}, 403
        
        # Get onboarding response
        onboarding = OnboardingResponse.query.filter_by(user_id=student.id).first()
        
        if not onboarding:
            return {
                'message': 'No onboarding data found',
                'student_name': student.full_name,
                'is_onboarded': student.is_onboarded,
                'onboarding_data': None
            }, 200
        
        return {
            'student_id': student.id,
            'student_name': student.full_name,
            'username': student.username,
            'email': student.email,
            'is_onboarded': student.is_onboarded,
            'onboarding_data': {
                'responses': onboarding.responses,
                'completed_at': onboarding.created_at.isoformat() if onboarding.created_at else None
            }
        }, 200

@ns.route('/student/<int:student_id>/onboarding-report/pdf')
class StudentOnboardingPDF(Resource):
    @login_required
    def get(self, student_id):
        """Generate PDF report of student's onboarding responses"""
        if current_user.role not in ['teacher', 'admin']:
            return {'message': 'Unauthorized'}, 403
            
        student = User.query.get_or_404(student_id)
        is_connected = student.mentor_id == current_user.id
        is_same_org = (student.organization_id == current_user.organization_id) and (current_user.organization_id is not None)
        
        if not is_connected and not is_same_org and current_user.role != 'admin':
            return {'message': 'Forbidden: Student not connected to you'}, 403
        
        # Get onboarding response
        onboarding = OnboardingResponse.query.filter_by(user_id=student.id).first()
        
        if not onboarding:
            return {'message': 'No onboarding data found'}, 404
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#4F46E5'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Title
        story.append(Paragraph("Onboarding Report", title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Student Info
        info_data = [
            ['Student Name:', student.full_name],
            ['Username:', student.username],
            ['Email:', student.email],
            ['Completed At:', onboarding.created_at.strftime('%B %d, %Y at %I:%M %p') if onboarding.created_at else 'N/A']
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4B5563')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1F2937')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.4 * inch))
        
        # Responses section
        story.append(Paragraph("Onboarding Responses", heading_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Question labels mapping
        question_labels = {
            'adjustment': 'Adjustment to New Environment',
            'social': 'Social Connections',
            'academic': 'Academic Pressure',
            'support': 'Support System',
            'anxiety': 'Mental Well-being'
        }
        
        # Add each response
        for key, value in onboarding.responses.items():
            question = question_labels.get(key, key.replace('_', ' ').title())
            story.append(Paragraph(f"<b>{question}:</b>", styles['Normal']))
            story.append(Spacer(1, 0.05 * inch))
            story.append(Paragraph(f"<i>{value}</i>", styles['Normal']))
            story.append(Spacer(1, 0.15 * inch))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'onboarding_report_{student.username}_{datetime.now().strftime("%Y%m%d")}.pdf'
        )
