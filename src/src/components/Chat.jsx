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
import PrivateVentingRoom from './PrivateVentingRoom.jsx';
import VrMeditation from './VrMeditation.jsx';
import Community from './Community.jsx';
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
            );
        case "AR Breathing":
            return (
                <Ar_breathing onClose={onClose} />
            );
        case "Sound Venting Hall":
        case "Venting Hall":
        case "Community":
            return (
                <Community onClose={onClose} />
            );
        case "Private Venting Room":
            return (
                <PrivateVentingRoom onClose={onClose} />
            );
        case "VR Meditation":
            return (
                <VrMeditation onClose={onClose} />
            );

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
    const [activeFeature, setActiveFeature] = useState(null);
    const [sosTimer, setSosTimer] = useState(null);
    const [sosCountdown, setSosCountdown] = useState(5);

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
    const sosTimerRef = useRef(null);
    const sosCountdownRef = useRef(null);

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

    const formatMessage = (content) => {
        if (!content) return '';

        // Feature list mapping
        const featureMap = {
            '1': '1/2-Minute Breathing Exercise',
            '2': 'Body Scan Meditation',
            '3': 'Mindfulness Meditation',
            '4': 'Nature Sounds',
            '5': 'Piano Relaxation',
            '6': 'Ocean Waves',
            '7': 'AR Breathing',
            '8': 'Sound Venting Hall',
            '9': 'Private Venting Room',
            '10': 'VR Meditation'
        };

        // Check if content contains a numbered feature list (with markdown bold pattern)
        const featureListRegex = /(?:^|\n)(\d+)\.\s*\*\*(.+?)\*\*:\s*(.+?)(?=\n\d+\.\s*\*\*|$)/gms;
        const matches = [...content.matchAll(featureListRegex)];
        
        if (matches.length >= 2) {
            // This looks like a feature list with markdown, render as buttons
            const textBeforeList = content.substring(0, matches[0].index).trim();
            const textAfterList = content.substring(matches[matches.length - 1].index + matches[matches.length - 1][0].length).trim();
            
            return (
                <div>
                    {textBeforeList && (
                        <div className="mb-3" dangerouslySetInnerHTML={{ __html: textBeforeList.replace(/\n/g, '<br />') }} />
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {matches.map((match) => {
                            const featureNum = match[1];
                            const featureName = match[2].trim(); // Extract name from markdown **name**
                            const mappedFeature = featureMap[featureNum] || featureName;
                            return (
                                <button
                                    key={featureNum}
                                    onClick={() => handleFeatureClick(mappedFeature)}
                                    className="px-3 py-2 rounded-lg bg-[#8D2EF2]/20 hover:bg-[#8D2EF2] text-white text-sm transition-all border border-[#8D2EF2]/30 text-left group"
                                >
                                    <div className="font-semibold">{featureName}</div>
                                    <div className="text-xs text-white/60 mt-1 line-clamp-2 group-hover:text-white/80">{match[3].trim()}</div>
                                </button>
                            );
                        })}
                    </div>
                    {textAfterList && (
                        <div className="mt-3" dangerouslySetInnerHTML={{ __html: textAfterList.replace(/\n/g, '<br />') }} />
                    )}
                </div>
            );
        }

        // Regular message formatting (no feature list)
        // 1. Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formatted = content.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">${url}</a>`;
        });

        // 2. Bold keywords
        const keywords = ['important', 'urgent', 'crisis', 'emergency', 'help', 'concerned', 'safety'];
        keywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            formatted = formatted.replace(regex, (match) => `<strong class="text-white font-bold">${match}</strong>`);
        });

        // 3. Newlines to breaks
        formatted = formatted.replace(/\n/g, '<br />');

        return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // IMMEDIATE HEURISTIC CHECK
        const userMessage = input.trim();
        const isCrisisDetected = detectCrisisHeuristic(userMessage);

        const userMsg = { role: 'user', content: userMessage };
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
            startSosTimer();
            setInput('');
            setIsLoading(false);
            return;
        }

        setInput('');
        setIsLoading(true);

        try {
            let data;

            // Try FastAPI first
            try {
                const res = await fetch('http://localhost:8000/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_message: userMessage
                    }),
                    signal: AbortSignal.timeout(5000) // 5s timeout
                });
                data = await res.json();
                console.log('FastAPI Response:', data);
            } catch (fastApiError) {
                // Fallback to Flask
                console.log('FastAPI unavailable, falling back to Flask');
                const res = await fetch('http://localhost:2323/api/chatbot/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: userMessage
                    })
                });
                const flaskData = await res.json();
                // Convert Flask response format to FastAPI format
                data = {
                    reply: flaskData.bot_message,
                    self_harm_crisis: flaskData.crisis_detected ? 'true' : 'false',
                    suggested_feature: flaskData.assessment_suggestion ? flaskData.assessment_suggestion.suggested_assessment : null
                };
                console.log('Flask Response:', data);
            }

            // FIXED: Parse the reply properly with robust error handling
            let replyContent = '';
            let suggestedFeature = data.suggested_feature || null;

            if (typeof data.reply === 'string') {
                const reply = data.reply.trim();

                // Helper to extract JSON from text even if surrounded by other characters
                const extractJson = (text) => {
                    try {
                        const start = text.indexOf('{');
                        const end = text.lastIndexOf('}');
                        if (start !== -1 && end !== -1) {
                            return JSON.parse(text.substring(start, end + 1));
                        }
                    } catch (e) {
                        console.error('JSON Extraction failed:', e);
                    }
                    return null;
                };

                const parsed = extractJson(reply);
                if (parsed && (parsed.response || parsed.bot_message)) {
                    replyContent = parsed.response || parsed.bot_message;
                    suggestedFeature = parsed.suggested_feature || null;
                } else {
                    // Fallback: If not JSON or no response field, use raw text but CLEAN IT
                    // Remove common intent markers if they leaked
                    replyContent = reply
                        .replace(/\{.*\}/s, '') // Remove everything inside curly braces
                        .replace(/intent_analysis.*/si, '')
                        .replace(/intent:.*/si, '')
                        .replace(/emotional_state:.*/si, '')
                        .replace(/suggested_feature:.*/si, '')
                        .replace(/```json|```/g, '')
                        .trim();

                    // If after cleaning it's empty, use original but avoid showing json
                    if (!replyContent) replyContent = reply.split('\n')[0];
                }
            } else {
                replyContent = String(data.reply);
            }

            const isCrisis = data.self_harm_crisis === "true";

            // If crisis, override suggested feature
            if (isCrisis) {
                suggestedFeature = "CALL";
            }

            const botMsg = {
                role: 'bot',
                content: replyContent,
                suggestedFeature: suggestedFeature,
                isCrisis: isCrisis
            };

            console.log('Bot Message:', botMsg);
            setMessages(prev => [...prev, botMsg]);

            // Start SOS timer if crisis detected
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
            navigate('/app/ar_breathing');
        }, 5000);
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

        // Handle SOS action
        window.location.href = 'tel:988';
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
                    try { recognition.start(); } catch (e) { }
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

        // Use existing handleSend logic but with voice input
        const userMessage = text.trim();
        const isCrisisDetected = detectCrisisHeuristic(userMessage);

        const userMsg = { role: 'user', content: userMessage };
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
            startSosTimer();
            return;
        }

        try {
            let data;

            // Try FastAPI first
            try {
                const res = await fetch('http://localhost:8000/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_message: userMessage
                    }),
                    signal: AbortSignal.timeout(5000) // 5s timeout
                });
                data = await res.json();
            } catch (fastApiError) {
                // Fallback to Flask
                console.log('Voice: FastAPI unavailable, falling back to Flask');
                const res = await fetch('http://localhost:2323/api/chatbot/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: userMessage
                    })
                });
                const flaskData = await res.json();
                // Convert Flask response format to FastAPI format
                data = {
                    reply: flaskData.bot_message,
                    self_harm_crisis: flaskData.crisis_detected ? 'true' : 'false',
                    suggested_feature: flaskData.assessment_suggestion ? flaskData.assessment_suggestion.suggested_assessment : null
                };
            }

            let replyContent = '';
            let suggestedFeature = data.suggested_feature || null;

            if (typeof data.reply === 'string') {
                const reply = data.reply.trim();

                const extractJson = (text) => {
                    try {
                        const start = text.indexOf('{');
                        const end = text.lastIndexOf('}');
                        if (start !== -1 && end !== -1) {
                            return JSON.parse(text.substring(start, end + 1));
                        }
                    } catch (e) { }
                    return null;
                };

                const parsed = extractJson(reply);
                if (parsed && (parsed.response || parsed.bot_message)) {
                    replyContent = parsed.response || parsed.bot_message;
                    suggestedFeature = parsed.suggested_feature || null;
                } else {
                    replyContent = reply
                        .replace(/\{.*\}/s, '')
                        .replace(/intent_analysis.*/si, '')
                        .replace(/```json|```/g, '')
                        .trim();
                    if (!replyContent) replyContent = reply.split('\n')[0];
                }
            } else {
                replyContent = String(data.reply);
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
                    } catch (e) {
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
        }, 8000);
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
                                        : ' text-white '}
                                `}>
                                    {formatMessage(msg.content)}
                                </div>
                            </div>

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