/**
 * MindCare Voice Interface
 * Handles speech recognition and text-to-speech functionality
 */

class VoiceInterface {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSupported = this.checkSupport();
        this.voices = [];
        
        this.init();
    }
    
    init() {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }
        
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.setupEventListeners();
    }
    
    checkSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'hi-IN'; // Support Hindi/Hinglish
            
            this.recognition.onstart = () => {
                this.onRecognitionStart();
            };
            
            this.recognition.onresult = (event) => {
                this.onRecognitionResult(event);
            };
            
            this.recognition.onerror = (event) => {
                this.onRecognitionError(event);
            };
            
            this.recognition.onend = () => {
                this.onRecognitionEnd();
            };
        }
        
        // Also setup MediaRecorder as fallback for better Hindi support
        this.setupMediaRecorder();
    }
    
    setupMediaRecorder() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStream = null;
    }
    
    setupSpeechSynthesis() {
        if (this.synthesis) {
            // Load voices
            this.loadVoices();
            
            // Reload voices when they change (some browsers load them asynchronously)
            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = () => {
                    this.loadVoices();
                };
            }
        }
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Prefer female voices for mental health context (more calming)
        const preferredVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en') && (
                voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('karen') ||
                voice.name.toLowerCase().includes('susan')
            )
        );
        
        this.selectedVoice = preferredVoices[0] || this.voices.find(voice => 
            voice.lang.startsWith('en') && voice.default
        ) || this.voices[0];
    }
    
    setupEventListeners() {
        // Voice button event delegation is handled in main chatbot script
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + V to toggle voice
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleListening();
            }
            
            // Escape to stop listening
            if (e.key === 'Escape' && this.isListening) {
                this.stopListening();
            }
        });
    }
    
    startListening() {
        if (this.isListening) {
            return;
        }
        
        // Try Sarvam AI transcription first (better for Hindi/Hinglish)
        if (this.canUseMediaRecorder()) {
            this.startSarvamRecording();
        } else if (this.isSupported && this.recognition) {
            // Fallback to browser speech recognition
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.showVoiceError('Failed to start voice recognition');
            }
        } else {
            this.showVoiceError('Voice recognition not supported');
        }
    }
    
    canUseMediaRecorder() {
        return 'MediaRecorder' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }
    
    async startSarvamRecording() {
        try {
            // Get microphone access
            this.recordingStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.recordingStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processSarvamRecording();
            };
            
            this.mediaRecorder.start();
            this.onRecognitionStart();
            
            // Auto-stop after 8 seconds (like your Streamlit app)
            setTimeout(() => {
                if (this.isListening) {
                    this.stopListening();
                }
            }, 8000);
            
        } catch (error) {
            console.error('Error starting Sarvam recording:', error);
            this.showVoiceError('Microphone access denied or unavailable');
        }
    }
    
    async processSarvamRecording() {
        try {
            if (this.audioChunks.length === 0) {
                this.showVoiceError('No audio recorded');
                return;
            }
            
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Convert to WAV format for better compatibility
            const audioBuffer = await audioBlob.arrayBuffer();
            const wavBlob = await this.convertToWav(audioBuffer);
            
            // Send to Sarvam AI for transcription
            await this.transcribeWithSarvam(wavBlob);
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showVoiceError('Failed to process recording');
        } finally {
            this.cleanupRecording();
        }
    }
    
    async transcribeWithSarvam(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            
            const response = await fetch('/voice_transcribe', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.transcript) {
                    this.handleTranscriptionResult(data.transcript, data.language_info);
                } else {
                    this.showVoiceError('No speech detected');
                }
            } else {
                const errorData = await response.json();
                this.showVoiceError(errorData.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            this.showVoiceError('Failed to transcribe audio');
        }
    }
    
    async convertToWav(audioBuffer) {
        // Simple conversion - in production, you'd use a proper audio processing library
        // For now, just return the original blob
        return new Blob([audioBuffer], { type: 'audio/wav' });
    }
    
    handleTranscriptionResult(transcript, languageInfo) {
        const messageInput = document.getElementById('message-input');
        if (messageInput && transcript) {
            // Add transcript to input
            const currentValue = messageInput.value;
            messageInput.value = currentValue + (currentValue ? ' ' : '') + transcript;
            
            // Trigger input event
            messageInput.dispatchEvent(new Event('input'));
            
            // Show language detection info
            if (languageInfo) {
                console.log('Language detected:', languageInfo);
                this.showLanguageInfo(languageInfo);
            }
            
            // Auto-submit if it seems complete
            if (this.shouldAutoSubmit(transcript)) {
                setTimeout(() => {
                    const submitBtn = document.getElementById('send-btn');
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }, 500);
            }
        }
    }
    
    showLanguageInfo(languageInfo) {
        const voiceStatus = document.getElementById('voice-status');
        if (voiceStatus && languageInfo.is_hinglish) {
            voiceStatus.innerHTML = '<small class="text-info"><i class="fas fa-language"></i> Hinglish detected</small>';
            setTimeout(() => {
                voiceStatus.innerHTML = '';
            }, 3000);
        }
    }
    
    cleanupRecording() {
        if (this.recordingStream) {
            this.recordingStream.getTracks().forEach(track => track.stop());
            this.recordingStream = null;
        }
        if (this.mediaRecorder) {
            this.mediaRecorder = null;
        }
        this.audioChunks = [];
    }
    
    stopListening() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        } else if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    onRecognitionStart() {
        this.isListening = true;
        this.updateVoiceUI('listening');
        
        // Show listening indicator
        this.showListeningIndicator();
    }
    
    onRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update input with interim results
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            if (finalTranscript) {
                // Add final transcript to input
                const currentValue = messageInput.value;
                messageInput.value = currentValue + (currentValue ? ' ' : '') + finalTranscript;
                
                // Trigger input event for auto-resize and other listeners
                messageInput.dispatchEvent(new Event('input'));
                
                // Auto-submit if it seems like a complete thought
                if (this.shouldAutoSubmit(finalTranscript)) {
                    setTimeout(() => {
                        const submitBtn = document.getElementById('send-btn');
                        if (submitBtn && !submitBtn.disabled) {
                            submitBtn.click();
                        }
                    }, 500);
                }
            } else if (interimTranscript) {
                // Show interim results as placeholder
                this.showInterimText(interimTranscript);
            }
        }
    }
    
    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone access denied or unavailable.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied.';
                break;
            case 'network':
                errorMessage = 'Network error during voice recognition.';
                break;
        }
        
        this.showVoiceError(errorMessage);
    }
    
    onRecognitionEnd() {
        this.isListening = false;
        this.updateVoiceUI('idle');
        this.hideListeningIndicator();
    }
    
    shouldAutoSubmit(text) {
        // Auto-submit if the text ends with certain punctuation or phrases
        const autoSubmitPatterns = [
            /[.!?]$/,  // Ends with punctuation
            /\b(thank you|thanks|bye|goodbye|help me|please help)\b/i,  // Key phrases
            /\b(yes|no|okay|ok|sure)\s*$/i  // Short confirmations
        ];
        
        return autoSubmitPatterns.some(pattern => pattern.test(text.trim()));
    }
    
    speak(text, options = {}) {
        if (!this.synthesis || !text) {
            return Promise.reject('Speech synthesis not available');
        }
        
        return new Promise((resolve, reject) => {
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure utterance
            utterance.voice = this.selectedVoice;
            utterance.rate = options.rate || 0.9; // Slightly slower for mental health context
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 0.8;
            
            // Event handlers
            utterance.onend = () => {
                this.updateVoiceUI('idle');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                this.updateVoiceUI('idle');
                reject(event.error);
            };
            
            utterance.onstart = () => {
                this.updateVoiceUI('speaking');
            };
            
            // Speak the text
            this.synthesis.speak(utterance);
        });
    }
    
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.updateVoiceUI('idle');
        }
    }
    
    updateVoiceUI(state) {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');
        
        if (!voiceBtn) return;
        
        // Remove all state classes
        voiceBtn.classList.remove('btn-primary', 'btn-success', 'btn-warning', 'btn-danger', 'listening');
        
        switch (state) {
            case 'idle':
                voiceBtn.classList.add('btn-primary');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                if (voiceStatus) {
                    voiceStatus.innerHTML = '<small class="text-muted">Click to start voice input</small>';
                }
                break;
                
            case 'listening':
                voiceBtn.classList.add('btn-danger', 'listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                if (voiceStatus) {
                    voiceStatus.innerHTML = '<small class="text-danger"><i class="fas fa-circle"></i> Listening...</small>';
                }
                break;
                
            case 'speaking':
                voiceBtn.classList.add('btn-success');
                voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                if (voiceStatus) {
                    voiceStatus.innerHTML = '<small class="text-success"><i class="fas fa-sound-wave"></i> Speaking...</small>';
                }
                break;
                
            case 'error':
                voiceBtn.classList.add('btn-warning');
                voiceBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                break;
        }
    }
    
    showListeningIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Remove existing indicator
        this.hideListeningIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'voice-listening-indicator';
        indicator.className = 'voice-listening-indicator';
        indicator.innerHTML = `
            <div class="listening-animation">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            <small class="text-muted">Listening for your voice...</small>
        `;
        
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    hideListeningIndicator() {
        const indicator = document.getElementById('voice-listening-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showInterimText(text) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            const placeholder = messageInput.getAttribute('data-original-placeholder') || messageInput.placeholder;
            messageInput.setAttribute('data-original-placeholder', placeholder);
            messageInput.placeholder = `Hearing: "${text}"...`;
        }
    }
    
    showVoiceError(message) {
        this.updateVoiceUI('error');
        
        // Show error message
        console.error('Voice error:', message);
        
        // You could show a simple alert or toast here
        // alert(message); // Uncomment if you want popup alerts
        
        // Reset UI after delay
        setTimeout(() => {
            this.updateVoiceUI('idle');
        }, 3000);
    }
    
    // Check if microphone permission is available
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            return false;
        }
    }
    
    // Get available voices for settings
    getAvailableVoices() {
        return this.voices.filter(voice => voice.lang.startsWith('en'));
    }
    
    // Set preferred voice
    setVoice(voiceURI) {
        const voice = this.voices.find(v => v.voiceURI === voiceURI);
        if (voice) {
            this.selectedVoice = voice;
            localStorage.setItem('mindcare-preferred-voice', voiceURI);
        }
    }
    
    // Load preferred voice from storage
    loadPreferredVoice() {
        const preferredVoice = localStorage.getItem('mindcare-preferred-voice');
        if (preferredVoice) {
            this.setVoice(preferredVoice);
        }
    }
}

