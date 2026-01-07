from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import RoutineTask
from database import db
from datetime import datetime

ns = Namespace('routine', description='Daily routine and task management')

task_model = ns.model('RoutineTask', {
    'id': fields.Integer(description='Task ID'),
    'title': fields.String(required=True, description='Task title'),
    'status': fields.String(description='Task status (pending, completed)'),
    'category': fields.String(description='Task category'),
    'duration_minutes': fields.Integer(description='Duration in minutes')
})

@ns.route('')
class Routine(Resource):
    @login_required
    def get(self):
        """Get today's routine tasks"""
        today = datetime.utcnow().date()
        tasks = RoutineTask.query.filter_by(user_id=current_user.id, created_date=today).all()
        return [t.as_dict() for t in tasks], 200

    @login_required
    @ns.expect(task_model)
    def post(self):
        """Add a new task to today's routine"""
        data = ns.payload
        # Default start/end if missing
        start_time = data.get('start_time', '09:00')
        end_time = data.get('end_time', '10:00')
        
        task = RoutineTask(
            user_id=current_user.id,
            title=data.get('title'),
            status='pending',
            start_time=start_time,
            end_time=end_time,
            notes=data.get('notes', ''),
            created_date=datetime.utcnow().date()
        )
        db.session.add(task)
        db.session.commit()
        
        # Invalidate Dashboard Cache
        from api.dashboard_api import invalidate_dashboard_cache
        invalidate_dashboard_cache(current_user.id)
        
        return task.as_dict(), 201

@ns.route('/<int:task_id>/toggle')
class ToggleTask(Resource):
    @login_required
    def post(self, task_id):
        """Toggle task status between pending and completed"""
        task = RoutineTask.query.get_or_404(task_id)
        if task.user_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
            
        task.status = 'completed' if task.status == 'pending' else 'pending'
        db.session.commit()
        
        # Invalidate Dashboard Cache
        from api.dashboard_api import invalidate_dashboard_cache
        invalidate_dashboard_cache(current_user.id)
        
        return {'id': task.id, 'status': task.status}, 200

@ns.route('/<int:task_id>')
class DeleteTask(Resource):
    @login_required
    def delete(self, task_id):
        """Delete a routine task"""
        task = RoutineTask.query.get_or_404(task_id)
        if task.user_id != current_user.id:
            return {'message': 'Unauthorized'}, 403
            
        db.session.delete(task)
        db.session.commit()
        
        # Invalidate Dashboard Cache
        from api.dashboard_api import invalidate_dashboard_cache
        invalidate_dashboard_cache(current_user.id)
        
        return {'message': 'Task deleted successfully'}, 200
