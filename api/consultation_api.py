
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import AvailabilitySlot, ConsultationRequest, User
from database import db
from datetime import datetime
from utils.email_service import send_consultation_request_email, send_consultation_status_email

ns = Namespace('consultation', description='Consultation booking and availability')

request_model = ns.model('ConsultationRequest', {
    'counsellor_id': fields.Integer(required=True),
    'urgency': fields.String(required=True),
    'contact_preference': fields.String(required=True),
    'preferred_time': fields.String(),
    'notes': fields.String()
})

slot_model = ns.model('AvailabilitySlot', {
    'start_time': fields.String(required=True),
    'end_time': fields.String(required=True)
})

@ns.route('/request')
class CreateRequest(Resource):
    @login_required
    @ns.expect(request_model)
    def post(self):
        """Create a generic consultation request with explicit timing and attachments"""
        data = ns.payload
        try:
            # Handle preferred_time as ISO format if available
            p_time_str = data.get('preferred_time')
            p_time = None
            if p_time_str:
                try:
                    p_time = datetime.fromisoformat(p_time_str.replace('Z', '+00:00'))
                except:
                    p_time = None # Fallback to string in time_slot if not ISO

            # Handle attachments - support both old single attachment and new multiple attachments
            attachments_list = data.get('attachments', [])
            attachment_type = data.get('attachment_type')
            attachment_id = data.get('attachment_id')
            
            # If old single attachment format is used, convert to list
            if attachment_type and attachment_id:
                if not attachments_list:
                    attachments_list = [{'type': attachment_type, 'id': attachment_id}]
            
            req = ConsultationRequest(
                user_id=current_user.id,
                counsellor_id=data.get('counsellor_id'),
                urgency_level=data.get('urgency'),
                contact_preference=data.get('contact_preference'),
                time_slot=p_time_str if not p_time else p_time.strftime('%Y-%m-%d %H:%M'),
                session_datetime=p_time,
                additional_notes=data.get('notes'),
                attachment_type=attachments_list[0]['type'] if attachments_list else None,  # Legacy field
                attachment_id=attachments_list[0]['id'] if attachments_list else None,      # Legacy field
                attachments=attachments_list,  # New field for multiple attachments
                status='pending'
            )
            db.session.add(req)
            
            # Universal Activity Log
            from db_models import UserActivityLog
            log = UserActivityLog(
                user_id=current_user.id,
                activity_type='consultation',
                action='request_submitted',
                extra_data={'urgency': data.get('urgency'), 'attachment': data.get('attachment_type')},
                timestamp=datetime.utcnow()
            )
            db.session.add(log)
            db.session.commit()
            
            # Trigger Email asynchronously with Celery
            try:
                counsellor = User.query.get(data.get('counsellor_id'))
                if counsellor:
                    # Provide explicit formatted time to email
                    time_display = p_time.strftime('%Y-%m-%d %H:%M') if p_time else p_time_str
                    send_consultation_request_email.delay(counsellor.email, current_user.full_name, time_display, data.get('urgency'))
            except Exception as e:
                print(f"Email task queue failed: {e}")

            return {'message': 'Consultation request submitted', 'id': req.id}, 201
        except Exception as e:
            return {'message': str(e)}, 400

@ns.route('/slots')
class OpenSlots(Resource):
    @login_required
    def get(self):
        """Get all available (unbooked) consultation slots"""
        slots = AvailabilitySlot.query.filter_by(is_booked=False).filter(AvailabilitySlot.start_time > datetime.utcnow()).all()
        return [
            {
                'id': s.id,
                'counsellor_id': s.counsellor_id,
                'counsellor_name': User.query.get(s.counsellor_id).full_name,
                'start': s.start_time.isoformat(),
                'end': s.end_time.isoformat()
            } for s in slots
        ], 200

@ns.route('/counsellor/slots')
class CounsellorSlots(Resource):
    @login_required
    def get(self):
        """Get logged-in counsellor's slots"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        slots = AvailabilitySlot.query.filter_by(counsellor_id=current_user.id).filter(AvailabilitySlot.start_time > datetime.utcnow()).all()
        return [
            {
                'id': s.id,
                'start': s.start_time.isoformat(),
                'end': s.end_time.isoformat(),
                'is_booked': s.is_booked
            } for s in slots
        ], 200

    @login_required
    @ns.expect(slot_model)
    def post(self):
        """Add availability slot"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        data = ns.payload
        try:
            slot = AvailabilitySlot(
                counsellor_id=current_user.id,
                start_time=datetime.fromisoformat(data['start_time'].replace('Z', '+00:00')),
                end_time=datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            )
            db.session.add(slot)
            db.session.commit()
            return {'message': 'Slot added'}, 201
        except Exception as e:
            return {'message': str(e)}, 400

