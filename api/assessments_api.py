from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import Assessment, User
from app import db
from utils import get_assessment_questions, get_assessment_options, calculate_phq9_score, calculate_gad7_score, calculate_ghq_score
from routes import generate_analysis
import json

ns = Namespace('assessments', description='Mental health assessments and results')

submission_model = ns.model('AssessmentSubmission', {
    'assessment_type': fields.String(required=True, description='PHQ-9, GAD-7, or GHQ'),
    'responses': fields.Raw(required=True, description='Dictionary of responses to questions')
})

@ns.route('')
class Assessments(Resource):
    @login_required
    def get(self):
        """List user assessments history"""
        assessments = Assessment.query.filter_by(user_id=current_user.id).order_by(Assessment.completed_at.desc()).all()
        return [
            {
                'id': a.id,
                'type': a.assessment_type,
                'score': a.score,
                'severity': a.severity_level,
                'date': a.completed_at.isoformat()
            } for a in assessments
        ], 200

    @login_required
    @ns.expect(submission_model)
    def post(self):
        """Submit a new assessment"""
        data = ns.payload
        a_type = data.get('assessment_type')
        responses = data.get('responses')
        
        if a_type == 'PHQ-9':
            score, severity = calculate_phq9_score(responses)
        elif a_type == 'GAD-7':
            score, severity = calculate_gad7_score(responses)
        elif a_type == 'GHQ':
            score, severity = calculate_ghq_score(responses)
        else:
            return {'message': 'Invalid assessment type'}, 400
            
        analysis = generate_analysis(a_type, score)
        
        assessment = Assessment(
            user_id=current_user.id,
            assessment_type=a_type,
            score=score,
            severity_level=analysis.get('severity_category', severity),
            recommendations=analysis
        )
        db.session.add(assessment)
        db.session.commit()
        
        return {
            'id': assessment.id,
            'score': score,
            'analysis': analysis
        }, 201

@ns.route('/questions/<string:assessment_type>')
class Questions(Resource):
    @login_required
    def get(self, assessment_type):
        """Get questions and options for a specific assessment type"""
        if assessment_type not in ['PHQ-9', 'GAD-7', 'GHQ']:
            return {'message': 'Invalid assessment type'}, 400
            
        questions = get_assessment_questions(assessment_type)
        options = get_assessment_options(assessment_type)
        
        return {
            'assessment_type': assessment_type,
            'questions': questions,
            'options': options
        }, 200

@ns.route('/<int:assessment_id>')
class AssessmentResult(Resource):
    @login_required
    def get(self, assessment_id):
        """Get detailed results for a specific assessment"""
        assessment = Assessment.query.get_or_404(assessment_id)
        
        if assessment.user_id != current_user.id and current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
            
        analysis = assessment.recommendations if assessment.recommendations else generate_analysis(assessment.assessment_type, assessment.score)
        
        return {
            'id': assessment.id,
            'type': assessment.assessment_type,
            'score': assessment.score,
            'severity': assessment.severity_level,
            'date': assessment.completed_at.isoformat(),
            'analysis': analysis
        }, 200
