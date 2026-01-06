import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, X, Sparkles, Volume2, StopCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BreathingExercise from './Features/BreathingExercise.jsx';
import BodyScanMeditation from './Features/BodyScanMeditation.jsx';
import MindfulnessMeditation from './Features/MindfulnessMeditation.jsx';
import NatureSounds from './Features/NatureSounds.jsx';
import OceanWaves from './Features/OceanWaves.jsx';
import PianoRelaxation from './Features/PianoRelaxation.jsx';
import SplitText from './animation/SplitText.jsx';

const FeatureRenderer = ({ feature, onClose }) => {
    switch (feature) {
        case "1/2-Minute Breathing Exercise":
            return (
                <BreathingExercise onClose={onClose} />
            );
        case "Body Scan Meditation":
            return (
                <BodyScanMeditation onClose={onClose} />
            );
        case "Mindfulness Meditation":
            return (
                <MindfulnessMeditation onClose={onClose} />
            );
        case "Nature Sounds":
            return (
                <NatureSounds onClose={onClose} />
            );
        case "Ocean Waves":
            return (
                <OceanWaves onClose={onClose} />
            );
        case "Piano Relaxation":
            return (
                <PianoRelaxation onClose={onClose} />
            )

        default:
            return (
                <div className="p-6 text-white h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">{feature}</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-white/60">Feature content will appear here...</p>
                </div>
            );
    }
};

