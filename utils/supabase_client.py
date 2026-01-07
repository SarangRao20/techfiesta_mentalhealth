import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Try standard name, then user's custom name
url: str = os.environ.get("SUPABASE_URL")
# User specific: check DATABASE_KEY if SUPABASE_KEY is missing
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = None

if url and key:
    try:
        supabase = create_client(url, key)
        print("INFO: Supabase client initialized.")
    except Exception as e:
        print(f"ERROR: Failed to initialize Supabase client: {e}")
else:
    print(f"WARNING: Missing Supabase Config.")
    print(f" - URL Found: {bool(url)}")
    print(f" - Key Found: {bool(key)} (Checked SUPABASE_KEY and DATABASE_KEY)")
