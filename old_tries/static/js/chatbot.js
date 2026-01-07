/**
 * MindCare Chatbot Interface
 * Handles chat functionality, crisis detection, and voice integration
 */

class ChatbotInterface {
    constructor() {
        this.sessionId = null;
        this.isTyping = false;
        this.messageQueue = [];
        this.crisisDetected = false;
        this.voiceEnabled = false;
        
        this.init();
    }
    
    init() {
        this.sessionId = document.querySelector('input[name="session_id"]')?.value;
        this.setupEventListeners();
        this.scrollToBottom();
        this.showWelcomeMessage();
    }
    
    setupEventListeners() {
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSubmit(e);
                }
            });
            
            // Auto-resize textarea
            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            });
            
            // Show typing indicator - simple debounce implementation
            let debounceTimer;
            messageInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.detectCrisisKeywords(messageInput.value);
                }, 500);
            });
        }
        
        // Handle voice button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('#voice-btn, #voice-btn *')) {
                this.toggleVoice();
            }
        });
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Clear input and disable submit button
        messageInput.value = '';
        messageInput.style.height = 'auto';
        this.setSubmitButtonState(true);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to server
            const response = await this.sendMessage(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Handle error responses from server
            if (response.error && response.bot_message) {
                // Server returned both error and fallback message
                this.addMessage(response.bot_message, 'bot');
            } else if (response.bot_message) {
                // Normal successful response
                this.addMessage(response.bot_message, 'bot');
                
                // Handle crisis detection
                if (response.crisis_detected) {
                    this.handleCrisisDetection(response);
                }
                
                // Handle assessment suggestions
                if (response.assessment_suggestion) {
                    this.showAssessmentSuggestion(response.assessment_suggestion);
                }
            } else {
                // No bot message returned
                throw new Error('No response received from server');
            }
            
            // Speak response if voice is enabled
            if (this.voiceEnabled && response.bot_message) {
                this.speakMessage(response.bot_message, message, response.bot_message);
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            
            // Provide intelligent fallback response based on user message
            const fallbackResponse = this.getFallbackResponse(message);
            this.addMessage(fallbackResponse, 'bot');
            
            // Speak response if voice is enabled
            if (this.voiceEnabled) {
                this.speakMessage(fallbackResponse, message, fallbackResponse);
            }
        } finally {
            this.setSubmitButtonState(false);
            messageInput.focus();
        }
    }
    
    async sendMessage(message) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('session_id', this.sessionId);
        
        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Even if the response is not OK, check if there's a bot_message we can use
        if (!response.ok) {
            if (data.bot_message) {
                // Server sent an error but also provided a fallback message
                return data;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        return data;
    }
    
    addMessage(content, type, isError = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-bubble ${isError ? 'error' : ''}">
                <div class="message-content">${this.formatMessage(content)}</div>
                <small class="message-time text-muted d-block mt-1">${timestamp}</small>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Animate message in
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 10);
    }
    
    formatMessage(content) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        // Highlight important words
        const importantWords = ['important', 'urgent', 'help', 'support', 'crisis'];
        importantWords.forEach(word => {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            content = content.replace(regex, '<strong>$1</strong>');
        });
        
        return content;
    }
    
    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    showWelcomeMessage() {
        const chatMessages = document.getElementById('chat-messages');
        const messages = chatMessages.querySelectorAll('.message');
        
        if (messages.length === 0) {
            setTimeout(() => {
                this.addMessage(
                    "Hello! I'm here to provide mental health support and listen to whatever you'd like to share. How are you feeling today?",
                    'bot'
                );
            }, 500);
        }
    }
    
    detectCrisisKeywords(text) {
        const crisisKeywords = [
            'suicide', 'kill myself', 'end my life', 'want to die',
            'self harm', 'hurt myself', 'worthless', 'hopeless',
            'better off dead', 'end it all'
        ];
        
        const textLower = text.toLowerCase();
        const hasCrisisKeywords = crisisKeywords.some(keyword => textLower.includes(keyword));
        
        if (hasCrisisKeywords && text.length > 10 && !this.crisisDetected) {
            this.showCrisisAlert();
            this.crisisDetected = true;
        }
    }
    
    handleCrisisDetection(response) {
        this.showCrisisAlert();
        
        // Add special crisis support message
        setTimeout(() => {
            this.addMessage(
                `I'm concerned about what you've shared. Your safety is important. Please consider reaching out for immediate support:
                
                🔴 Crisis Hotline: <a href="tel:988">988</a>
                📱 Text Support: <a href="sms:741741">Text HOME to 741741</a>
                💬 Online Chat: <a href="/consultation">Request Professional Help</a>
                
                Would you like to talk about what's troubling you?`,
                'bot'
            );
        }, 1000);
    }
    
    showCrisisAlert() {
        const alertDiv = document.getElementById('crisis-alert');
        if (alertDiv) {
            alertDiv.classList.remove('d-none');
            
            // Scroll alert into view
            alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add pulse animation
            alertDiv.classList.add('crisis-pulse');
        }
    }
    
    showAssessmentSuggestion(suggestion) {
        const suggestionDiv = document.getElementById('assessment-suggestion');
        const reasonDiv = document.getElementById('assessment-reason');
        const buttonDiv = document.getElementById('take-assessment-btn');
        
        if (suggestionDiv && suggestion.suggested_assessment !== 'none') {
            reasonDiv.textContent = suggestion.reason;
            buttonDiv.href = `/assessment/${suggestion.suggested_assessment}`;
            buttonDiv.innerHTML = `<i class="fas fa-clipboard-check"></i> Take ${suggestion.suggested_assessment}`;
            
            suggestionDiv.classList.remove('d-none');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                suggestionDiv.classList.add('d-none');
            }, 10000);
        }
    }
    
    async speakMessage(text, userMessage = '', originalResponse = '') {
        try {
            const response = await fetch('/voice_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: text,
                    user_message: userMessage,
                    original_response: originalResponse || text
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.audio_url) {
                    const audio = new Audio(data.audio_url);
                    
                    // Show TTS status
                    this.showTTSStatus('playing', data.language_detected);
                    
                    audio.onended = () => {
                        this.showTTSStatus('idle');
                    };
                    
                    audio.onerror = () => {
                        this.showTTSStatus('error');
                    };
                    
                    await audio.play();
                    
                    // Log language detection info
                    if (data.language_detected) {
                        console.log('TTS Language:', data.language_detected);
                    }
                }
            }
        } catch (error) {
            console.error('Voice synthesis error:', error);
            this.showTTSStatus('error');
        }
    }
    
    showTTSStatus(state, languageInfo = null) {
        const voiceStatus = document.getElementById('voice-status');
        if (!voiceStatus) return;
        
        switch (state) {
            case 'playing':
                const langText = languageInfo && languageInfo.is_hinglish ? 'Hinglish' : 'English';
                voiceStatus.innerHTML = `<small class="text-success"><i class="fas fa-volume-up"></i> Speaking (${langText})</small>`;
                break;
            case 'error':
                voiceStatus.innerHTML = '<small class="text-warning"><i class="fas fa-exclamation-triangle"></i> Audio error</small>';
                setTimeout(() => this.showTTSStatus('idle'), 3000);
                break;
            case 'idle':
            default:
                voiceStatus.innerHTML = '';
                break;
        }
    }
    
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        const voiceBtn = document.getElementById('voice-btn');
        const voiceIndicator = document.getElementById('voice-mode-indicator');
        
        if (voiceBtn) {
            if (this.voiceEnabled) {
                voiceBtn.classList.add('btn-success');
                voiceBtn.classList.remove('btn-primary');
                voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                
                if (voiceIndicator) {
                    voiceIndicator.classList.remove('d-none');
                }
            } else {
                voiceBtn.classList.add('btn-primary');
                voiceBtn.classList.remove('btn-success');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                
                if (voiceIndicator) {
                    voiceIndicator.classList.add('d-none');
                }
            }
        }
        
        // Show notification
        const message = this.voiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled';
        console.log(message);
    }
    
    setSubmitButtonState(disabled) {
        const submitBtn = document.getElementById('send-btn');
        if (submitBtn) {
            submitBtn.disabled = disabled;
            if (disabled) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            } else {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        }
    }
    
    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    }
    
    getFallbackResponse(message) {
        const messageLower = message.toLowerCase();
        
        // Crisis keywords
        const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 
                               'hurt myself', 'hopeless', 'worthless', 'better off dead', 'end it all',
                               'marna hai', 'jaan deni hai', 'maut'];
        
        const isCrisis = crisisKeywords.some(keyword => messageLower.includes(keyword));
        
        if (isCrisis) {
            // Show crisis alert
            this.showCrisisAlert();
            return `I'm very concerned about what you've shared. Your life has value and there are people who want to help you. Please reach out for immediate support:
            
🔴 Crisis Hotline: <a href="tel:988">988</a>
📱 Text Support: <a href="sms:741741">Text HOME to 741741</a>
💬 Online Chat: <a href="/consultation">Request Professional Help</a>

You don't have to go through this alone. Would you like to talk about what's troubling you?`;
        }
        
        // Anxiety responses
        if (['anxious', 'anxiety', 'worried', 'panic', 'nervous', 'stress', 'tense'].some(word => messageLower.includes(word))) {
            return `I understand you're feeling anxious, and that can be really overwhelming. Here are some techniques that might help:

💨 **Breathing Exercise**: Try the 4-7-8 technique - breathe in for 4, hold for 7, exhale for 8
🧘 **Grounding**: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste
📝 **Write it down**: Sometimes getting worries out of your head onto paper helps

Would you like to try one of these techniques together, or would you prefer to talk about what's making you feel anxious?`;
        }
        
        // Depression responses
        if (['depressed', 'depression', 'sad', 'down', 'empty', 'lonely', 'worthless'].some(word => messageLower.includes(word))) {
            return `I hear that you're going through a difficult time, and I want you to know that your feelings are valid. Depression can make even simple tasks feel overwhelming.

💙 **Small steps matter**: Even getting dressed or having a meal is an achievement
🌱 **Be patient with yourself**: Healing takes time, and progress isn't always linear
🤝 **You're not alone**: Many people understand what you're going through

Some things that might help:
- Gentle movement (even a short walk)
- Connecting with one supportive person
- Engaging in one small activity you used to enjoy

How are you taking care of yourself today? What feels manageable right now?`;
        }
        
        // General mental health support
        if (['help', 'support', 'struggling', 'difficult', 'hard time', 'overwhelmed', 'tired', 'exhausted'].some(word => messageLower.includes(word))) {
            return `Thank you for reaching out. It takes courage to ask for help, and I'm here to support you.

🌟 **You're taking the right step** by talking about what you're going through
💪 **You're stronger than you know** - you've made it through difficult times before
🎯 **Focus on today** - we don't have to solve everything at once

Some ways I can help:
- Listen without judgment as you share what's on your mind
- Suggest coping strategies and self-care techniques
- Help you explore your feelings and thoughts
- Connect you with professional resources if needed

What would feel most helpful to you right now?`;
        }
        
        // Greeting responses
        if (['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'howdy'].some(word => messageLower.includes(word))) {
            return `Hello! I'm glad you're here. I'm your AI mental health companion, and I'm here to listen and support you.

Whether you're having a good day or going through a tough time, this is a safe space where you can share whatever is on your mind. 

How are you feeling today? What would you like to talk about?`;
        }
        
        // Sleep issues
        if (['sleep', 'insomnia', 'tired', 'can\'t sleep', 'sleepless', 'awake'].some(word => messageLower.includes(word))) {
            return `Sleep issues can really affect how we feel during the day. Here are some techniques that might help:

🌙 **Sleep hygiene**: Try to go to bed and wake up at the same time each day
📱 **Limit screens**: Avoid phones/computers 1 hour before bed
🛁 **Relaxation**: Try a warm bath, reading, or gentle stretching before bed
☕ **Avoid caffeine**: Especially after 2 PM

Are you having trouble falling asleep, staying asleep, or both? Sometimes talking about what's keeping you awake can help.`;
        }
        
        // Relationship issues
        if (['relationship', 'friend', 'family', 'partner', 'boyfriend', 'girlfriend', 'marriage', 'fight', 'argument'].some(word => messageLower.includes(word))) {
            return `Relationships can be complex and challenging. It's normal to have ups and downs with the people we care about.

💬 **Communication is key**: Try expressing your feelings using "I" statements
👂 **Listen actively**: Sometimes people just need to be heard
⏰ **Take time**: It's okay to take a break during heated discussions
❤️ **Self-care first**: You can't pour from an empty cup

Would you like to talk more about what's happening in your relationships? I'm here to listen without judgment.`;
        }
        
        // Work/school stress
        if (['work', 'job', 'school', 'study', 'exam', 'boss', 'teacher', 'deadline', 'pressure'].some(word => messageLower.includes(word))) {
            return `Work and school stress can feel overwhelming sometimes. You're not alone in feeling this way.

📋 **Break tasks down**: Large projects feel less scary as smaller steps
⏰ **Time management**: Try techniques like the Pomodoro method (25min work, 5min break)
🎯 **Prioritize**: Focus on what's most important first
🧘 **Take breaks**: Your brain needs rest to work effectively

What's feeling most stressful about your work or studies right now? Sometimes just talking through it can help clarify things.`;
        }
        
        // Default fallback response
        return `I appreciate you sharing that with me. While I'm experiencing some technical difficulties with my main system right now, I want you to know that I'm here to listen and support you.

Your mental health and wellbeing are important. Even though I might not have all my advanced features available right now, we can still have a meaningful conversation.

Is there something specific you'd like to talk about or explore together? I'm here to listen and provide what support I can.

If you're experiencing a mental health crisis, please don't hesitate to reach out to:
- National Suicide Prevention Lifeline: <a href="tel:988">988</a>
- Crisis Text Line: <a href="sms:741741">Text HOME to 741741</a>
- Or your local emergency services`;
    }
    
    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && confirm('Are you sure you want to clear the chat history?')) {
            chatMessages.innerHTML = '';
            this.crisisDetected = false;
            
            // Hide alerts
            const crisisAlert = document.getElementById('crisis-alert');
            const assessmentSuggestion = document.getElementById('assessment-suggestion');
            
            if (crisisAlert) crisisAlert.classList.add('d-none');
            if (assessmentSuggestion) assessmentSuggestion.classList.add('d-none');
            
            // Show welcome message again
            this.showWelcomeMessage();
        }
    }
}

// Global functions for template usage
function sendMessage(event) {
    if (window.chatbot) {
        window.chatbot.handleSubmit(event);
    }
}

function clearChat() {
    if (window.chatbot) {
        window.chatbot.clearChat();
    }
}

function toggleVoice() {
    if (window.chatbot) {
        window.chatbot.toggleVoice();
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('chat-messages')) {
        window.chatbot = new ChatbotInterface();
    }
});

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
.typing-indicator .message-bubble {
    background: #f8f9fa !important;
    border: 1px solid #dee2e6;
}

.typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 8px 0;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #007bff;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

.crisis-pulse {
    animation: crisis-pulse 1s ease-in-out infinite;
}

@keyframes crisis-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

.message.animate-in {
    animation: slideInMessage 0.3s ease-out;
}

@keyframes slideInMessage {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-bubble.error {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%) !important;
    border: 1px solid #f5c6cb !important;
    color: #721c24 !important;
}
`;
document.head.appendChild(style);
