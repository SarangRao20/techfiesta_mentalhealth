from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import AvailabilitySlot, ConsultationRequest, User
from app import db
from datetime import datetime

ns = Namespace('consultation', description='Consultation booking and availability')

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
                'start_time': s.start_time.isoformat(),
                'end_time': s.end_time.isoformat()
            } for s in slots
        ], 200

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
            scheduled_at=slot.start_time
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
                'scheduled_at': r.scheduled_at.isoformat() if r.scheduled_at else None,
                'created_at': r.created_at.isoformat()
            } for r in requests
        ], 200
