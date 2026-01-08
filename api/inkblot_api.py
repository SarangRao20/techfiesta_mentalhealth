from flask import session, request, send_file
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import InkblotResult, UserActivityLog
from database import db
import json
import os
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

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
        """Submit inkblot response (partial/temporary)"""
        data = request.json
        blot_num = data.get('blot_num')
        response = data.get('response')
        elaboration = data.get('elaboration', '')
        
        answers = session.get('inkblot_answers', {})
        elaborations = session.get('inkblot_elaborations', {})
        
        answers[str(blot_num)] = response
        elaborations[str(blot_num)] = elaboration
        
        session['inkblot_answers'] = answers
        session['inkblot_elaborations'] = elaborations
        return {'message': 'Saved partially'}, 200

@ns.route('/complete')
class CompleteInkblot(Resource):
    @login_required
    def post(self):
        """Complete test and persist to database"""
        answers = session.get('inkblot_answers', {})
        elaborations = session.get('inkblot_elaborations', {})
        
        if not answers:
            return {'message': 'No answers found to save'}, 400
            
        result = InkblotResult(
            user_id=current_user.id,
            responses=answers,
            story_elaborations=elaborations,
            created_at=datetime.utcnow()
        )
        db.session.add(result)
        
        # Universal Activity Log
        log = UserActivityLog(
            user_id=current_user.id,
            activity_type='inkblot',
            action='complete',
            extra_data={'blots_completed': len(answers)},
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        
        # Clear session
        session.pop('inkblot_answers', None)
        session.pop('inkblot_elaborations', None)
        
        return {
            'message': 'Inkblot test completed and saved',
            'result_id': result.id
        }, 201

@ns.route('/finish')
class FinishInkblot(Resource):
    @login_required
    def post(self):
        """Alias for /complete endpoint"""
        return CompleteInkblot().post()

@ns.route('/results')
class AllResults(Resource):
    @login_required
    def get(self):
        """Get history of inkblot results"""
        results = InkblotResult.query.filter_by(user_id=current_user.id).order_by(InkblotResult.created_at.desc()).all()
        return [
            {
                'id': r.id,
                'date': r.created_at.isoformat(),
                'blot_count': len(r.responses)
            } for r in results
        ], 200

@ns.route('/<int:result_id>/details')
class InkblotDetails(Resource):
    @login_required
    def get(self, result_id):
        """Get inkblot details - accessible by counsellors with patient access"""
        from db_models import ConsultationRequest
        
        result = InkblotResult.query.get_or_404(result_id)
        
        # Check access - either owner or counsellor with active consultation
        if result.user_id != current_user.id:
            if current_user.role != 'counsellor':
                return {'message': 'Unauthorized'}, 403
            
            # Verify counsellor has access to this patient
            has_access = ConsultationRequest.query.filter_by(
                user_id=result.user_id,
                counsellor_id=current_user.id,
                status='booked'
            ).first()
            
            if not has_access:
                return {'message': 'No active consultation with this patient'}, 403
        
        return {
            'id': result.id,
            'user_id': result.user_id,
            'user_name': result.user.full_name,
            'responses': result.responses,
            'story_elaborations': result.story_elaborations,
            'created_at': result.created_at.isoformat(),
            'pdf_available': result.pdf_path is not None
        }, 200

@ns.route('/<int:result_id>/pdf')
class InkblotPDF(Resource):
    @login_required
    def get(self, result_id):
        """Get inkblot PDF - accessible by counsellors with patient access"""
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
        from db_models import ConsultationRequest
        
        result = InkblotResult.query.get_or_404(result_id)
        
        # Check access - either owner or counsellor with active consultation
        if result.user_id != current_user.id:
            if current_user.role != 'counsellor':
                return {'message': 'Unauthorized'}, 403
            
            # Verify counsellor has access to this patient
            has_access = ConsultationRequest.query.filter_by(
                user_id=result.user_id,
                counsellor_id=current_user.id,
                status='booked'
            ).first()
            
            if not has_access:
                return {'message': 'No active consultation with this patient'}, 403
            
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        # Define Custom Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.indigo,
            spaceAfter=30,
            alignment=1 # Center
        )
        
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.teal,
            spaceBefore=12,
            spaceAfter=6
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            spaceAfter=12
        )
        
        elaboration_style = ParagraphStyle(
            'ElabStyle',
            parent=styles['Italic'],
            fontSize=10,
            textColor=colors.darkslategrey,
            leftIndent=20,
            leading=12
        )

        elements = []
        
        # Header
        elements.append(Paragraph("Projective Inkblot Assessment Report", title_style))
        elements.append(Spacer(1, 12))
        
        # User Info Table
        info_data = [
            ["Student Name:", result.user.full_name, "Date Completed:", result.created_at.strftime('%Y-%m-%d %H:%M')],
            ["Assessment ID:", f"INK-{result.id}", "Plates Analyzed:", str(len(result.responses))]
        ]
        info_table = Table(info_data, colWidths=[100, 150, 100, 150])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
            ('TEXTCOLOR', (2,0), (2,-1), colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,0), 0.5, colors.lightgrey),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 30))
        
        # Determine Image path
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        img_base_path = os.path.join(base_dir, 'src', 'public', 'assets', 'inkblots')

        # Results Sections
        for blot_num_str, resp in result.responses.items():
            elements.append(Paragraph(f"Plate Analysis: #{blot_num_str}", header_style))
            
            # Add images if found
            img_path = os.path.join(img_base_path, f"blot{blot_num_str}.jpg")
            if os.path.exists(img_path):
                try:
                    img = Image(img_path, width=200, height=150)
                    img.hAlign = 'LEFT'
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("[Image preview unavailable]", body_style))
            
            elements.append(Spacer(1, 6))
            elements.append(Paragraph(f"<b>Perception:</b> {resp}", body_style))
            
            elab = result.story_elaborations.get(blot_num_str) if result.story_elaborations else None
            if elab:
                elements.append(Paragraph("<b>Narrative Elaboration:</b>", body_style))
                elements.append(Paragraph(elab, elaboration_style))
            
            elements.append(Spacer(1, 20))
            
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Inkblot_Analysis_{result.user.full_name.replace(' ', '_')}.pdf",
            mimetype='application/pdf'
        )

