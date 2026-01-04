from flask import session, request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required

ns = Namespace('inkblot', description='Inkblot test operations')

@ns.route('/init')
class InitInkblot(Resource):
    @login_required
    def post(self):
        """Initialize inkblot session"""
        session['inkblot_answers'] = {}
        return {'message': 'Session started'}, 200

@ns.route('/submit')
class SubmitResponse(Resource):
    @login_required
    def post(self):
        """Submit inkblot response"""
        data = request.json
        blot_num = data.get('blot_num')
        response = data.get('response')
        answers = session.get('inkblot_answers', {})
        answers[str(blot_num)] = response
        session['inkblot_answers'] = answers
        return {'message': 'Saved'}, 200