const Chat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hello! I'm here to listen. How are you feeling today?" }
    ]);
    const[disableInput, setDisableInput] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);
    const [sosTimer, setSosTimer] = useState(null);
    const [sosCountdown, setSosCountdown] = useState(5);

    // Voice Mode State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('listening');
    const messagesEndRef = useRef(null);
    const sosTimerRef = useRef(null);
    const sosCountdownRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (sosTimerRef.current) {
                clearTimeout(sosTimerRef.current);
            }
            if (sosCountdownRef.current) {
                clearInterval(sosCountdownRef.current);
            }
        };
    }, []);

    // Heuristic crisis detection - immediate response
    const detectCrisisHeuristic = (message) => {
        const lowerMsg = message.toLowerCase().trim();
        
        const crisisKeywords = [
            'kill myself', 'end my life', 'want to die', 'wanna die', 
            'suicide', 'suicidal', 'end it all', 'better off dead',
            'no reason to live', 'cant go on', "can't go on",
            'im dying', "i'm dying", 'leave this world', 'dont want to live',
            "don't want to live", 'harm myself', 'hurt myself',
            'not worth living', 'end the pain', 'give up on life',
            'life is meaningless', 'no point in living', 'want it to end',
            'planning to die', 'take my life', 'commit suicide'
        ];
        
        return crisisKeywords.some(keyword => lowerMsg.includes(keyword));
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // IMMEDIATE HEURISTIC CHECK
        const isCrisisDetected = detectCrisisHeuristic(input);

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        
        // If crisis detected, immediately show crisis response
        if (isCrisisDetected) {
            const crisisMsg = {
                role: 'bot',
                content: "I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to someone who can help immediately.",
                suggestedFeature: "CALL",
                isCrisis: true
            };
            setMessages(prev => [...prev, crisisMsg]);
            startSosTimer(); // Start immediate timer
            setInput('');
            setIsLoading(false);
            setDisableInput(true);
            return; // Don't wait for API
        }

        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8000/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_message: input
                })
            });

            const data = await res.json();

            // Parse the reply - it could be plain text or JSON
            let replyContent = data.reply;
            let suggestedFeature = null;

            // Try to parse as JSON first
            try {
                const parsedReply = JSON.parse(data.reply);
                replyContent = parsedReply.response || data.reply;
                suggestedFeature = parsedReply.suggested_feature || null;
            } catch (e) {
                // If it's not JSON, treat it as plain text
                replyContent = data.reply;
            }

            const isCrisis = data.self_harm_crisis === "true";

            // If crisis detected by API, override suggested feature
            if (isCrisis) {
                suggestedFeature = "CALL";
            }

            const botMsg = {
                role: 'bot',
                content: replyContent,
                suggestedFeature: suggestedFeature,
                isCrisis: isCrisis
            };

            setMessages(prev => [...prev, botMsg]);
            
            // Start SOS timer if API also detected crisis
            if (isCrisis) {
                startSosTimer();
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "I'm having trouble connecting right now."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startSosTimer = () => {
        setSosCountdown(10);
        
        // Clear any existing timers
        if (sosTimerRef.current) {
            clearTimeout(sosTimerRef.current);
        }
        if (sosCountdownRef.current) {
            clearInterval(sosCountdownRef.current);
        }

        // Countdown interval
        let count = 5;
        sosCountdownRef.current = setInterval(() => {
            count -= 1;
            setSosCountdown(count);
            if (count <= 0) {
                clearInterval(sosCountdownRef.current);
            }
        }, 1000);

        // Navigate after 5 seconds
        sosTimerRef.current = setTimeout(() => {
            // navigate('/app/ar_breathing');
            console.log("ok")
        }, 10000);
    };

    const handleSosClick = () => {
        // Clear timers when user clicks SOS
        if (sosTimerRef.current) {
            clearTimeout(sosTimerRef.current);
        }
        if (sosCountdownRef.current) {
            clearInterval(sosCountdownRef.current);
        }
        setSosCountdown(5);
        
        // Handle SOS action (e.g., open tel: link or show emergency contacts)
        window.location.href = 'tel:988'; // Example: US suicide prevention hotline
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleVoiceMode = () => {
        if (isVoiceMode) {
            setIsVoiceMode(false);
        } else {
            setIsVoiceMode(true);
            setVoiceStatus('listening');
            setTimeout(() => setVoiceStatus('processing'), 3000);
            setTimeout(() => setVoiceStatus('speaking'), 5000);
            setTimeout(() => setVoiceStatus('listening'), 8000);
        }
    };

    const handleFeatureClick = (feature) => {
        console.log('Feature clicked:', feature);
        setActiveFeature(feature);
    };

    return (
        <div className="flex h-screen bg-[#0f131c] text-white relative overflow-hidden">
            {/* Main Chat Section */}
            <div className={`flex flex-col transition-all duration-500 ${activeFeature ? 'w-[45%]' : 'w-full'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0f131c]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#8e74ff] rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-base">AI Companion</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                <span className="text-xs text-white/40">Online</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={toggleVoiceMode}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5"
                        title="Voice Mode"
                    >
                        <Mic className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[75%] px-4 py-3 rounded-2xl
                                    ${msg.role === 'user'
                                        ? 'bg-[#8e74ff] text-white rounded-tr-md'
                                        : ' text-white/70 '}
                                `}>
                                    {msg.role === 'user' ? (
                                        <SplitText
                                            text={msg.content}
                                            className="text-md font-medium"
                                            delay={35}
                                            duration={0.6}
                                            ease="power3.out"
                                            splitType="words"
                                            from={{ opacity: 0, y: 40 }}
                                            to={{ opacity: 1, y: 0 }}
                                            threshold={0.1}
                                            rootMargin="-100px"
                                            textAlign="left"
                                        />
                                    ) : (
                                        <p className="text-md font-medium">{msg.content}</p>
                                    )}
                                </div>
                            </div>

                            {msg.role === 'bot' && msg.isCrisis && (
                                <div className="flex justify-start mt-3">
                                    <button
                                        onClick={handleSosClick}
                                        className="group relative ml-4 px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-pulse-urgent flex items-center gap-3"
                                    >
                                        <Phone className="w-6 h-6 animate-bounce" />
                                        <span>Call SOS ({sosCountdown}s)</span>
                                        <div className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover:bg-white/30 transition-all" />
                                    </button>
                                </div>
                            )}

                            {msg.role === 'bot' && msg.suggestedFeature && msg.suggestedFeature !== 'CALL' && (
                                <div className="flex justify-start mt-2">
                                    <button
                                        onClick={() => handleFeatureClick(msg.suggestedFeature)}
                                        className="px-4 py-3 ml-4 rounded-xl bg-[#8D2EF2] hover:bg-[#9d3fff] text-white text-md transition-colors"
                                    >
                                        {msg.suggestedFeature}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#1a1f2e] px-4 py-3 rounded-2xl rounded-tl-md border border-white/5 flex gap-1">
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-white/5 bg-[#0f131c]">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={disableInput}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#1a1f2e] border border-white/5 rounded-2xl px-5 py-3 focus:outline-none focus:border-[#8e74ff]/30 transition-colors text-white placeholder:text-white/30"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="w-11 h-11 rounded-2xl bg-[#8e74ff] hover:bg-[#9d84ff] text-white disabled:opacity-40 disabled:hover:bg-[#8e74ff] transition-all flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Feature Panel */}
            <div className={`
                transition-all duration-500 ease-in-out
                ${activeFeature ? 'w-[55%] opacity-100' : 'w-0 opacity-0'}
                border-l border-white/10
                bg-[#0b0f1a]
                overflow-hidden
            `}>
                {activeFeature && (
                    <FeatureRenderer
                        feature={activeFeature}
                        onClose={() => setActiveFeature(null)}
                    />
                )}
            </div>

            {/* VOICE MODE OVERLAY */}
            {isVoiceMode && (
                <div className="fixed inset-0 z-50 bg-[#0a0d14]/95 backdrop-blur-xl flex flex-col items-center justify-center">
                    <button
                        onClick={toggleVoiceMode}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>

                    <div className="flex flex-col items-center gap-12">
                        <div className="relative">
                            <div className={`
                                w-32 h-32 rounded-full blur-2xl absolute top-0 left-0
                                bg-[#8e74ff]
                                animate-pulse-slow opacity-50
                            `} />

                            <div className={`
                                relative w-32 h-32 rounded-full 
                                bg-gradient-to-br from-[#9d84ff] to-[#7d5fff]
                                shadow-[0_0_60px_rgba(142,116,255,0.4)]
                                flex items-center justify-center
                                transition-all duration-500
                                ${voiceStatus === 'listening' ? 'scale-100 animate-breathing' : ''}
                                ${voiceStatus === 'processing' ? 'scale-90 animate-spin-slow' : ''}
                                ${voiceStatus === 'speaking' ? 'scale-110 shadow-[0_0_80px_rgba(142,116,255,0.6)]' : ''}
                            `}>
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-md" />
                            </div>

                            {voiceStatus === 'speaking' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/10 rounded-full animate-ripple" />
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-medium text-white">
                                {voiceStatus === 'listening' && "Listening..."}
                                {voiceStatus === 'processing' && "Thinking..."}
                                {voiceStatus === 'speaking' && "Speaking..."}
                            </h2>
                            <p className="text-white/40 text-sm">
                                Speak naturally. I'm here to listen.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors flex items-center justify-center">
                                <StopCircle className="w-5 h-5" />
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-colors flex items-center justify-center">
                                <Volume2 className="w-5 h-5" />
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
                @keyframes pulse-urgent {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                .animate-pulse-urgent {
                    animation: pulse-urgent 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Chat;