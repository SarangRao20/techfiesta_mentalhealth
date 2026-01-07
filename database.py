from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_caching import Cache
import redis
import os
from dotenv import load_dotenv

load_dotenv()

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Redis Clients
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379')
try:
    r_sessions = redis.from_url(f"{REDIS_URL}/1")
    r_cache = redis.from_url(f"{REDIS_URL}/2")
    r_context = redis.from_url(f"{REDIS_URL}/3")
    r_streaks = redis.from_url(f"{REDIS_URL}/4")
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    r_sessions = r_cache = r_context = r_streaks = None

# Cache Instance
cache = Cache()
