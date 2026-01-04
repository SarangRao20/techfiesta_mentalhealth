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
    const [voiceStatus, setVoiceStatus] = useState('listening'); // listening, processing, speaking

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: input,
                    session_id: sessionId
                })
            });

            const data = await res.json();

            const botMsg = { role: 'bot', content: data.bot_message };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Voice Mode Simulation
    const toggleVoiceMode = () => {
        if (isVoiceMode) {
            setIsVoiceMode(false);
        } else {
            setIsVoiceMode(true);
            setVoiceStatus('listening');
            // Mock interaction flow
            setTimeout(() => setVoiceStatus('processing'), 3000);
            setTimeout(() => {
                setVoiceStatus('speaking');
                // Could acturally trigger TTS here
            }, 5000);
            setTimeout(() => setVoiceStatus('listening'), 8000);
        }
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
                            <p className="text-neutral-400 font-light">
                                Speak naturally. I'm here to listen.
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-6">
                            <button className="p-4 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors">
                                <StopCircle className="w-6 h-6" />
                            </button>
                            <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <Volume2 className="w-6 h-6" />
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
