from celery import Celery
import os

def make_celery(app_name=__name__):
    redis_url = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')
    return Celery(
        app_name,
        broker=redis_url,
        backend=redis_url,
        include=['api.chatbot_api', 'api.assessments_api', 'utils.common', 'api.dashboard_api'] # Add other modules where tasks are defined
    )

celery = make_celery()

# Optional: Configure more celery settings here
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    task_always_eager=False,  # Ensure async execution
    task_ignore_result=True,   # Fire and forget (don't wait for result backend)
    broker_transport_options={'visibility_timeout': 3600}
)
