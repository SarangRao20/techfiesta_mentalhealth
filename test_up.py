from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

try:
    print(f"Connecting to {url}...")
    supabase = create_client(url, key)
    print("Uploading...")
    res = supabase.storage.from_('avatars').upload(
        "test.txt", 
        b"chk", 
        {"upsert": "true", "content-type": "text/plain"}
    )
    print("RESULT: SUCCESS")
except Exception as e:
    print(f"RESULT: FAILED - {e}")
