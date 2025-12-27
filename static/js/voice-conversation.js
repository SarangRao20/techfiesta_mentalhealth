/**
 * Hands-Free Voice Conversation Mode
 * Provides continuous voice interaction with the chatbot
 */

class VoiceConversationMode {
    constructor() {
        this.isActive = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.selectedVoice = null;
        this.silenceTimer = null;
        this.silenceTimeout = 8000; // 8 seconds of silence
        this.restartDelay = 1000; // 1 second delay before restarting
        this.overlay = null;
        
        this.init();
    }
    
    init() {
        this.checkSupport();
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.createOverlay();
        this.bindEvents();
    }
    
    checkSupport() {
        this.speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.synthesisSupported = 'speechSynthesis' in window;
        
        if (!this.speechSupported) {
            console.warn('Speech recognition not supported');
        }
        if (!this.synthesisSupported) {
            console.warn('Speech synthesis not supported');
        }
    }
    
    setupSpeechRecognition() {
        if (!this.speechSupported) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-IN'; // English-India for better Hinglish support
        this.recognition.maxAlternatives = 3;
        
        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
        this.recognition.onspeechstart = () => this.onSpeechStart();
        this.recognition.onspeechend = () => this.onSpeechEnd();
        this.recognition.onnomatch = () => this.onNoMatch();
    }
    
    setupSpeechSynthesis() {
        if (!this.synthesisSupported) return;
        
        // Load voices
        this.loadVoices();
        
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }
    
