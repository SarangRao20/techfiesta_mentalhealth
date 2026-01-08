from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import Assessment, User
from database import db
from utils import get_assessment_questions, get_assessment_options, calculate_phq9_score, calculate_gad7_score, calculate_ghq_score, generate_analysis
import json
from datetime import datetime
from utils.common import generate_analysis

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
            'assessment_type': a_type,
            'score': score,
            'analysis': analysis
        }, 201

@ns.route('/<int:assessment_id>/pdf')
class AssessmentPDF(Resource):
    @login_required
    def get(self, assessment_id):
        """Get assessment PDF - accessible by counsellors with patient access"""
        from io import BytesIO
        from flask import send_file
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from db_models import ConsultationRequest
        
        assessment = Assessment.query.get_or_404(assessment_id)
        
        # Check access - either owner or counsellor with active consultation
        if assessment.user_id != current_user.id:
            if current_user.role != 'counsellor':
                return {'message': 'Unauthorized'}, 403
            
            # Verify counsellor has access to this patient
            has_access = ConsultationRequest.query.filter_by(
                user_id=assessment.user_id,
                counsellor_id=current_user.id,
                status='booked'
            ).first()
            
            if not has_access:
                return {'message': 'No active consultation with this patient'}, 403
            
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle(f"Assessment Report - {assessment.user.full_name}")
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, f"{assessment.assessment_type} Assessment Report")
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"Patient: {assessment.user.full_name}")
        p.drawString(100, 715, f"Date: {assessment.completed_at.strftime('%Y-%m-%d %H:%M')}")
        p.drawString(100, 700, f"Report For: Mental Health Professional")
        p.line(100, 690, 500, 690)
        
        # Basic scores
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, 665, "Assessment Scores")
        p.setFont("Helvetica", 11)
        p.drawString(120, 645, f"Score: {assessment.score}")
        p.drawString(120, 630, f"Severity: {assessment.severity_level}")
        
        # Get counsellor-detailed analysis
        from utils.common import generate_analysis
        analysis = assessment.recommendations or generate_analysis(assessment.assessment_type, assessment.score)
        detail = analysis.get('counsellor_detailed', {})
        
        y = 605
        
        # Clinical Interpretation
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Clinical Interpretation")
        y -= 20
        p.setFont("Helvetica", 10)
        
        clinical_text = detail.get('clinical_interpretation', 'N/A')
        if len(clinical_text) > 80:
            # Word wrap for long text
            words = clinical_text.split()
            lines = []
            current_line = []
            for word in words:
                current_line.append(word)
                if len(' '.join(current_line)) > 80:
                    lines.append(' '.join(current_line[:-1]))
                    current_line = [current_line[-1]]
            if current_line:
                lines.append(' '.join(current_line))
            
            for line in lines[:3]:  # Limit to 3 lines
                p.drawString(120, y, line)
                y -= 12
        else:
            p.drawString(120, y, clinical_text)
            y -= 15
        
        y -= 10
        
        # Risk Assessment
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Risk Assessment")
        y -= 18
        p.setFont("Helvetica", 10)
        risk = detail.get('risk_assessment', {})
        p.drawString(120, y, f"Suicide Risk: {risk.get('suicide_risk', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Functional Impairment: {risk.get('functional_impairment', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Treatment Urgency: {risk.get('treatment_urgency', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Professional Help: {'Required' if detail.get('professional_help_recommended') else 'Optional'}")
        y -= 20
        
        # Key Clinical Insights
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Key Clinical Insights")
        y -= 18
        p.setFont("Helvetica", 10)
        insights = [i for i in detail.get('key_insights', []) if i]  # Filter None values
        for i, insight in enumerate(insights[:4], 1):  # Limit to 4 insights
            insight_text = str(insight) if insight else 'N/A'
            p.drawString(120, y, f"{i}. {insight_text[:75]}{'...' if len(insight_text) > 75 else ''}")
            y -= 13
        
        y -= 10
        
        # Treatment Recommendations
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Treatment Recommendations")
        y -= 18
        p.setFont("Helvetica", 10)
        treatments = [t for t in detail.get('treatment_recommendations', []) if t]  # Filter None values
        for i, treatment in enumerate(treatments[:4], 1):  # Limit to 4 recommendations
            treatment_text = str(treatment) if treatment else 'N/A'
            p.drawString(120, y, f"{i}. {treatment_text[:75]}{'...' if len(treatment_text) > 75 else ''}")
            y -= 13
        
        y -= 10
        
        # Differential Considerations (if space allows)
        if y > 150:
            p.setFont("Helvetica-Bold", 13)
            p.drawString(100, y, "Differential Considerations")
            y -= 18
            p.setFont("Helvetica", 10)
            differentials = [d for d in detail.get('differential_considerations', []) if d]  # Filter None values
            for i, diff in enumerate(differentials[:3], 1):  # Limit to 3
                if y > 120:
                    diff_text = str(diff) if diff else 'N/A'
                    p.drawString(120, y, f"{i}. {diff_text[:70]}{'...' if len(diff_text) > 70 else ''}")
                    y -= 13
        
        # Footer
        p.setFont("Helvetica-Oblique", 9)
        p.drawString(100, 50, "CONFIDENTIAL - For Mental Health Professional Use Only")
        p.drawString(100, 35, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"Assessment_{assessment_id}_Professional.pdf", mimetype='application/pdf')

