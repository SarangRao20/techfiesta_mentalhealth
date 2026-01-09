from flask_restx import Namespace, Resource
from flask_login import login_required
from database import cache

ns = Namespace('resources', description='Mental health resources')

@ns.route('')
class Resources(Resource):
    @login_required
    @cache.cached(timeout=3600, key_prefix='mental_health_resources')
    def get(self):
        """Get mental health resources"""
        return {
            'categories': [
                {
                    'name': 'Anxiety',
                    'items': [{'title': 'Breathing 101'}, {'title': 'Grounding techniques'}]
                },
                {
                    'name': 'Depression',
                    'items': [{'title': 'Understanding Moods'}, {'title': 'Self-care guide'}]
                }
            ]
        }, 200
