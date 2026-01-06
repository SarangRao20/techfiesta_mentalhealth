$env:PYTHONPATH = "."
celery -A utils.celery_app.celery worker --loglevel=info -P solo
