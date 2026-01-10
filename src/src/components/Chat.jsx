import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, X, Sparkles, Volume2, StopCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BreathingExercise from './Features/BreathingExercise.jsx';
import BodyScanMeditation from './Features/BodyScanMeditation.jsx';
import MindfulnessMeditation from './Features/MindfulnessMeditation.jsx';
import NatureSounds from './Features/NatureSounds.jsx';
import OceanWaves from './Features/OceanWaves.jsx';
import PianoRelaxation from './Features/PianoRelaxation.jsx';
import Ar_breathing from './Features/Ar_breathing.jsx';
import VrMeditation from './Features/VrMeditation.jsx';
import TextVenting from './Features/TextVenting.jsx';
import SoundVenting from './Features/SoundVenting.jsx';
import { calculateConfidenceScore } from './score_calculator.js';
import { API_URL } from '../config.js';
import { LucideSpeech } from 'lucide-react';
const FeatureRenderer = ({ feature, onClose }) => {
    switch (feature) {
        case "1/2-Minute Breathing Exercise":
            return <BreathingExercise onClose={onClose} />;
        case "Body Scan Meditation":
            return <BodyScanMeditation onClose={onClose} />;
        case "Mindfulness Meditation":
            return <MindfulnessMeditation onClose={onClose} />;
        case "Nature Sounds":
            return <NatureSounds onClose={onClose} />;
        case "Ocean Waves":
            return <OceanWaves onClose={onClose} />;
        case "Piano Relaxation":
            return <PianoRelaxation onClose={onClose} />;
        case "AR Breathing":
            return <Ar_breathing onClose={onClose} />;
        case "Text Venting":
            return <TextVenting onClose={onClose} />;
        case "Sound Venting":
            return <SoundVenting onClose={onClose} />;
        case "Sound Venting Hall":
            return <SoundVenting onClose={onClose} />;
        case "VR Meditation":
            return <VrMeditation onClose={onClose} />;
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
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [speechText, setSpeechText] = useState(null);

    const [activeFeature, setActiveFeature] = useState(null);
    const [sosTimer, setSosTimer] = useState(null);
    const [sosCountdown, setSosCountdown] = useState(5);

    // Voice Mode State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');

    // Voice Refs
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const silenceTimerRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const isVoiceModeRef = useRef(false);

    const messagesEndRef = useRef(null);
    const sosTimerRef = useRef(null);
    const sosCountdownRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const SpeakOut = () => { }
    useEffect(() => {
        isVoiceModeRef.current = isVoiceMode;
    }, [isVoiceMode]);

    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
            if (sosCountdownRef.current) clearInterval(sosCountdownRef.current);
        };
    }, []);

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
            'planning to die', 'take my life', 'commit suicide',
            'jeevan khatam', 'zindagi khatam', 'mar jaun', 'marna chahta',
            'marna chahti', 'khudkushi', 'suicide kar', 'khatam kar',
            'jaan de', 'jaan lelu', 'jee ke kya faida', 'jeene ka mann nahi',
            'mar jaana chahta', 'khud ko maar'
        ];
        return crisisKeywords.some(keyword => lowerMsg.includes(keyword));
    };

    const formatMessage = (content) => {
        if (!content) return '';
        return <span className="whitespace-pre-wrap">{content}</span>;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        const isCrisisDetected = detectCrisisHeuristic(userMessage);

        const userMsg = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, userMsg]);

        if (isCrisisDetected) {
            const crisisMsg = {
                role: 'bot',
                content: "I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to someone who can help immediately.",
                suggestedFeature: "CALL",
                isCrisis: true
            };
            setMessages(prev => [...prev, crisisMsg]);
            startSosTimer();
            setInput('');
            setIsLoading(false);
            return;
        }

        setInput('');
        setIsLoading(true);
        const beforeMood = localStorage.getItem("mood");
        try {
            const res = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    session_id: null
                }),
                credentials: 'include'

            });

            const data = await res.json();
            console.log('API Response:', data);

            // Parse the reply field (it's a stringified dict)
            let replyContent = '';
            let suggestedFeature = null;

            // SAFELY extract fields from Python-dict-like string
            if (typeof data === 'string') {
                const matchResponse = data.reply.match(
                    /'response':\s*"([\s\S]*?)",\s*'suggested_feature'/
                );

                const matchFeature = data.reply.match(
                    /'suggested_feature':\s*'([^']*)'/
                );

                replyContent = matchResponse ? matchResponse[1] : data;
                console.log(replyContent)
                if (replyContent) {
                    console.log("yes")
                }
                if (!replyContent) {
                    console.log("nah")
                }
                suggestedFeature = matchFeature ? matchFeature[1] : null;
            } else if (typeof data === 'object' && data !== null) {
                // future-proof: if backend sends real JSON later
                replyContent = data.response || '';
                suggestedFeature = data.suggested_feature || null;
            }

            let intentData = null;

            if (typeof data.intent_json === 'string') {
                try {
                    intentData = JSON.parse(data.intent_json);
                } catch (e) {
                    console.error('Failed to parse intent_json:', e);
                }
            }
            console.log('Parsed intent data:', intentData);

            if (intentData) {
                const get = localStorage.getItem("intent_data")
                const array = get ? JSON.parse(intentData) : []

                array.push(
                    {
                        ...intentData,
                        timestamp: Date.now(),
                        confidence_score: calculateConfidenceScore(intentData)
                    }
                );

                localStorage.setItem('intent_history', JSON.stringify(array));
            }
            const isCrisis = data.self_harm_crisis === "true";

            if (isCrisis) {
                suggestedFeature = "CALL";
            }
            console.log(replyContent)
            console.log(suggestedFeature)
            console.log(isCrisis)
            const botMsg = {
                role: 'bot',
                content: replyContent,
                suggestedFeature: suggestedFeature,
                isCrisis: isCrisis
            };

            setMessages(prev => [...prev, botMsg]);

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
        setSosCountdown(5);

        if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
        if (sosCountdownRef.current) clearInterval(sosCountdownRef.current);

        let count = 5;
        sosCountdownRef.current = setInterval(() => {
            count -= 1;
            setSosCountdown(count);
            if (count <= 0) {
                clearInterval(sosCountdownRef.current);
            }
        }, 1000);

        sosTimerRef.current = setTimeout(() => {
            navigate('/app/ar-breathing');
        }, 5000);
    };

    const handleSosClick = () => {
        if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
        if (sosCountdownRef.current) clearInterval(sosCountdownRef.current);
        setSosCountdown(5);
        window.location.href = 'tel:988';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const setupSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return null;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('Voice recognition started');
            setVoiceStatus('listening');
        };

        recognition.onresult = (event) => {
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
                if (!isSpeakingRef.current) resetSilenceTimer();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            if (isVoiceModeRef.current && !isSpeakingRef.current) {
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, 1000);
            }
        };

        recognition.onend = () => {
            console.log('Voice recognition ended');
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
        if (isSpeakingRef.current) return;

        setVoiceStatus('processing');
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const userMessage = text.trim();
        const isCrisisDetected = detectCrisisHeuristic(userMessage);

        const userMsg = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, userMsg]);

        if (isCrisisDetected) {
            const crisisMsg = {
                role: 'bot',
                content: "I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to someone who can help immediately.",
                suggestedFeature: "CALL",
                isCrisis: true
            };
            setMessages(prev => [...prev, crisisMsg]);
            startSosTimer();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    session_id: null
                }),
                credentials: 'include'

            });

            const data = await res.json();
            console.log(data)
            let replyContent = '';
            let suggestedFeature = null;

            // SAFELY extract fields from Python-dict-like string
            if (typeof data.reply === 'string') {
                const matchResponse = data.reply.match(
                    /'response':\s*"([\s\S]*?)",\s*'suggested_feature'/
                );

                const matchFeature = data.reply.match(
                    /'suggested_feature':\s*'([^']*)'/
                );

                replyContent = matchResponse ? matchResponse[1] : data;
                suggestedFeature = matchFeature ? matchFeature[1] : null;
            } else if (typeof data === 'object' && data !== null) {
                // future-proof: if backend sends real JSON later
                replyContent = data.response || '';
                suggestedFeature = data.suggested_feature || null;
            }


            const isCrisis = data.self_harm_crisis === "true";

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

            if (isCrisis) {
                startSosTimer();
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "I'm having trouble connecting right now."
            }]);
        }
    };

    const speakResponse = (text) => {
        if (!text) return;

        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        isSpeakingRef.current = true;
        setVoiceStatus('speaking');

        const cleanText = text.replace(/[*#`]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('India') || v.name.includes('Female'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            setVoiceStatus('speaking');
            isSpeakingRef.current = true;
        };

        utterance.onend = () => {
            setTimeout(() => {
                isSpeakingRef.current = false;
                setVoiceStatus('listening');
                setTranscript('');

                const featureBtn = document.getElementById('feature-cta');
                if (featureBtn) {
                    featureBtn.click();
                }

                if (isVoiceModeRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) { }
                }
            }, 300);
        };

        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setVoiceStatus('listening');
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (isVoiceMode) {
            if (!recognitionRef.current) {
                recognitionRef.current = setupSpeechRecognition();
            }
            try {
                recognitionRef.current?.start();
            } catch (e) { console.log('Already started'); }
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            window.speechSynthesis.cancel();
            setVoiceStatus('idle');
            setTranscript('');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            window.speechSynthesis.cancel();
        };
    }, [isVoiceMode]);

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
        silenceTimerRef.current = setTimeout(() => { }, 8000);
    };

    const toggleVoiceMode = () => {
        setIsVoiceMode(prev => !prev);
    };

    const handleFeatureClick = (feature) => {
        console.log('Feature clicked:', feature);
        setActiveFeature(feature);
    };

    return (
        <div className="flex h-screen bg-[#0f131c] text-white relative overflow-hidden">
            <div className={`flex flex-col transition-all duration-500 ${activeFeature ? 'w-[45%]' : 'w-full'}`}>
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

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="space-y-3">
                            {/* Message bubble */}
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                max-w-[75%] px-4 py-3 rounded-2xl
                                ${msg.role === 'user'
                                        ? 'bg-[#8e74ff] text-white rounded-tr-md'
                                        : 'text-white'}
                            `}>
                                    {msg.content}
                                    {msg.role === 'bot' && (
                                        <div onClick={() => speakResponse(msg.content)} className={` 
                                        ${msg.suggested_feature ? 'relative left-40 top-5' : ' '}
                                         mt-2 justify-start cursor-pointer`}>
                                            <LucideSpeech />
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Crisis CTA */}
                            {msg.role === 'bot' && msg.isCrisis && (
                                <div className="flex justify-start mt-3">
                                    <button
                                        onClick={handleSosClick}
                                        className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-pulse-urgent flex items-center gap-3"
                                    >
                                        <Phone className="w-6 h-6 animate-bounce" />
                                        <span>Call SOS ({sosCountdown}s)</span>
                                        <div className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover:bg-white/30 transition-all" />
                                    </button>
                                </div>
                            )}

                            {/* Feature CTA */}
                            {msg.role === 'bot' && msg.suggestedFeature && msg.suggestedFeature !== 'CALL' && (
                                <div className="flex justify-start">
                                    <button
                                        onClick={() => handleFeatureClick(msg.suggestedFeature)}
                                        className="px-4 py-3 ml-3 rounded-xl bg-[#8D2EF2] hover:bg-[#9d3fff] text-white text-sm font-medium transition-colors"
                                        id="feature-cta"
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

                <div className="px-4 py-4 pr-20 border-t border-white/5 bg-[#0f131c]">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#1a1f2e] border border-white/5 rounded-2xl px-5 py-3 focus:outline-none focus:border-[#8e74ff]/30 transition-colors text-white placeholder:text-white/30"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="w-11 h-11 rounded-2xl bg-[#8e74ff] hover:bg-[#9d84ff] text-white disabled:opacity-40 transition-all flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

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

            {isVoiceMode && (
                <div className={` flex flex-col items-center justify-center fixed inset-0 z-50 bg-[#0a0d14]/95 
                backdrop-blur-xl 
                 ${activeFeature ? 'w-[55%]' : 'w-full'}`}>
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
                                {voiceStatus === 'idle' && "Ready"}
                            </h2>
                            <p className="text-white/40 text-sm max-w-md">
                                {transcript || "Speak naturally. I'm here to listen."}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={toggleVoiceMode}
                                className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors flex items-center justify-center"
                            >
                                <StopCircle className="w-5 h-5" />
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