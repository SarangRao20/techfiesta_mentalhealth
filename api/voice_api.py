from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required
import os
import tempfile

ns = Namespace('voice', description='Voice services (TTS and STT)')

tts_model = ns.model('TTSRequest', {
    'text': fields.String(required=True, description='Text to convert to speech')
})

@ns.route('/tts')
class TextToSpeech(Resource):
    @login_required
    @ns.expect(tts_model)
    def post(self):
        """Convert text to speech (TTS)"""
        data = ns.payload
        text = data.get('text')

        try:
            from sarvam_voice_service import sarvam_voice_service
            audio_path = sarvam_voice_service.text_to_speech(text)
            
            if audio_path:
                filename = os.path.basename(audio_path)
                return {'audio_url': f'/audio/{filename}'}, 200
        except Exception as e:
            return {'message': f'TTS failed: {str(e)}'}, 500

@ns.route('/transcribe')
class VoiceTranscribeAPI(Resource):
    @login_required
    def post(self):
        """Transcribe audio file to text (STT)"""
        if 'audio' not in request.files:
            return {'message': 'No audio file provided'}, 400
        
        audio_file = request.files['audio']
        
        try:
            from sarvam_voice_service import sarvam_voice_service
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                audio_file.save(temp_file.name)
                temp_path = temp_file.name
            
            try:
                transcript = sarvam_voice_service.transcribe_audio(temp_path)
                if transcript:
                    return {'transcript': transcript}, 200
                return {'message': 'No speech detected'}, 400
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        except Exception as e:
            return {'message': f'Transcription failed: {str(e)}'}, 500