// Global functions for template usage
function toggleListening() {
    if (window.voiceInterface) {
        window.voiceInterface.toggleListening();
    }
}

function speakText(text) {
    if (window.voiceInterface) {
        return window.voiceInterface.speak(text);
    }
    return Promise.reject('Voice interface not available');
}

// Initialize voice interface when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.voiceInterface = new VoiceInterface();
    
    // Load preferred voice after voices are loaded
    setTimeout(() => {
        window.voiceInterface.loadPreferredVoice();
    }, 1000);
});

// Add CSS for voice UI components
const voiceStyle = document.createElement('style');
voiceStyle.textContent = `
.voice-listening-indicator {
    text-align: center;
    padding: 20px;
    margin: 10px 0;
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-radius: 15px;
    border: 2px dashed #2196f3;
}

.listening-animation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    margin-bottom: 10px;
}

.wave {
    width: 4px;
    height: 20px;
    background: #2196f3;
    border-radius: 2px;
    animation: voice-wave 1.2s ease-in-out infinite;
}

.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }
.wave:nth-child(4) { animation-delay: 0.3s; }
.wave:nth-child(5) { animation-delay: 0.4s; }

@keyframes voice-wave {
    0%, 100% { height: 20px; background: #2196f3; }
    50% { height: 40px; background: #1976d2; }
}

.voice-btn.listening {
    animation: voice-pulse 1s ease-in-out infinite;
}

@keyframes voice-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
}

.voice-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.voice-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}

.voice-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.voice-status {
    margin-top: 5px;
    font-size: 0.75rem;
}

@media (max-width: 768px) {
    .voice-controls {
        bottom: 80px;
    }
    
    .voice-btn {
        width: 50px;
        height: 50px;
        font-size: 1rem;
    }
}
`;
document.head.appendChild(voiceStyle);
