from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_caching import Cache
import redis
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Redis Clients
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379')

def get_redis_url_with_db(base_url, db_index):
    if not base_url: return base_url
    # Celery requires CERT_NONE but redis-py requires none. Replace it for redis-py clients.
    base_url = base_url.replace("ssl_cert_reqs=CERT_NONE", "ssl_cert_reqs=none")
    parsed = urllib.parse.urlparse(base_url)
    new_parsed = parsed._replace(path=f'/{db_index}')
    return urllib.parse.urlunparse(new_parsed)

try:
    r_sessions = redis.from_url(get_redis_url_with_db(REDIS_URL, 1))
    r_cache = redis.from_url(get_redis_url_with_db(REDIS_URL, 2))
    r_context = redis.from_url(get_redis_url_with_db(REDIS_URL, 3))
    r_streaks = redis.from_url(get_redis_url_with_db(REDIS_URL, 4))
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    r_sessions = r_cache = r_context = r_streaks = None

# Cache Instance
cache = Cache()
