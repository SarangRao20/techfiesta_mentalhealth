import os
import logging
from datetime import timedelta
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
from database import db, r_sessions, r_streaks, cache
from flask_migrate import Migrate
import redis
from flask_session import Session
from flask_caching import Cache
import json

# app.py mein ye add karo
from ollama import Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Suppress verbose comtypes DEBUG logs (Windows Speech API)
logging.getLogger('comtypes').setLevel(logging.WARNING)
logging.getLogger('comtypes.client').setLevel(logging.WARNING)
logging.getLogger('comtypes._post_coinit').setLevel(logging.WARNING)
logging.getLogger('comtypes._comobject').setLevel(logging.WARNING)

class Base(DeclarativeBase):
    pass

app = Flask(__name__, template_folder='old_tries/templates', static_folder='old_tries/static')
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Global Ollama client
ollama_client = Client(host='http://localhost:11434')
app.config['OLLAMA_CLIENT'] = ollama_client
app.config['INTENT_MODEL'] = 'intent_classifier:latest'
app.config['CONVO_MODEL'] = 'convo_LLM:latest'


# Selective origins to allow credentials (wildcard '*' won't work with supports_credentials=True)
allowed_origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000",
    "http://localhost:3000"
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

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

# Session Configuration for Localhost/Dev
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['REMEMBER_COOKIE_SAMESITE'] = 'Lax'
app.config['REMEMBER_COOKIE_SECURE'] = False

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///mental_health.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_pre_ping': True,
    "pool_recycle": 300,
}

# Redis Clients
# Redis Clients (Imported from database.py)
app.config['REDIS_URL'] = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379')

# Server-Side Sessions with Redis
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_REDIS'] = r_sessions
app.config['SESSION_KEY_PREFIX'] = 'mh_session:'
app.config['SESSION_COOKIE_NAME'] = 'mh_auth_session'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
Session(app)

# API Caching with Redis
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_URL'] = f"{app.config['REDIS_URL']}/2"
app.config['CACHE_DEFAULT_TIMEOUT'] = 300
cache.init_app(app)

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

@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith('/api/') or request.is_json:
        return {'message': 'Unauthorized', 'code': 'unauthorized'}, 401
    from flask import redirect, url_for
    return redirect(url_for('routes.login'))

@login_manager.user_loader
def load_user(user_id):
    user_key = f"user_profile:{user_id}"
    cached_user = r_sessions.get(user_key)
    from db_models import User
    
    if cached_user:
        try:
            user_data = json.loads(cached_user)
            if 'organization_id' not in user_data or 'email' not in user_data:
                print(f"DEBUG: Stale cache for user {user_id} (missing fields). Reloading from DB.")
                raise Exception("Stale cache")

            # Create User object from cached data
            user = User()
            user.id = user_data['id']
            user.username = user_data['username']
            user.role = user_data['role']
            user.full_name = user_data.get('full_name', '')
            user.email = user_data.get('email', '')
            user.organization_id = user_data.get('organization_id')
            user.profile_picture = user_data.get('profile_picture')
            user.student_id = user_data.get('student_id')
            user.accommodation_type = user_data.get('accommodation_type')
            user.bio = user_data.get('bio')
            user.is_onboarded = user_data.get('is_onboarded', False)
            
            print(f"DEBUG: Loaded user {user.username} from Redis. Org ID: {user.organization_id}")
            return user
        except Exception as e:
            print(f"DEBUG: Cache miss/error for user {user_id}: {e}")
            pass
        
    user = User.query.get(int(user_id))
    if user:
        r_sessions.setex(user_key, 600, json.dumps({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'full_name': user.full_name,
            'email': user.email,
            'organization_id': user.organization_id,
            'profile_picture': user.profile_picture,
            'student_id': user.student_id,
            'accommodation_type': user.accommodation_type,
            'bio': user.bio,
            'is_onboarded': user.is_onboarded
        }))
    return user

with app.app_context():
    import db_models
    db.create_all()
    logging.info("Database tables created")

def nl2br(value):
    if value is None:
        return ''
    if not isinstance(value, str):
        value = str(value)
    return Markup(value.replace('\n', '<br>'))

app.jinja_env.filters['nl2br'] = nl2br

app.jinja_env.globals['get_locale'] = get_locale

import routes

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
from api.activity_api import ns as activity_ns
from api.mentor_api import ns as mentor_ns
from api.counsellor_api import ns as counsellor_ns

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
api.add_namespace(activity_ns, path='/activity')
api.add_namespace(mentor_ns, path='/mentor')
api.add_namespace(counsellor_ns, path='/counsellor')

# Initialize SocketIO
from api.chat_socket import socketio
socketio.init_app(app)

# SocketIO initialization is done above: socketio.init_app(app)
