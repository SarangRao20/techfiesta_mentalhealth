"""
Enhanced Voice Service using Sarvam AI for STT and TTS
Integrates with existing MindCare chatbot frontend
"""

import os
import base64
import tempfile
import re
from sarvamai import SarvamAI
from gemini_service import chat_with_ai
from flask import current_app
import logging

class SarvamVoiceService:
    def __init__(self):
        self.api_key = os.getenv('SARVAM_API_KEY')
        self.client = None
        self.setup_client()
        
    def setup_client(self):
        """Initialize Sarvam AI client"""
        try:
            if not self.api_key:
                raise ValueError("SARVAM_API_KEY not found in environment variables")
            self.client = SarvamAI(api_subscription_key=self.api_key)
            # Use print for initialization logging (outside Flask context)
            print("✅ Sarvam AI client initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Sarvam AI client: {e}")
            raise
    
    def detect_language_and_context(self, text):
        """Detect if text is Hindi/Hinglish context"""
        # Check for Devanagari characters
        devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        total_chars = sum(1 for c in text if c.isalpha())
        has_devanagari = (devanagari_count / total_chars) > 0.3 if total_chars > 0 else False
        
        # Check for Hindi keywords in Roman script
        hindi_keywords = [
            'kaise', 'kaisa', 'kya', 'hai', 'hoon', 'ho', 'acha', 'theek', 
            'yaar', 'dost', 'bhai', 'main', 'mera', 'tera', 'tum', 'aap',
            'namaskar', 'namaste', 'kya baat', 'sab kuch', 'koi baat nahi'
        ]
        text_lower = text.lower()
        has_hindi_context = any(keyword in text_lower for keyword in hindi_keywords)
        
        return {
            'has_devanagari': has_devanagari,
            'has_hindi_context': has_hindi_context,
            'is_hinglish': has_devanagari or has_hindi_context,
            'language_code': 'hi-IN' if (has_devanagari or has_hindi_context) else 'en-IN'
        }
    
    def transcribe_audio(self, audio_file_path):
        """Convert speech to text using Sarvam AI STT"""
        try:
            with open(audio_file_path, "rb") as audio_file:
                response = self.client.speech_to_text.transcribe(
                    file=audio_file,
                    model="saarika:v2.5",
                    language_code="hi-IN"  # Supports both Hindi and English
                )
                
            # Extract transcript from response
            if hasattr(response, "transcript"):
                if isinstance(response.transcript, list) and len(response.transcript) > 0:
                    transcript = getattr(response.transcript[0], "text", str(response.transcript[0]))
                elif isinstance(response.transcript, str):
                    transcript = response.transcript
                else:
                    transcript = str(response.transcript)
            elif isinstance(response, str):
                transcript = response
            else:
                transcript = ""
                
            try:
                current_app.logger.info(f"🎤 STT Success: '{transcript}'")
            except RuntimeError:
                print(f"🎤 STT Success: '{transcript}'")
            return transcript.strip()
            
        except Exception as e:
            try:
                current_app.logger.error(f"❌ STT Error: {e}")
            except RuntimeError:
                print(f"❌ STT Error: {e}")
            return ""
    
    def enhance_chat_response_for_voice(self, user_message, original_response):
        """Enhance chatbot response for better voice synthesis"""
        language_info = self.detect_language_and_context(user_message)
        
        if language_info['is_hinglish']:
            # For Hindi/Hinglish, generate response in Devanagari for better TTS
            enhanced_prompt = f"""
            You are 'Buddy', a compassionate mental health chatbot. The user said: "{user_message}"
            
            Original response: "{original_response}"
            
            Convert this response to natural Hindi Devanagari script for voice synthesis while keeping the same meaning and emotional tone.
            Write Hindi words in proper Devanagari script. You can mix some English words naturally.
            Keep it concise and conversational.
            
            Examples:
            - "How are you?" → "आप कैसे हैं?"
            - "I understand" → "मैं समझ गया"
            - "That's good" → "यह अच्छा है"
            """
            
            try:
                # Use existing Gemini service to enhance response
                enhanced_response = chat_with_ai(enhanced_prompt, conversation_history=[])
                return enhanced_response.strip()
            except Exception as e:
                try:
                    current_app.logger.warning(f"Response enhancement failed: {e}")
                except RuntimeError:
                    print(f"Response enhancement failed: {e}")
                return original_response
        
        return original_response
    
    def text_to_speech(self, text, language_code=None):
        """Convert text to speech using Sarvam AI TTS"""
        try:
            # Auto-detect language if not provided
            if not language_code:
                lang_info = self.detect_language_and_context(text)
                language_code = lang_info['language_code']
            
            # Clean text for TTS
            clean_text = self.clean_text_for_tts(text)
            
            try:
                current_app.logger.info(f"🔊 TTS Request: '{clean_text}' (lang: {language_code})")
            except RuntimeError:
                print(f"🔊 TTS Request: '{clean_text}' (lang: {language_code})")
            
            # Call Sarvam TTS API
            response = self.client.text_to_speech.convert(
                text=clean_text,
                target_language_code=language_code,
                model="bulbul:v2"
            )
            
            # Decode audio data
            audio_data = base64.b64decode(response.audios[0])
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                audio_path = temp_file.name
            
            try:
                current_app.logger.info(f"✅ TTS Success: Audio saved to {audio_path}")
            except RuntimeError:
                print(f"✅ TTS Success: Audio saved to {audio_path}")
            return audio_path
            
        except Exception as e:
            try:
                current_app.logger.error(f"❌ TTS Error: {e}")
            except RuntimeError:
                print(f"❌ TTS Error: {e}")
            return None
    
    def clean_text_for_tts(self, text):
        """Clean text for better TTS synthesis"""
        # Remove markdown formatting
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        text = re.sub(r'#+\s*', '', text)
        text = re.sub(r'`(.*?)`', r'\1', text)
        text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
        text = re.sub(r'_{2,}', '', text)
        text = re.sub(r'-{2,}', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Limit length for better performance
        if len(text) > 300:
            text = text[:300] + "..."
        
        return text.strip()
    
    def translate_to_devanagari(self, hinglish_text):
        """Translate Hinglish text to pure Devanagari for better TTS"""
        try:
            prompt = f"""
            Convert this Hinglish text to proper Hindi Devanagari script for text-to-speech synthesis:
            
            Input: "{hinglish_text}"
            
            Rules:
            - Convert ALL Hindi words to Devanagari script
            - Keep English technical terms in English
            - Maintain the same meaning and tone
            - Make it natural for speech synthesis
            
            Examples:
            - "Hi, kaise ho?" → "नमस्ते, कैसे हो?"
            - "Main theek hoon" → "मैं ठीक हूँ"
            - "Thank you yaar" → "धन्यवाद यार"
            
            Output only the converted text:
            """
            
            translated = chat_with_ai(prompt, conversation_history=[])
            return translated.strip()
            
        except Exception as e:
            try:
                current_app.logger.warning(f"Translation failed: {e}")
            except RuntimeError:
                print(f"Translation failed: {e}")
            return hinglish_text

# Global instance
sarvam_voice_service = SarvamVoiceService()

if __name__ == "__main__":
    print("\n--- Testing SarvamVoiceService ---")
    
    # Test 1: Language Detection
    test_text_en = "Hello, how are you feeling today?"
    test_text_hi = "Namaste amigo, kya haal hai?"
    
    print(f"\nTesting Language Detection:")
    print(f"Input: '{test_text_en}' -> {sarvam_voice_service.detect_language_and_context(test_text_en)}")
    print(f"Input: '{test_text_hi}' -> {sarvam_voice_service.detect_language_and_context(test_text_hi)}")
    
    # Test 2: Text to Speech
    print(f"\nTesting TTS:")
    try:
        audio_path = sarvam_voice_service.text_to_speech("Namaste, main aapki dost hoon. Kaise madad kar sakti hoon?", language_code="hi-IN")
        if audio_path:
            print(f"✅ TTS successful! Audio file created at: {audio_path}")
        else:
            print("❌ TTS failed.")
    except Exception as e:
        print(f"❌ TTS Exception: {e}")
