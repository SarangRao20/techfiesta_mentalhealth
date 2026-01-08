from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import User, UserActivityLog, Assessment, ChatSession, CrisisAlert, ChatIntent, ConsultationRequest, MeditationSession, VentingPost, InkblotResult
from database import db
from datetime import datetime, timedelta

ns = Namespace('counsellor', description='Counsellor Dashboard and Patient Insights')

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

@ns.route('/inbox')
class CounsellorInbox(Resource):
    @login_required
    def get(self):
        """Get consultation requests inbox for counsellor"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        # Get all requests for this counsellor
        requests = ConsultationRequest.query.filter_by(
            counsellor_id=current_user.id
        ).order_by(ConsultationRequest.created_at.desc()).all()
        
        return [{
            'id': r.id,
            'user_id': r.user_id,
            'patient_name': r.user.full_name,
            'patient_email': r.user.email,
            'patient_profile_picture': r.user.profile_picture,
            'urgency': r.urgency_level,
            'time_slot': r.time_slot,
            'contact_preference': r.contact_preference,
            'status': r.status,
            'notes': r.additional_notes,
            'attachments': r.attachments or [],
            'created_at': r.created_at.isoformat(),
            'time_ago': get_time_ago(r.created_at),
            'is_new': r.status == 'pending'
        } for r in requests], 200

@ns.route('/inbox/<int:request_id>/action')
class InboxAction(Resource):
    @login_required
    def post(self, request_id):
        """Accept or reject a consultation request from inbox"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        req = ConsultationRequest.query.get_or_404(request_id)
        if req.counsellor_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
        
        data = request.json
        action = data.get('action')  # 'accept' or 'reject'
        session_datetime = data.get('session_datetime')  # For accepting
        
        if action == 'accept':
            req.status = 'booked'
            if session_datetime:
                try:
                    req.session_datetime = datetime.fromisoformat(session_datetime.replace('Z', '+00:00'))
                except:
                    pass
            
            # Send email notification asynchronously
            from utils.email_service import send_consultation_status_email
            try:
                send_consultation_status_email.delay(
                    req.user.email, 
                    'accepted', 
                    current_user.full_name, 
                    req.time_slot or 'TBD'
                )
            except Exception as e:
                print(f"Email task queue error: {e}")
                
        elif action == 'reject':
            req.status = 'rejected'
            
            # Send email notification asynchronously
            from utils.email_service import send_consultation_status_email
            try:
                send_consultation_status_email.delay(
                    req.user.email, 
                    'rejected', 
                    current_user.full_name, 
                    req.time_slot or 'N/A'
                )
            except Exception as e:
                print(f"Email task queue error: {e}")
        else:
            return {'message': 'Invalid action'}, 400
        
        db.session.commit()
        return {'message': f'Request {action}ed successfully'}, 200

