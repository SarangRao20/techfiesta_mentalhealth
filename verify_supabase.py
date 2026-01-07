import os
from dotenv import load_dotenv
from supabase import create_client

print(f"Current Working Directory: {os.getcwd()}")
loaded = load_dotenv(override=True)
print(f"load_dotenv result: {loaded}")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"SUPABASE_URL: {url}")
if key:
    print(f"SUPABASE_KEY: {key[:5]}...{key[-5:] if len(key)>10 else ''}")
else:
    print("SUPABASE_KEY: None")

if not url or not key:
    print("FAILED: Missing credentials in environment.")
else:
    try:
        supabase = create_client(url, key)
        print("Client initialized successfully.")
        # Try a simple operation
        print("Attempting to list buckets...")
        buckets = supabase.storage.list_buckets()
        print(f"Success! Found {len(buckets)} buckets.")
    except Exception as e:
        print(f"FAILED: Connection error: {e}")
