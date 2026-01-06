import pyttsx3
import threading
import logging
import tempfile
import os
import queue

class VoiceService:
    def __init__(self):
        self.queue = queue.Queue()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
    
    def _run_loop(self):
        """Worker loop running in a separate thread to manage the voice engine."""
        try:
            while True:
                task = self.queue.get()
                if task is None:
                    break
                
                cmd, args, result_holder = task
                try:
                    engine = pyttsx3.init()
                    
                    # Configure voice settings
                    try:
                        voices = engine.getProperty('voices')
                        if voices:
                            for voice in voices:
                                if 'female' in voice.name.lower() or 'woman' in voice.name.lower():
                                    engine.setProperty('voice', voice.id)
                                    break
                    except Exception as e:
                        logging.warning(f"Could not configure voices: {e}")
                    
                    engine.setProperty('rate', 150)
                    engine.setProperty('volume', 0.8)
                    
                    if cmd == 'say':
                        text = args
                        logging.info(f"Worker: saying '{text}'")
                        engine.say(text)
                        engine.runAndWait()
                        logging.info("Worker: finished saying")
                    elif cmd == 'save':
                        text, filename = args
                        logging.info(f"Worker: saving to '{filename}'")
                        engine.save_to_file(text, filename)
                        engine.runAndWait()
                        logging.info("Worker: finished saving")
                        if result_holder:
                            result_holder['data'] = filename
                            result_holder['event'].set()
                            
                    del engine
                except Exception as e:
                    logging.error(f"Voice engine error during {cmd}: {e}")
                    if result_holder:
                        result_holder['error'] = e
                        result_holder['event'].set()
                
                self.queue.task_done()
                
        except Exception as e:
            logging.critical(f"Voice Service failed: {e}")

    def speak_async(self, text):
        """Speak text asynchronously"""
        self.queue.put(('say', text, None))

    def text_to_speech(self, text):
        """Convert text to speech and return the file path"""
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                temp_path = tmp_file.name
                
            event = threading.Event()
            result = {'event': event, 'data': None, 'error': None}
            self.queue.put(('save', (text, temp_path), result))
            
            # Wait for completion
            event.wait(timeout=10) # 10s timeout to prevent infinite hangs
            
            if result['error']:
                logging.error(f"Error in text-to-speech: {result['error']}")
                return None
            
            if not result['event'].is_set():
                logging.error("Timeout waiting for text-to-speech")
                return None
                
            return result['data']
            
        except Exception as e:
            logging.error(f"Error in text-to-speech wrapper: {e}")
            return None
            
    def shutdown(self):
        """Stop the worker thread"""
        self.queue.put(None)
        self.thread.join()

# Global voice service instance
voice_service = VoiceService()

if __name__ == "__main__":
    # Configure logging to see output
    logging.basicConfig(level=logging.INFO)
    
    print("Testing Voice Service...")
    
    # Test 1: Async Speech
    print("Test 1: Speaking 'Hello, I am your mental health assistant.'")
    voice_service.speak_async("Hello, I am your mental health assistant.")
    
    # Wait a bit for async speech to complete
    import time
    time.sleep(3)
    
    # Test 2: File Generation
    print("Test 2: Generating audio file for 'This is a test of the audio file generation.'")
    audio_file = voice_service.text_to_speech("This is a test of the audio file generation.")
    
    if audio_file and os.path.exists(audio_file):
        print(f"Success! Audio file created at: {audio_file}")
        # Clean up
        try:
            os.remove(audio_file)
            print("Audio file cleaned up.")
        except Exception as e:
            print(f"Could not remove file: {e}")
    else:
        print("Failed to create audio file.")
        
    print("Test complete.")
    voice_service.shutdown()
