import os
# from supabase import create_client, Client  # Supabase commented out
from dotenv import load_dotenv

load_dotenv()

supabase: Client = None
## url: str = os.environ.get("SUPABASE_URL")  # Supabase commented out
## key: str = os.environ.get("SUPABASE_KEY")  # Supabase commented out

# supabase: Client = None  # Supabase commented out

## if url and key:
##     try:
##         supabase = create_client(url, key)  # Supabase commented out
##         print("INFO: Supabase client initialized.")  # Supabase commented out
##     except Exception as e:
##         print(f"ERROR: Failed to initialize Supabase client: {e}")  # Supabase commented out
## else:
##     print(f"WARNING: Missing Supabase Config.")  # Supabase commented out
##     print(f" - URL Found: {bool(url)}")  # Supabase commented out
##     print(f" - Key Found: {bool(key)} (Checked SUPABASE_KEY and DATABASE_KEY)")  # Supabase commented out
