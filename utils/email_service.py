import smtplib
import ssl
import os
import logging
from email.message import EmailMessage
from flask import current_app

def send_email_notification(to_email, subject, body, sender_name="MindCare Team"):
    """
    Sends an email using the SMTP configuration from environment variables.
    """
    try:
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        
        # Use a generic sender or the SMTP user
        from_email = os.environ.get('SMTP_FROM', smtp_user)

        if not (smtp_host and smtp_user and smtp_pass and to_email):
            logging.warning(f"Email skipped: Missing SMTP config. To: {to_email}, Subject: {subject}")
            logging.info(f"MOCK EMAIL BODY: {body}")
            return False

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = f"{sender_name} <{from_email}>"
        msg['To'] = to_email
        msg.set_content(body)

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        logging.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_consultation_request_email(counsellor_email, user_name, time_slot, urgency):
    subject = f"New Consultation Request: {urgency.upper()} Urgency"
    body = f"""
    Hello,

    You have received a new consultation request from {user_name}.
    
    Time Slot: {time_slot}
    Urgency: {urgency}
    
    Please log in to your dashboard to review and accept/reject this request.
    
    Best regards,
    MindCare System
    """
    return send_email_notification(counsellor_email, subject, body, sender_name="MindCare Alerts")

def send_consultation_status_email(user_email, status, counsellor_name, time_slot):
    subject = f"Consultation Request {status.title()}"
    body = f"""
    Hello,

    Your consultation request with {counsellor_name} for {time_slot} has been {status.upper()}.
    
    Please check your dashboard for more details or to reschedule if needed.
    
    Best regards,
    MindCare System
    """
    return send_email_notification(user_email, subject, body)
