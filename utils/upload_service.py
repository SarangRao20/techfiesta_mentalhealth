"""
Async file upload service using Celery
"""
from utils.celery_app import celery
import os
import logging

@celery.task(bind=True, max_retries=3)
def upload_profile_picture(self, user_id, file_content, filename, content_type):
    """
    # Celery task to upload profile picture to Supabase storage.  # Supabase commented out
    Runs in background so user can leave the page.
    """
    try:
        # --- Supabase upload logic commented out below ---
        # from utils.supabase_client import supabase
        # from db_models import User
        # from database import db, r_sessions
        # if not supabase:
        #     logging.error("Supabase client not initialized")
        #     return {'success': False, 'error': 'Storage not configured'}
        # bucket_name = "avatars"
        # res = supabase.storage.from_(bucket_name).upload(
        #     path=filename,
        #     file=file_content,
        #     file_options={"content-type": content_type}
        # )
        # public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        # user = User.query.get(user_id)
        # if user:
        #     user.profile_picture = public_url
        #     db.session.commit()
        #     r_sessions.delete(f"user_profile:{user_id}")
        #     logging.info(f"Profile picture uploaded for user {user_id}: {public_url}")
        #     return {'success': True, 'url': public_url}
        # else:
        #     logging.error(f"User {user_id} not found")
        #     return {'success': False, 'error': 'User not found'}
        # except Exception as e:
        #     logging.error(f"Profile picture upload failed: {e}")
        #     try:
        #         self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        #     except self.MaxRetriesExceededError:
        #         logging.error(f"Max retries exceeded for profile upload")
        #     return {'success': False, 'error': str(e)}

        # --- New local file upload logic ---
        from db_models import User
        from database import db, r_sessions
        upload_dir = os.path.join(os.getcwd(), 'static', 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(file_content)
        rel_path = f'static/uploads/{filename}'
        user = User.query.get(user_id)
        if user:
            user.profile_picture = rel_path
            db.session.commit()
            r_sessions.delete(f"user_profile:{user_id}")
            logging.info(f"Profile picture uploaded for user {user_id}: {rel_path}")
            return {'success': True, 'url': rel_path}
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
    
    # --- Supabase upload logic commented out below ---
    # try:
    #     from utils.supabase_client import supabase
    #     from db_models import User
    #     from database import db, r_sessions
    #     if not supabase:
    #         logging.error("Supabase client not initialized")
    #         return {'success': False, 'error': 'Storage not configured'}
    #     bucket_name = "avatars"
    #     res = supabase.storage.from_(bucket_name).upload(
    #         path=filename,
    #         file=file_content,
    #         file_options={"content-type": content_type}
    #     )
    #     public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
    #     user = User.query.get(user_id)
    #     if user:
    #         user.profile_picture = public_url
    #         db.session.commit()
    #         r_sessions.delete(f"user_profile:{user_id}")
    #         logging.info(f"Profile picture uploaded for user {user_id}: {public_url}")
    #         return {'success': True, 'url': public_url}
    #     else:
    #         logging.error(f"User {user_id} not found")
    #         return {'success': False, 'error': 'User not found'}
    # except Exception as e:
    #     logging.error(f"Profile picture upload failed: {e}")
    #     try:
    #         self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    #     except self.MaxRetriesExceededError:
    #         logging.error(f"Max retries exceeded for profile upload")
    #     return {'success': False, 'error': str(e)}

    # --- New local file upload logic ---
    try:
        from db_models import User
        from database import db, r_sessions
        upload_dir = os.path.join(os.getcwd(), 'static', 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(file_content)
        rel_path = f'static/uploads/{filename}'
        user = User.query.get(user_id)
        if user:
            user.profile_picture = rel_path
            db.session.commit()
            r_sessions.delete(f"user_profile:{user_id}")
            logging.info(f"Profile picture uploaded for user {user_id}: {rel_path}")
            return {'success': True, 'url': rel_path}
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
