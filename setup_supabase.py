import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY")
    exit(1)

supabase = create_client(url, key)

BUCKET_NAME = 'avatars'

def setup_storage():
    print(f"Checking for bucket '{BUCKET_NAME}'...")
    try:
        buckets = supabase.storage.list_buckets()
        existing = [b.name for b in buckets]
        
        if BUCKET_NAME in existing:
            print(f"Bucket '{BUCKET_NAME}' already exists.")
        else:
            print(f"Bucket '{BUCKET_NAME}' not found. Creating...")
            # Create public bucket
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
            print(f"Bucket '{BUCKET_NAME}' created successfully!")
            
    except Exception as e:
        print(f"Error managing storage: {e}")
        # Fallback: Try to create anyway just in case list failed due to RLS but create might work (unlikely but worth a shot if list is restricted)
        try:
             supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
        except:
             pass

if __name__ == "__main__":
    setup_storage()