@ns.route('/export/<int:assessment_id>')
class ExportAssessmentPDF(Resource):
    @login_required
    def get(self, assessment_id):
        """Export assessment result as PDF with counsellor-detailed analysis (legacy endpoint)"""
        from io import BytesIO
        from flask import send_file
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import Paragraph
        from reportlab.lib.enums import TA_LEFT
        
        assessment = Assessment.query.get_or_404(assessment_id)
        if assessment.user_id != current_user.id and current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle(f"Assessment Report - {assessment.user.full_name}")
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, f"{assessment.assessment_type} Assessment Report")
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"Patient: {assessment.user.full_name}")
        p.drawString(100, 715, f"Date: {assessment.completed_at.strftime('%Y-%m-%d %H:%M')}")
        p.drawString(100, 700, f"Report For: Mental Health Professional")
        p.line(100, 690, 500, 690)
        
        # Basic scores
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, 665, "Assessment Scores")
        p.setFont("Helvetica", 11)
        p.drawString(120, 645, f"Score: {assessment.score}")
        p.drawString(120, 630, f"Severity: {assessment.severity_level}")
        
        # Get counsellor-detailed analysis
        from utils.common import generate_analysis
        analysis = assessment.recommendations or generate_analysis(assessment.assessment_type, assessment.score)
        detail = analysis.get('counsellor_detailed', {})
        
        y = 605
        
        # Clinical Interpretation
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Clinical Interpretation")
        y -= 20
        p.setFont("Helvetica", 10)
        
        clinical_text = detail.get('clinical_interpretation', 'N/A')
        if len(clinical_text) > 80:
            # Word wrap for long text
            words = clinical_text.split()
            lines = []
            current_line = []
            for word in words:
                current_line.append(word)
                if len(' '.join(current_line)) > 80:
                    lines.append(' '.join(current_line[:-1]))
                    current_line = [current_line[-1]]
            if current_line:
                lines.append(' '.join(current_line))
            
            for line in lines[:3]:  # Limit to 3 lines
                p.drawString(120, y, line)
                y -= 12
        else:
            p.drawString(120, y, clinical_text)
            y -= 15
        
        y -= 10
        
        # Risk Assessment
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Risk Assessment")
        y -= 18
        p.setFont("Helvetica", 10)
        risk = detail.get('risk_assessment', {})
        p.drawString(120, y, f"Suicide Risk: {risk.get('suicide_risk', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Functional Impairment: {risk.get('functional_impairment', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Treatment Urgency: {risk.get('treatment_urgency', 'N/A')}")
        y -= 13
        p.drawString(120, y, f"Professional Help: {'Required' if detail.get('professional_help_recommended') else 'Optional'}")
        y -= 20
        
        # Key Clinical Insights
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Key Clinical Insights")
        y -= 18
        p.setFont("Helvetica", 10)
        insights = [i for i in detail.get('key_insights', []) if i]  # Filter None values
        for i, insight in enumerate(insights[:4], 1):  # Limit to 4 insights
            insight_text = str(insight) if insight else 'N/A'
            p.drawString(120, y, f"{i}. {insight_text[:75]}{'...' if len(insight_text) > 75 else ''}")
            y -= 13
        
        y -= 10
        
        # Treatment Recommendations
        p.setFont("Helvetica-Bold", 13)
        p.drawString(100, y, "Treatment Recommendations")
        y -= 18
        p.setFont("Helvetica", 10)
        treatments = [t for t in detail.get('treatment_recommendations', []) if t]  # Filter None values
        for i, treatment in enumerate(treatments[:4], 1):  # Limit to 4 recommendations
            treatment_text = str(treatment) if treatment else 'N/A'
            p.drawString(120, y, f"{i}. {treatment_text[:75]}{'...' if len(treatment_text) > 75 else ''}")
            y -= 13
        
        y -= 10
        
        # Differential Considerations (if space allows)
        if y > 150:
            p.setFont("Helvetica-Bold", 13)
            p.drawString(100, y, "Differential Considerations")
            y -= 18
            p.setFont("Helvetica", 10)
            differentials = [d for d in detail.get('differential_considerations', []) if d]  # Filter None values
            for i, diff in enumerate(differentials[:3], 1):  # Limit to 3
                if y > 120:
                    diff_text = str(diff) if diff else 'N/A'
                    p.drawString(120, y, f"{i}. {diff_text[:70]}{'...' if len(diff_text) > 70 else ''}")
                    y -= 13
        
        # Footer
        p.setFont("Helvetica-Oblique", 9)
        p.drawString(100, 50, "CONFIDENTIAL - For Mental Health Professional Use Only")
        p.drawString(100, 35, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"Assessment_{assessment_id}_Professional.pdf", mimetype='application/pdf')

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
        
        if assessment.user_id != current_user.id and current_user.role not in ['counsellor', 'mentor']:
            return {'message': 'Unauthorized'}, 403
            
        # Get analysis - regenerate if not cached
        from utils.common import generate_analysis
        full_analysis = assessment.recommendations if assessment.recommendations else generate_analysis(assessment.assessment_type, assessment.score)
        
        # Filter analysis based on user role
        if current_user.role == 'counsellor':
            # Counsellors get full detailed clinical analysis
            analysis = full_analysis.get('counsellor_detailed', {})
        elif current_user.role == 'mentor':
            # Mentors get actionable guidance for supporting student
            analysis = full_analysis.get('mentor_view', {})
        else:
            # Students get safe, encouraging view
            analysis = full_analysis.get('user_safe', {})
        
        return {
            'id': assessment.id,
            'type': assessment.assessment_type,
            'score': assessment.score,
            'severity': assessment.severity_level,
            'date': assessment.completed_at.isoformat(),
            'analysis': analysis,
            'viewer_role': current_user.role
        }, 200