@ns.route('/patients')
class CounsellorPatients(Resource):
    @login_required
    def get(self):
        """Get list of patients with booked consultations"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        # Get all accepted/booked consultation requests
        booked_requests = ConsultationRequest.query.filter_by(
            counsellor_id=current_user.id,
            status='booked'
        ).all()
        
        # Get unique patients
        patient_ids = list(set([r.user_id for r in booked_requests]))
        patients = User.query.filter(User.id.in_(patient_ids)).all()
        
        return [{
            'id': p.id,
            'full_name': p.full_name,
            'username': p.username,
            'email': p.email,
            'profile_picture': p.profile_picture,
            'login_streak': p.login_streak,
            'last_login': p.last_login.isoformat() if p.last_login else None,
            'has_crisis': ChatSession.query.filter_by(user_id=p.id, crisis_flag=True).count() > 0,
            'pending_sessions': ConsultationRequest.query.filter_by(
                user_id=p.id, 
                counsellor_id=current_user.id, 
                status='booked'
            ).count()
        } for p in patients], 200

@ns.route('/patient/<int:patient_id>/insights')
class PatientDetailedInsights(Resource):
    @login_required
    def get(self, patient_id):
        """Get comprehensive insights for a patient (only if they have booked consultation)"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        # Verify this counsellor has access (patient has booked consultation)
        has_access = ConsultationRequest.query.filter_by(
            user_id=patient_id,
            counsellor_id=current_user.id,
            status='booked'
        ).first()
        
        if not has_access:
            return {'message': 'No active consultation with this patient'}, 403
        
        patient = User.query.get_or_404(patient_id)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Get all assessments with full details
        assessments = Assessment.query.filter_by(
            user_id=patient_id
        ).order_by(Assessment.completed_at.desc()).limit(10).all()
        
        # Get crisis alerts
        crisis_alerts = CrisisAlert.query.filter(
            CrisisAlert.user_id == patient_id,
            CrisisAlert.created_at >= thirty_days_ago
        ).order_by(CrisisAlert.created_at.desc()).all()
        
        # Get emotional trends from chat intents
        emotional_intents = ChatIntent.query.filter(
            ChatIntent.user_id == patient_id,
            ChatIntent.timestamp >= thirty_days_ago
        ).order_by(ChatIntent.timestamp.desc()).limit(30).all()
        
        # Get activity logs
        activity_logs = UserActivityLog.query.filter(
            UserActivityLog.user_id == patient_id,
            UserActivityLog.timestamp >= thirty_days_ago
        ).order_by(UserActivityLog.timestamp.desc()).all()
        
        # Get meditation sessions
        meditation_sessions = MeditationSession.query.filter(
            MeditationSession.user_id == patient_id,
            MeditationSession.completed_at >= thirty_days_ago
        ).all()
        
        # Get venting posts
        venting_posts = VentingPost.query.filter(
            VentingPost.user_id == patient_id,
            VentingPost.created_at >= thirty_days_ago
        ).order_by(VentingPost.created_at.desc()).limit(10).all()
        
        # Get inkblot results if any
        inkblot_results = InkblotResult.query.filter_by(
            user_id=patient_id
        ).order_by(InkblotResult.created_at.desc()).limit(5).all()
        
        # Calculate emotional state distribution
        emotional_state_counts = {}
        for intent in emotional_intents:
            state = intent.emotional_state or 'unknown'
            emotional_state_counts[state] = emotional_state_counts.get(state, 0) + 1
        
        # Calculate intensity distribution
        intensity_counts = {}
        for intent in emotional_intents:
            intensity = intent.emotional_intensity or 'unknown'
            intensity_counts[intensity] = intensity_counts.get(intensity, 0) + 1
        
        # Activity breakdown
        activity_breakdown = {}
        for log in activity_logs:
            activity_type = log.activity_type
            activity_breakdown[activity_type] = activity_breakdown.get(activity_type, 0) + 1
        
        # Most recent emotional state
        current_emotional_state = None
        current_emotional_intensity = None
        if emotional_intents:
            latest = emotional_intents[0]
            current_emotional_state = latest.emotional_state
            current_emotional_intensity = latest.emotional_intensity
        
        # Risk assessment
        critical_crisis_count = sum(1 for ca in crisis_alerts if ca.severity == 'critical')
        high_crisis_count = sum(1 for ca in crisis_alerts if ca.severity == 'high')
        risk_level = 'low'
        if critical_crisis_count > 0:
            risk_level = 'critical'
        elif high_crisis_count >= 2:
            risk_level = 'high'
        elif high_crisis_count == 1 or len(crisis_alerts) > 0:
            risk_level = 'moderate'
        
        return {
            'patient_info': {
                'id': patient.id,
                'full_name': patient.full_name,
                'username': patient.username,
                'email': patient.email,
                'profile_picture': patient.profile_picture,
                'login_streak': patient.login_streak,
                'last_login': patient.last_login.isoformat() if patient.last_login else None,
                'bio': patient.bio,
                'accommodation_type': patient.accommodation_type,
                'current_emotional_state': current_emotional_state,
                'current_emotional_intensity': current_emotional_intensity,
                'risk_level': risk_level
            },
            'assessments': [{
                'id': a.id,
                'type': a.assessment_type,
                'score': a.score,
                'severity': a.severity_level,
                'responses': a.responses,
                'recommendations': a.recommendations,
                'completed_at': a.completed_at.isoformat(),
                'time_ago': get_time_ago(a.completed_at)
            } for a in assessments],
            'crisis_alerts': [{
                'id': ca.id,
                'alert_type': ca.alert_type,
                'severity': ca.severity,
                'message_snippet': ca.message_snippet,
                'intent_summary': ca.intent_summary,
                'acknowledged': ca.acknowledged,
                'created_at': ca.created_at.isoformat(),
                'time_ago': get_time_ago(ca.created_at)
            } for ca in crisis_alerts],
            'emotional_trends': [{
                'emotional_state': ei.emotional_state,
                'emotional_intensity': ei.emotional_intensity,
                'intent_type': ei.intent_type,
                'cognitive_load': ei.cognitive_load,
                'help_receptivity': ei.help_receptivity,
                'self_harm_crisis': ei.self_harm_crisis,
                'timestamp': ei.timestamp.isoformat()
            } for ei in emotional_intents],
            'activity_logs': [{
                'activity_type': al.activity_type,
                'action': al.action,
                'duration': al.duration,
                'result_value': al.result_value,
                'timestamp': al.timestamp.isoformat()
            } for al in activity_logs],
            'meditation_sessions': [{
                'session_type': ms.session_type,
                'duration': ms.duration,
                'completed_at': ms.completed_at.isoformat()
            } for ms in meditation_sessions],
            'venting_posts': [{
                'id': vp.id,
                'content': vp.content[:200] + '...' if len(vp.content) > 200 else vp.content,
                'anonymous': vp.anonymous,
                'likes': vp.likes,
                'created_at': vp.created_at.isoformat()
            } for vp in venting_posts],
            'inkblot_results': [{
                'id': ir.id,
                'created_at': ir.created_at.isoformat(),
                'sharing_status': ir.sharing_status
            } for ir in inkblot_results],
            'statistics': {
                'total_assessments': len(assessments),
                'total_crisis_alerts': len(crisis_alerts),
                'critical_alerts': critical_crisis_count,
                'high_alerts': high_crisis_count,
                'total_activities': len(activity_logs),
                'meditation_count': activity_breakdown.get('meditation', 0),
                'chat_count': activity_breakdown.get('chat', 0),
                'venting_count': activity_breakdown.get('venting', 0),
                'assessment_count': activity_breakdown.get('assessment', 0),
                'emotional_state_distribution': emotional_state_counts,
                'intensity_distribution': intensity_counts,
                'activity_breakdown': activity_breakdown
            },
            'consultation_history': [{
                'id': cr.id,
                'urgency': cr.urgency_level,
                'status': cr.status,
                'session_datetime': cr.session_datetime.isoformat() if cr.session_datetime else None,
                'created_at': cr.created_at.isoformat(),
                'session_notes': cr.session_notes,
                'feedback_rating': cr.feedback_rating
            } for cr in ConsultationRequest.query.filter_by(
                user_id=patient_id,
                counsellor_id=current_user.id
            ).order_by(ConsultationRequest.created_at.desc()).all()]
        }, 200

@ns.route('/patient/<int:patient_id>/session-notes')
class SessionNotes(Resource):
    @login_required
    def post(self, patient_id):
        """Add or update session notes for a consultation"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        data = request.json
        consultation_id = data.get('consultation_id')
        notes = data.get('notes')
        
        consultation = ConsultationRequest.query.get_or_404(consultation_id)
        
        if consultation.counsellor_id != current_user.id or consultation.user_id != patient_id:
            return {'message': 'Unauthorized'}, 403
        
        consultation.session_notes = notes
        db.session.commit()
        
        return {'message': 'Notes saved successfully'}, 200
