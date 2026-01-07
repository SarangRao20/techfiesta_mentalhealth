import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print(f"KEY provided: {'Yes' if key else 'No'}")

if not url or not key:
    print("Missing credentials.")
    exit(1)

supabase = create_client(url, key)

BUCKET = 'avatars'
FILENAME = 'debug_test_file.txt'

def test_upload():
    print(f"Attempting to upload to '{BUCKET}'...")
    try:
        # Create dummy file bytes
        data = b"Hello Supabase Debug"
        
        # Attempt upload
        res = supabase.storage.from_(BUCKET).upload(
            path=FILENAME,
            file=data,
            file_options={"content-type": "text/plain", "upsert": "true"}
        )
        print("Upload Successful!")
        print(res)
        
        # Clean up (delete)
        supabase.storage.from_(BUCKET).remove([FILENAME])
        print("Test file cleaned up.")
        
    except Exception as e:
        print("\n--- UPLOAD FAILED ---")
        print(f"Type: {type(e)}")
        print(f"Error: {e}")
        # Try to print more stats if available
        if hasattr(e, 'response'):
             print(f"Response Status: {e.response.status_code}")
             print(f"Response Text: {e.response.text}")
        else:
            # For gotrue/storage-py exceptions, properties might differ
            print(f"Attributes: {dir(e)}")

if __name__ == "__main__":
    test_upload()
