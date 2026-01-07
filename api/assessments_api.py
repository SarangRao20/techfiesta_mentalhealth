from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import Assessment, User
from database import db
from utils import get_assessment_questions, get_assessment_options, calculate_phq9_score, calculate_gad7_score, calculate_ghq_score, generate_analysis
import json
from datetime import datetime

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
            severity_level=analysis.get('counsellor_detailed', {}).get('severity_category', severity),
            recommendations=analysis,
            responses=responses
        )
        db.session.add(assessment)
        
        # Universal Activity Log
        from db_models import UserActivityLog
        log = UserActivityLog(
            user_id=current_user.id,
            activity_type='assessment',
            action='complete',
            result_value=float(score),
            extra_data={'type': a_type, 'severity': assessment.severity_level},
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        
        # Invalidate Dashboard Cache
        from api.dashboard_api import invalidate_dashboard_cache
        invalidate_dashboard_cache(current_user.id)
        
        return {
            'id': assessment.id,
            'score': score,
            'analysis': analysis
        }, 201

@ns.route('/export/<int:assessment_id>')
class ExportAssessmentPDF(Resource):
    @login_required
    def get(self, assessment_id):
        """Export assessment result as PDF"""
        from io import BytesIO
        from flask import send_file
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        assessment = Assessment.query.get_or_404(assessment_id)
        if assessment.user_id != current_user.id and current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
            
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle(f"Assessment Report - {assessment.user.full_name}")
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, f"{assessment.assessment_type} Assessment Report")
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"User: {assessment.user.full_name}")
        p.drawString(100, 715, f"Date: {assessment.completed_at.strftime('%Y-%m-%d %H:%M')}")
        p.line(100, 705, 500, 705)
        
        p.drawString(100, 680, f"Score: {assessment.score}")
        p.drawString(100, 665, f"Severity: {assessment.severity_level}")
        
        analysis = assessment.recommendations or generate_analysis(assessment.assessment_type, assessment.score)
        detail = analysis.get('counsellor_detailed', {})
        
        y = 640
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "Clinical Summary:")
        p.setFont("Helvetica", 11)
        y -= 20
        p.drawString(120, y, f"Urgency Level: {detail.get('urgency_level', 'N/A')}")
        y -= 15
        p.drawString(120, y, f"Professional Help Recommended: {'Yes' if detail.get('professional_help_recommended') else 'No'}")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"Assessment_{assessment_id}.pdf", mimetype='application/pdf')

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