@ns.route('/counsellor/slots/<int:slot_id>')
class CounsellorSlotAction(Resource):
    @login_required
    def delete(self, slot_id):
        """Delete a slot"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        slot = AvailabilitySlot.query.get_or_404(slot_id)
        if slot.counsellor_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
        db.session.delete(slot)
        db.session.commit()
        return {'message': 'Slot deleted'}, 200

@ns.route('/slots/<int:slot_id>/book')
class BookSlot(Resource):
    @login_required
    def post(self, slot_id):
        """Book a specific consultation slot"""
        slot = AvailabilitySlot.query.get_or_404(slot_id)
        if slot.is_booked:
            return {'message': 'Slot already booked'}, 400
            
        slot.is_booked = True
        
        request = ConsultationRequest(
            user_id=current_user.id,
            counsellor_id=slot.counsellor_id,
            status='booked',
            session_datetime=slot.start_time,
            created_at=datetime.utcnow()
        )
        db.session.add(request)
        db.session.commit()
        
        return {'message': 'Slot booked successfully', 'request_id': request.id}, 200

@ns.route('/my_requests')
class MyRequests(Resource):
    @login_required
    def get(self):
        """Get current user's consultation requests"""
        requests = ConsultationRequest.query.filter_by(user_id=current_user.id).order_by(ConsultationRequest.created_at.desc()).all()
        return [
            {
                'id': r.id,
                'counsellor_name': User.query.get(r.counsellor_id).full_name if r.counsellor_id else 'TBD',
                'status': r.status,
                'sessionDateTime': r.session_datetime.isoformat() if r.session_datetime else None,
                'createdAt': r.created_at.isoformat(),
                'urgency': r.urgency_level,
                'timeSlot': r.time_slot,
                'contactPreference': r.contact_preference,
                'meetingLink': r.chat_video_link
            } for r in requests
        ], 200

@ns.route('/counsellor/requests')
class CounsellorRequests(Resource):
    @login_required
    def get(self):
        """Get requests assigned to counsellor"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        requests = ConsultationRequest.query.filter_by(counsellor_id=current_user.id).order_by(ConsultationRequest.created_at.desc()).all()
        return [
            {
                'id': r.id,
                'user': {
                    'full_name': r.user.full_name,
                    'username': r.user.username,
                    'email': r.user.email
                },
                'urgency': r.urgency_level,
                'time_slot': r.time_slot,
                'contact_preference': r.contact_preference,
                'status': r.status,
                'notes': r.additional_notes,
                'attachment_type': r.attachment_type,  # Legacy single attachment
                'attachment_id': r.attachment_id,      # Legacy single attachment
                'attachments': r.attachments or [],    # New multiple attachments array
                'created_at': r.created_at.isoformat()
            } for r in requests
        ], 200

@ns.route('/request/<int:request_id>/action')
class RequestAction(Resource):
    @login_required
    def post(self, request_id):
        """Accept or Reject request"""
        if current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        req = ConsultationRequest.query.get_or_404(request_id)
        if req.counsellor_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
            
        action = ns.payload.get('action') # accept, reject
        if action == 'accept':
            req.status = 'booked' # Simplified flow
            email_action_status = 'accepted'
        elif action == 'reject':
            req.status = 'rejected'
            email_action_status = 'rejected'
        else:
            return {'message': 'Invalid action'}, 400
            
        db.session.commit()
        
        # Trigger Email asynchronously with Celery
        if email_action_status:
            try:
                counsellor_name = current_user.full_name
                send_consultation_status_email.delay(req.user.email, email_action_status, counsellor_name, req.time_slot)
            except Exception as e:
                 print(f"Email task queue failed: {e}")

        return {'message': f'Request {action}ed'}, 200

link_model = ns.model('UpdateLink', {
    'link': fields.String(required=True, description='Meeting Link URL')
})

@ns.route('/request/<int:request_id>/link')
class UpdateLink(Resource):
    @login_required
    @ns.doc('update_consultation_link')
    @ns.expect(link_model)
    def put(self, request_id):
        """Update meeting link for consultation"""
        data = ns.payload
        req = ConsultationRequest.query.get_or_404(request_id)
        
        # Verify ownership (Counsellor only)
        if req.counsellor_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
            
        req.chat_video_link = data['link']
        
        # Auto-update status to booked if it has link?
        if req.status == 'accepted':
             req.status = 'booked'

        db.session.commit()
        
        # Notify user (Optional: Email logic here)
        
        return {'message': 'Meeting link updated successfully', 'link': req.chat_video_link}

@ns.route('/counsellors')
class CounsellorList(Resource):
    def get(self):
        """List all counsellors"""
        counsellors = User.query.filter_by(role='counsellor').all()
        return [
            {
                'id': c.id,
                'name': c.full_name
            } for c in counsellors
        ], 200