@ns.route('/export/<int:result_id>')
class ExportPDF(Resource):
    @login_required
    def get(self, result_id):
        """Export inkblot result as professional PDF with images (legacy endpoint)"""
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
        
        result = InkblotResult.query.get_or_404(result_id)
        if result.user_id != current_user.id and current_user.role != 'counsellor':
            return {'message': 'Unauthorized'}, 403
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        # Define Custom Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.indigo,
            spaceAfter=30,
            alignment=1 # Center
        )
        
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.teal,
            spaceBefore=12,
            spaceAfter=6
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            spaceAfter=12
        )
        
        elaboration_style = ParagraphStyle(
            'ElabStyle',
            parent=styles['Italic'],
            fontSize=10,
            textColor=colors.darkslategrey,
            leftIndent=20,
            leading=12
        )

        elements = []
        
        # Header
        elements.append(Paragraph("Projective Inkblot Assessment Report", title_style))
        elements.append(Spacer(1, 12))
        
        # User Info Table
        info_data = [
            ["Student Name:", result.user.full_name, "Date Completed:", result.created_at.strftime('%Y-%m-%d %H:%M')],
            ["Assessment ID:", f"INK-{result.id}", "Plates Analyzed:", str(len(result.responses))]
        ]
        info_table = Table(info_data, colWidths=[100, 150, 100, 150])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
            ('TEXTCOLOR', (2,0), (2,-1), colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,0), 0.5, colors.lightgrey),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 30))
        
        # Determine Image path
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        img_base_path = os.path.join(base_dir, 'src', 'public', 'assets', 'inkblots')

        # Results Sections
        for blot_num_str, resp in result.responses.items():
            elements.append(Paragraph(f"Plate Analysis: #{blot_num_str}", header_style))
            
            # Add images if found
            img_path = os.path.join(img_base_path, f"blot{blot_num_str}.jpg")
            if os.path.exists(img_path):
                try:
                    img = Image(img_path, width=200, height=150)
                    img.hAlign = 'LEFT'
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("[Image preview unavailable]", body_style))
            
            elements.append(Spacer(1, 6))
            elements.append(Paragraph(f"<b>Perception:</b> {resp}", body_style))
            
            elab = result.story_elaborations.get(blot_num_str) if result.story_elaborations else None
            if elab:
                elements.append(Paragraph("<b>Narrative Elaboration:</b>", body_style))
                elements.append(Paragraph(elab, elaboration_style))
            
            elements.append(Spacer(1, 20))
            
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Inkblot_Analysis_{result.user.full_name.replace(' ', '_')}.pdf",
            mimetype='application/pdf'
        )
