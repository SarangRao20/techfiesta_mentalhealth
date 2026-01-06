import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { Send, Mic, X, MessageSquare, Sparkles, Volume2, StopCircle } from 'lucide-react';

const Chat = () => {
    const { sessionId } = useParams();
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hello! I'm here to listen. How are you feeling today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Voice Mode State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('idle'); // idle, listening, processing, speaking
    const [transcript, setTranscript] = useState('');
    
    // Voice Refs
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const silenceTimerRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const isVoiceModeRef = useRef(false); // Ref to track voice mode for event handlers

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Keep ref in sync with state
    useEffect(() => {
        isVoiceModeRef.current = isVoiceMode;
    }, [isVoiceMode]);



    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (sessionId) {
            // Load history if needed
            // fetch(`${API_URL}/api/chatbot/${sessionId}`)...
        }
    }, [sessionId]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId
                })
            });

            const data = await res.json();

            const botMsg = { role: 'bot', content: data.bot_message };
            setMessages(prev => [...prev, botMsg]);
            return data.bot_message;
        } catch (error) {
            console.error(error);
            const errorMsg = "I'm having trouble connecting right now.";
            setMessages(prev => [...prev, { role: 'bot', content: errorMsg }]);
            return errorMsg;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        sendMessage(input);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- Voice Logic ---

    // Initialize Speech Recognition
    const setupSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return null;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true; // Keep listening
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Hinglish support
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('Voice recognition started');
            setVoiceStatus('listening');
        };

        recognition.onresult = (event) => {
            // STRICT GUARD: If bot is speaking or about to speak, ignore EVERYTHING.
            if (isSpeakingRef.current) {
                console.log('Ignored input while speaking');
                return;
            }

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
                handleVoiceInput(finalTranscript);
            } else if (interimTranscript) {
                setTranscript(interimTranscript);
                // Only reset timer if we are actually listening properly
                if (!isSpeakingRef.current) resetSilenceTimer();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech') {
                return; // Ignore no-speech errors
            }
            if (event.error === 'aborted') {
                return; // Ignore manual aborts
            }
            // Attempt restart if active
            if (isVoiceModeRef.current && !isSpeakingRef.current) {
                 // Short delay before restart
                 setTimeout(() => {
                     try { recognition.start(); } catch (e) {}
                 }, 1000);
            }
        };

        recognition.onend = () => {
            console.log('Voice recognition ended');
            // Auto-restart if still in voice mode and not speaking
            if (isVoiceModeRef.current && !isSpeakingRef.current) {
                console.log('Restarting recognition...');
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Failed to restart recognition', e);
                }
            } else {
                 setVoiceStatus('idle');
            }
        };

        return recognition;
    };

    const handleVoiceInput = async (text) => {
        // Prevent processing if we are already handling something or speaking
        if (isSpeakingRef.current) return;
        
        setVoiceStatus('processing');
        // Stop recognition temporarily while processing/speaking
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const responseText = await sendMessage(text);
        // sendMessage updates messages state, which triggers useEffect to speak
    };

    const speakResponse = (text) => {
        if (!text || !isVoiceMode) return;

        // CRITICAL FIX: Abort recognition IMMEDIATELY. 
        // stop() is too slow and might return a result. abort() kills it.
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        isSpeakingRef.current = true; // Set flag immediately
        setVoiceStatus('speaking');

        // Clean text (remove markdown etc - basic cleanup)
        const cleanText = text.replace(/[*#`]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Find a female voice or Hindi voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('India') || v.name.includes('Female'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            // Redundant safety check
            if (recognitionRef.current) recognitionRef.current.abort();
            setVoiceStatus('speaking');
            isSpeakingRef.current = true;
        };

        utterance.onend = () => {
             // Add a small delay before listening again to avoid "echo" of the last word
            setTimeout(() => {
                isSpeakingRef.current = false;
                setVoiceStatus('listening');
                setTranscript(''); // Clear transcript
                
                // Restart recognition
                if (isVoiceModeRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch(e) {
                         // Might be already started
                    }
                }
            }, 300); // 300ms delay helps clear the audio buffer
        };

        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setVoiceStatus('listening');
        };
        
        // Cancel any current speaking
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    // Effect to toggle Voice Mode
    useEffect(() => {
        if (isVoiceMode) {
            // Start
            if (!recognitionRef.current) {
                recognitionRef.current = setupSpeechRecognition();
            }
            try {
                recognitionRef.current?.start();
            } catch (e) { console.log('Already started'); }
            
        } else {
            // Stop
            if (recognitionRef.current) {
                recognitionRef.current.abort(); // Uses abort instead of stop for immediate effect
            }
            window.speechSynthesis.cancel();
            setVoiceStatus('idle');
            setTranscript('');
        }
        
        return () => {
            // Cleanup on unmount or mode switch
            if (recognitionRef.current) recognitionRef.current.abort();
            window.speechSynthesis.cancel();
        };
    }, [isVoiceMode]);

    // Effect to auto-speak bot messages in Voice Mode
    useEffect(() => {
        if (isVoiceMode && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'bot') {
                speakResponse(lastMsg.content);
            }
        }
    }, [messages, isVoiceMode]);

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            // Silence timeout logic - maybe stop listening or prompt?
            // For now, let's just let it stay listening as 'continuous' handles a lot.
            // But if we want to force stop on long silence:
            // setIsVoiceMode(false); 
        }, 8000);
    };

    const toggleVoiceMode = () => {
        setIsVoiceMode(prev => !prev);
    };

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between z-10 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg">AI Companion</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-neutral-400">Online</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={toggleVoiceMode}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    title="Voice Mode"
                >
                    <Mic className="w-5 h-5 text-blue-400" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[80%] p-4 rounded-2xl shadow-lg backdrop-blur-sm border
                            ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 rounded-tr-sm'
                                : 'bg-[#1a1a1a] border-white/5 rounded-tl-sm text-neutral-200'}
                        `}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] p-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1">
                            <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-md z-10">
                <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-6 py-4 focus:outline-none focus:border-blue-500/50 transition-colors text-white placeholder:text-neutral-600 shadow-inner"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* VOICE MODE OVERLAY */}
            {isVoiceMode && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                    <button
                        onClick={toggleVoiceMode}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div className="flex flex-col items-center gap-12">
                        {/* Gemini-style Orb */}
                        <div className="relative">
                            <div className={`
                                w-32 h-32 rounded-full blur-xl absolute top-0 left-0
                                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                                animate-pulse-slow opacity-60
                            `} />

                            <div className={`
                                relative w-32 h-32 rounded-full 
                                bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600
                                shadow-[0_0_80px_rgba(79,70,229,0.6)]
                                flex items-center justify-center
                                transition-all duration-500
                                ${voiceStatus === 'listening' ? 'scale-100 animate-breathing' : ''}
                                ${voiceStatus === 'processing' ? 'scale-90 animate-spin-slow' : ''}
                                ${voiceStatus === 'speaking' ? 'scale-110 shadow-[0_0_100px_rgba(236,72,153,0.8)]' : ''}
                            `}>
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-md" />
                            </div>

                            {/* Waveforms (Visible when speaking/listening) */}
                            {voiceStatus === 'speaking' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/10 rounded-full animate-ripple" />
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-light text-white tracking-wide">
                                {voiceStatus === 'listening' && "Listening..."}
                                {voiceStatus === 'processing' && "Thinking..."}
                                {voiceStatus === 'speaking' && "Speaking..."}
                            </h2>
                            <p className="text-neutral-400 font-light max-w-md text-center">
                                {transcript || "Speak naturally. I'm here to listen."}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-6">
                            <button 
                                onClick={toggleVoiceMode}
                                className="p-4 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            >
                                <StopCircle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes breathing {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-breathing {
                    animation: breathing 3s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes ripple {
                    0% { width: 100px; height: 100px; opacity: 1; }
                    100% { width: 300px; height: 300px; opacity: 0; }
                }
                .animate-ripple {
                    animation: ripple 1.5s linear infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Chat;
