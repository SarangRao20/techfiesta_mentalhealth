import os
import logging
from flask import Flask, request, session
from markupsafe import Markup
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_babel import Babel, gettext, ngettext, lazy_gettext, get_locale
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
from flask_restx import Api
from flask_cors import CORS
## Removed inkblot import; will define inkblot routes in routes.py
from database import db
from flask_migrate import Migrate

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

CORS(app, supports_credentials=True)

api = Api(app, 
          title='Mental Health Support API',
          version='1.0',
          description='RESTful API for Mental Health Support Platform',
          doc='/docs',
          prefix='/api'
)

# Babel Configuration
app.config['LANGUAGES'] = {
    'en': 'English',
    'hi': 'हिंदी'
}
app.config['BABEL_DEFAULT_LOCALE'] = 'hi'
app.config['BABEL_DEFAULT_TIMEZONE'] = 'UTC'

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///mental_health.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_pre_ping': True,
    "pool_recycle": 300,
}

db.init_app(app)

# Initialize Babel
babel = Babel()

def get_locale():
    # 1. If user explicitly set a language
    if request.args.get('language'):
        session['language'] = request.args.get('language')
    
    # 2. Use session language if set
    if 'language' in session and session['language'] in app.config['LANGUAGES'].keys():
        return session['language']
    
    # 3. Fall back to browser's preferred language
    return request.accept_languages.best_match(app.config['LANGUAGES'].keys()) or app.config['BABEL_DEFAULT_LOCALE']

babel.init_app(app, locale_selector=get_locale)

migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

with app.app_context():
    import models  # noqa: F401
    db.create_all()  # Ensure all tables are created, including routine_tasks
    logging.info("Database tables created")

def nl2br(value):
    if value is None:
        return ''
    if not isinstance(value, str):
        value = str(value)
    return Markup(value.replace('\n', '<br>'))

app.jinja_env.filters['nl2br'] = nl2br

# Add get_locale to template context
app.jinja_env.globals['get_locale'] = get_locale

## Import routes to register them
import routes

# Register API namespaces
from api.auth_api import ns as auth_ns
from api.dashboard_api import ns as dashboard_ns
from api.chatbot_api import ns as chatbot_ns
from api.assessments_api import ns as assessments_ns
from api.venting_api import ns as venting_ns
from api.consultation_api import ns as consultation_ns
from api.routine_api import ns as routine_ns
from api.meditation_api import ns as meditation_ns
from api.voice_api import ns as voice_ns
from api.resources_api import ns as resources_ns
from api.inkblot_api import ns as inkblot_ns
from api.perenall_api import ns as perenall_ns
from api.analytics_api import ns as analytics_ns

api.add_namespace(auth_ns, path='/auth')
api.add_namespace(dashboard_ns, path='/dashboard')
api.add_namespace(chatbot_ns, path='/chatbot')
api.add_namespace(assessments_ns, path='/assessments')
api.add_namespace(venting_ns, path='/venting')
api.add_namespace(consultation_ns, path='/consultation')
api.add_namespace(routine_ns, path='/routine')
api.add_namespace(meditation_ns, path='/meditation')
api.add_namespace(voice_ns, path='/voice')
api.add_namespace(resources_ns, path='/resources')
api.add_namespace(inkblot_ns, path='/inkblot')
api.add_namespace(perenall_ns, path='/perenall')
api.add_namespace(analytics_ns, path='/analytics')

## Removed inkblot_bp blueprint registration; now using direct route in routes.py

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