    loadVoices() {
        const voices = this.synthesis.getVoices();
        
        // Prefer Hindi/Indian English voices
        const preferredVoices = voices.filter(voice => 
            voice.lang.includes('hi') || 
            voice.lang.includes('en-IN') ||
            (voice.lang.includes('en') && voice.name.toLowerCase().includes('indian'))
        );
        
        this.selectedVoice = preferredVoices[0] || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'voice-conversation-overlay';
        this.overlay.innerHTML = `
            <div class="voice-overlay-content">
                <div class="voice-avatar-container">
                    <div class="voice-avatar">
                        <div class="avatar-pulse"></div>
                        <div class="avatar-image">
                            <i class="fas fa-microphone"></i>
                        </div>
                    </div>
                    <div class="voice-status">
                        <h3 id="voice-status-title">Voice Mode</h3>
                        <p id="voice-status-text">Click microphone to start</p>
                    </div>
                </div>
                
                <div class="voice-controls">
                    <button id="voice-mic-toggle" class="voice-btn voice-btn-primary">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button id="voice-cancel" class="voice-btn voice-btn-secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="voice-transcript" id="voice-transcript"></div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }
    
    bindEvents() {
        // Voice mode toggle from main chatbot
        document.addEventListener('click', (e) => {
            if (e.target.matches('#voice-conversation-trigger, #voice-conversation-trigger *') || 
                e.target.matches('#voice-btn, #voice-btn *') || 
                (e.target.textContent && e.target.textContent.includes('Voice'))) {
                e.preventDefault();
                this.toggleVoiceMode();
            }
        });
        
        // Overlay controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('#voice-mic-toggle, #voice-mic-toggle *')) {
                this.toggleListening();
            }
            if (e.target.matches('#voice-cancel, #voice-cancel *')) {
                this.exitVoiceMode();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                if (e.key === 'Escape') {
                    this.exitVoiceMode();
                }
                if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.toggleListening();
                }
            }
        });
    }
    
    toggleVoiceMode() {
        if (this.isActive) {
            this.exitVoiceMode();
        } else {
            this.enterVoiceMode();
        }
    }
    
    enterVoiceMode() {
        if (!this.speechSupported) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge for the best experience.');
            return;
        }
        
        if (!this.synthesisSupported) {
            console.warn('Speech synthesis not supported, but continuing with recognition only');
        }
        
        console.log('Entering voice conversation mode');
        
        this.isActive = true;
        this.overlay.classList.add('active');
        this.updateStatus('Voice Mode Active', 'Click microphone to start talking');
        
        // Enhance main UI visual feedback
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.style.filter = 'blur(1px)';
            chatContainer.style.opacity = '0.7';
            chatContainer.style.transition = 'all 0.3s ease';
        }
        
        // Update voice button in header if it exists
        const voiceTrigger = document.getElementById('voice-conversation-trigger');
        if (voiceTrigger) {
            voiceTrigger.classList.add('voice-active');
            voiceTrigger.innerHTML = '<i class="fas fa-microphone-slash me-1"></i> Exit Voice';
        }
        
        // Auto-start listening after a short delay
        setTimeout(() => {
            if (this.isActive) {
                this.startListening();
            }
        }, 1000);
    }
    
    exitVoiceMode() {
        console.log('Exiting voice conversation mode');
        
        this.isActive = false;
        this.stopListening();
        this.stopSpeaking();
        this.overlay.classList.remove('active');
        
        // Restore main UI
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.style.filter = 'none';
            chatContainer.style.opacity = '1';
            chatContainer.style.transition = 'all 0.3s ease';
        }
        
        // Restore voice button in header if it exists
        const voiceTrigger = document.getElementById('voice-conversation-trigger');
        if (voiceTrigger) {
            voiceTrigger.classList.remove('voice-active');
            voiceTrigger.innerHTML = '<i class="fas fa-microphone me-1"></i> Voice';
        }
        
        this.clearSilenceTimer();
        
        // Clear any transcript
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) {
            transcriptEl.innerHTML = '';
        }
        
        // Reset avatar and status
        this.updateAvatar('idle');
        this.updateStatus('Voice Mode', 'Exited');
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition || this.isListening || this.isSpeaking) return;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            this.updateStatus('Error', 'Failed to start voice recognition');
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        this.clearSilenceTimer();
    }
    
    onRecognitionStart() {
        this.isListening = true;
        this.updateStatus('Listening...', 'Speak now');
        this.updateAvatar('listening');
        this.updateMicButton('listening');
        this.startSilenceTimer();
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
        
        // Show interim results
        if (interimTranscript) {
            this.showTranscript(interimTranscript, false);
            this.resetSilenceTimer(); // Reset timer on speech
        }
        
        // Process final result
        if (finalTranscript.trim()) {
            this.showTranscript(finalTranscript, true);
            this.processFinalTranscript(finalTranscript.trim());
        }
    }
    
    onRecognitionError(event) {
        console.error('Recognition error:', event.error);
        
        let errorMessage = 'Recognition error';
        let shouldRestart = true;
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected - try again';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not available';
                shouldRestart = false;
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied';
                shouldRestart = false;
                break;
            case 'network':
                errorMessage = 'Network error - check connection';
                break;
            case 'aborted':
                errorMessage = 'Recognition stopped';
                break;
            case 'bad-grammar':
                errorMessage = 'Grammar error - try again';
                break;
            default:
                errorMessage = `Error: ${event.error}`;
        }
        
        this.updateStatus('Error', errorMessage);
        
        // Try to restart after error (except permission/hardware errors)
        if (shouldRestart && this.isActive) {
            setTimeout(() => {
                if (this.isActive && !this.isListening && !this.isSpeaking) {
                    console.log('Attempting to restart recognition after error');
                    this.startListening();
                }
            }, 2000);
        }
    }
    
    onRecognitionEnd() {
        this.isListening = false;
        this.updateAvatar('idle');
        this.updateMicButton('idle');
        this.clearSilenceTimer();
        
        // Don't auto-restart if we're speaking or exiting
        if (this.isActive && !this.isSpeaking) {
            this.updateStatus('Processing...', 'Waiting for response');
        }
    }
    
    onSpeechStart() {
        this.resetSilenceTimer();
        this.updateStatus('Listening...', 'Keep talking...');
    }
    
    onSpeechEnd() {
        this.startSilenceTimer();
    }
    
    onNoMatch() {
        this.updateStatus('Not understood', 'Please try again');
    }
    
    startSilenceTimer() {
        this.clearSilenceTimer();
        this.silenceTimer = setTimeout(() => {
            if (this.isListening) {
                this.stopListening();
                this.updateStatus('Silence detected', 'Click microphone to continue');
            }
        }, this.silenceTimeout);
    }
    
    resetSilenceTimer() {
        this.clearSilenceTimer();
        this.startSilenceTimer();
    }
    
    clearSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }
    
    async processFinalTranscript(transcript) {
        console.log('🎤 Processing transcript:', transcript);
        
        // Insert transcript into chat input and send using existing chatbot interface
        const messageInput = document.getElementById('message-input');
        
        if (!messageInput) {
            console.error('❌ Message input not found');
            this.updateStatus('Error', 'Chat input not found');
            return;
        }
        
        if (!window.chatbot) {
            console.error('❌ Chatbot interface not found');
            this.updateStatus('Error', 'Chatbot interface not available');
            return;
        }
        
        // Set the input value
        messageInput.value = transcript;
        console.log('📝 Set input value:', messageInput.value);
        
        this.updateStatus('Sending message...', 'Processing your input');
        
        // Wait for response first, then send
        this.waitForBotResponse();
        
        // Use the existing chatbot interface to send the message
        try {
            console.log('📤 Sending message via chatbot interface...');
            
            // Create a synthetic event
            const syntheticEvent = {
                preventDefault: () => {},
                target: document.getElementById('chat-form')
            };
            
            // Call the chatbot's handleSubmit method directly
            await window.chatbot.handleSubmit(syntheticEvent);
            
            console.log('✅ Message sent successfully');
            
        } catch (error) {
            console.error('❌ Error sending voice message:', error);
            this.updateStatus('Send error', 'Using fallback response');
            
            // Provide hardcoded fallback response
            const fallbackResponse = this.getFallbackResponse(transcript);
            
            // Add fallback message to chat
            this.addFallbackMessage(transcript, fallbackResponse);
            
            // Speak the fallback response
            setTimeout(() => {
                this.speakResponse(fallbackResponse);
            }, 1000);
        }
    }
    
    waitForBotResponse() {
        // Monitor for new bot messages
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Store the current number of messages to detect new ones
        const currentMessages = chatMessages.querySelectorAll('.message.bot:not(.typing-indicator)');
        const currentCount = currentMessages.length;
        
        console.log(`Waiting for bot response. Current bot messages: ${currentCount}`);
        
        let responseDetected = false;
        let timeoutTimer = null;
        let checkInterval = null;
        
        const checkForNewResponse = () => {
            if (responseDetected) return;
            
            const newMessages = chatMessages.querySelectorAll('.message.bot:not(.typing-indicator)');
            console.log(`Current messages check: ${newMessages.length} vs ${currentCount}`);
            
            if (newMessages.length > currentCount) {
                const latestMessage = newMessages[newMessages.length - 1];
                console.log('New bot message found:', latestMessage);
                
                // Try multiple selectors to find the message content
                let messageContent = latestMessage.querySelector('.message-content');
                if (!messageContent) {
                    messageContent = latestMessage.querySelector('.message-bubble .message-content');
                }
                if (!messageContent) {
                    messageContent = latestMessage.querySelector('.message-bubble');
                }
                if (!messageContent) {
                    messageContent = latestMessage.querySelector('.message-text');
                }
                
                if (messageContent) {
                    const text = messageContent.textContent.trim();
                    console.log('Bot response text:', text.substring(0, 100) + '...');
                    
                    if (text && text.length > 10 && !text.includes('...') && !text.includes('typing')) {
                        responseDetected = true;
                        clearTimeout(timeoutTimer);
                        clearInterval(checkInterval);
                        
                        console.log('✅ Bot response detected successfully');
                        this.updateStatus('Bot responded', 'Speaking response...');
                        
                        setTimeout(() => {
                            this.speakResponse(text);
                        }, 500);
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Check immediately
        if (!checkForNewResponse()) {
            // Set up interval to check every 500ms
            checkInterval = setInterval(() => {
                if (checkForNewResponse()) {
                    clearInterval(checkInterval);
                }
            }, 500);
            
            // Timeout after 20 seconds
            timeoutTimer = setTimeout(() => {
                if (!responseDetected) {
                    clearInterval(checkInterval);
                    console.log('⏰ Response timeout reached');
                    
                    // Check one more time before giving up
                    if (!checkForNewResponse()) {
                        this.updateStatus('Response timeout', 'Click microphone to continue');
                        
                        // Auto-restart listening after timeout
                        setTimeout(() => {
                            if (this.isActive && !this.isListening && !this.isSpeaking) {
                                console.log('Auto-restarting listening after timeout');
                                this.startListening();
                            }
                        }, 3000);
                    }
                }
            }, 20000);
        }
    }
    
    async speakResponse(text) {
        if (!this.isActive) {
            console.log('Voice mode not active');
            return;
        }
        
        // Clean text for speech
        const cleanText = this.cleanTextForSpeech(text);
        
        if (!cleanText || cleanText.length === 0) {
            console.log('No clean text to speak');
            this.isSpeaking = false;
            this.continueListening();
            return;
        }
        
        console.log('Speaking response:', cleanText.substring(0, 50) + '...');
        
        this.isSpeaking = true;
        this.updateStatus('Speaking...', cleanText.substring(0, 80) + (cleanText.length > 80 ? '...' : ''));
        this.updateAvatar('speaking');
        
        try {
            // Try to use the existing chatbot's TTS system first
            if (window.chatbot && typeof window.chatbot.speakMessage === 'function') {
                console.log('Using chatbot TTS system');
                
                // Use the chatbot's TTS which calls your Flask /voice_chat endpoint
                await window.chatbot.speakMessage(cleanText, '', cleanText);
                
                // Speech completed via chatbot system
                this.isSpeaking = false;
                
                if (this.isActive) {
                    this.updateStatus('Speech complete', 'Ready to listen again');
                    setTimeout(() => {
                        this.continueListening();
                    }, this.restartDelay);
                }
                
            } else if (this.synthesisSupported) {
                // Fallback to browser TTS
                console.log('Using browser TTS fallback');
                
                const utterance = new SpeechSynthesisUtterance(cleanText);
                
                // Use better voice selection for Hindi/English
                if (this.selectedVoice) {
                    utterance.voice = this.selectedVoice;
                }
                
                utterance.rate = 0.85;
                utterance.pitch = 1;
                utterance.volume = 0.9;
                utterance.lang = 'hi-IN';
                
                utterance.onstart = () => {
                    console.log('Browser speech synthesis started');
                    this.updateStatus('Speaking...', 'Bot is responding');
                };
                
                utterance.onend = () => {
                    console.log('Browser speech synthesis ended');
                    this.isSpeaking = false;
                    
                    if (this.isActive) {
                        this.updateStatus('Speech complete', 'Ready to listen again');
                        setTimeout(() => {
                            this.continueListening();
                        }, this.restartDelay);
                    }
                };
                
                utterance.onerror = (event) => {
                    console.error('Browser speech synthesis error:', event.error);
                    this.isSpeaking = false;
                    this.updateStatus('Speech error', 'Click microphone to continue');
                    this.updateAvatar('idle');
                };
                
                // Stop any ongoing speech and speak new text
                this.synthesis.cancel();
                setTimeout(() => {
                    this.synthesis.speak(utterance);
                }, 100);
                
            } else {
                console.log('No TTS available, continuing without speech');
                this.isSpeaking = false;
                this.continueListening();
            }
            
        } catch (error) {
            console.error('Error in speakResponse:', error);
            this.isSpeaking = false;
            this.updateStatus('Speech error', 'Click microphone to continue');
            this.updateAvatar('idle');
        }
    }
    
    continueListening() {
        if (this.isActive && !this.isListening && !this.isSpeaking) {
            console.log('Continuing listening after response');
            this.updateStatus('Ready to listen', 'Speak whenever you want');
            this.startListening();
        }
    }
    
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
    }
    
    cleanTextForSpeech(text) {
        // Remove markdown and HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/#{1,6}\s*/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]*)`/g, '$1')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/🔴|📱|🆘|💨|🧘|📝|💙|🌱|🤝|🌟|💪|🎯/g, '') // Remove emojis
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    getFallbackResponse(message) {
        const messageLower = message.toLowerCase();
        
        // Crisis keywords
        const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 
                               'hurt myself', 'hopeless', 'worthless', 'better off dead', 'end it all'];
        
        const isCrisis = crisisKeywords.some(keyword => messageLower.includes(keyword));
        
        if (isCrisis) {
            return "I'm very concerned about what you've shared. Your life has value and there are people who want to help you. Please reach out for immediate support by calling 988 or texting HOME to 741741. You don't have to go through this alone.";
        }
        
        // Anxiety responses
        if (['anxious', 'anxiety', 'worried', 'panic', 'nervous', 'stress'].some(word => messageLower.includes(word))) {
            return "I understand you're feeling anxious. Try this breathing exercise: breathe in for 4 counts, hold for 7, and exhale for 8. You can also try grounding yourself by naming 5 things you can see around you. Would you like to talk about what's making you feel anxious?";
        }
        
        // Depression responses
        if (['depressed', 'depression', 'sad', 'down', 'empty', 'lonely'].some(word => messageLower.includes(word))) {
            return "I hear that you're going through a difficult time, and your feelings are valid. Remember that small steps matter - even getting through today is an achievement. You're not alone in this. How are you taking care of yourself today?";
        }
        
        // General support
        if (['help', 'support', 'struggling', 'difficult', 'hard time', 'overwhelmed'].some(word => messageLower.includes(word))) {
            return "Thank you for reaching out. It takes courage to ask for help, and I'm here to support you. You're stronger than you know. What would feel most helpful to you right now?";
        }
        
        // Greetings
        if (['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste'].some(word => messageLower.includes(word))) {
            return "Hello! I'm glad you're here. I'm your AI mental health companion, and I'm here to listen and support you. How are you feeling today?";
        }
        
        // Default response
        return "I appreciate you sharing that with me. While I'm experiencing some technical difficulties right now, I want you to know that I'm here to listen and support you. Your mental health is important. Is there something specific you'd like to talk about?";
    }
    
    addFallbackMessage(userMessage, botResponse) {
        // Add user message to chat
        this.addMessageToChat(userMessage, 'user');
        
        // Add bot response to chat
        setTimeout(() => {
            this.addMessageToChat(botResponse, 'bot');
        }, 500);
    }
    
    addMessageToChat(content, type) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let messageHTML = '';
        if (type === 'bot') {
            messageHTML = `
                <div class="bot-avatar">
                    <img src="/static/img/chatbot_pfp.jpg" alt="Chatbot" class="rounded-circle" style="width: 45px; height: 45px;">
                </div>
                <div class="message-bubble">
                    <div class="message-content">${content}</div>
                    <small class="message-time text-muted d-block mt-1">${timestamp}</small>
                </div>
            `;
        } else {
            messageHTML = `
                <div class="message-bubble">
                    <div class="message-content">${content}</div>
                    <small class="message-time text-muted d-block mt-1">${timestamp}</small>
                </div>
            `;
        }
        
        messageDiv.innerHTML = messageHTML;
        chatMessages.appendChild(messageDiv);
        
        // Animate message in
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 10);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    showTranscript(text, isFinal) {
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) {
            transcriptEl.innerHTML = `
                <div class="transcript-text ${isFinal ? 'final' : 'interim'}">
                    ${text}
                </div>
            `;
        }
    }
    
    updateStatus(title, text) {
        const titleEl = document.getElementById('voice-status-title');
        const textEl = document.getElementById('voice-status-text');
        
        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = text;
    }
    
    updateAvatar(state) {
        const avatar = document.querySelector('.voice-avatar');
        if (!avatar) return;
        
        // Remove all state classes
        avatar.classList.remove('listening', 'speaking', 'processing', 'idle');
        avatar.classList.add(state);
        
        // Update icon
        const icon = avatar.querySelector('i');
        if (icon) {
            icon.className = this.getIconForState(state);
        }
    }
    
    updateMicButton(state) {
        const micBtn = document.getElementById('voice-mic-toggle');
        if (!micBtn) return;
        
        micBtn.classList.remove('active', 'listening');
        
        const icon = micBtn.querySelector('i');
        if (icon) {
            switch (state) {
                case 'listening':
                    micBtn.classList.add('active', 'listening');
                    icon.className = 'fas fa-microphone-slash';
                    break;
                case 'speaking':
                    micBtn.classList.add('active');
                    icon.className = 'fas fa-volume-up';
                    break;
                default:
                    icon.className = 'fas fa-microphone';
            }
        }
    }
    
    getIconForState(state) {
        switch (state) {
            case 'listening': return 'fas fa-microphone';
            case 'speaking': return 'fas fa-volume-up';
            case 'processing': return 'fas fa-cog fa-spin';
            default: return 'fas fa-robot';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure all other scripts are loaded
    setTimeout(() => {
        if (document.getElementById('chat-messages')) {
            window.voiceConversationMode = new VoiceConversationMode();
            console.log('Voice Conversation Mode initialized');
        }
    }, 100);
});