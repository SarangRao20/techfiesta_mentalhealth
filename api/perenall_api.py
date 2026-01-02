from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import MeditationSession, RoutineTask, Assessment

ns = Namespace('perenall', description='Kalpavriksha Plant Companion')

@ns.route('/stats')
class PlantStats(Resource):
    @login_required
    def get(self):
        """Get plant growth points"""
        med_count = MeditationSession.query.filter_by(user_id=current_user.id).count()
        task_count = RoutineTask.query.filter_by(user_id=current_user.id, status='completed').count()
        assess_count = Assessment.query.filter_by(user_id=current_user.id).count()
        
        points = (med_count * 5) + (task_count * 3) + (assess_count * 7)
        return {'growth_points': points, 'level': (points // 50) + 1}, 200
