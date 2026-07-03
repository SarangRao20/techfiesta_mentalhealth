"""
Async file upload service using Celery
"""
from utils.celery_app import celery
import os
import logging

@celery.task(bind=True, max_retries=3)
def upload_profile_picture(self, user_id, file_content, filename, content_type):
    """
    Celery task to upload profile picture to Supabase storage.
    Runs in background so user can leave the page.
    """
    try:
        from utils.supabase_client import supabase
        from db_models import User
        from database import db, r_sessions
        
        if not supabase:
            logging.error("Supabase client not initialized")
            return {'success': False, 'error': 'Storage not configured'}
            
        bucket_name = "avatars"
        # Since we receive binary content from Celery, upload it directly
        res = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": content_type}
        )
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        
        # We need app context to interact with DB
        import sys
        import os
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        import app as flask_app
        
        with flask_app.app.app_context():
            user = User.query.get(user_id)
            if user:
                user.profile_picture = public_url
                db.session.commit()
                r_sessions.delete(f"user_profile:{user_id}")
                logging.info(f"Profile picture uploaded for user {user_id}: {public_url}")
                return {'success': True, 'url': public_url}
            else:
                logging.error(f"User {user_id} not found")
                return {'success': False, 'error': 'User not found'}
                
    except Exception as e:
        logging.error(f"Profile picture upload failed: {e}")
        try:
            self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        except self.MaxRetriesExceededError:
            logging.error(f"Max retries exceeded for profile upload")
        return {'success': False, 'error': str(e)}
