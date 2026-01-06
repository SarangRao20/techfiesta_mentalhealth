import React, { useState, useRef, useEffect } from 'react';
import { Flame, Send, X, AlertCircle, Mic, Volume2, Activity, Play, Square } from 'lucide-react';
import { API_URL } from '../config';

const encouragementMessages = {
    whisper: [
        "💭 Sometimes the quietest voices carry the deepest pain. That's okay.",
        "🤫 Even whispers matter. Your feelings are valid.",
        "🌱 Small releases can grow into big healing."
    ],
    normal: [
        "😊 You're finding your voice. Keep going.",
        "💪 Normal is perfectly fine. Express yourself however feels right.",
        "🌟 You're doing great - no need to force anything."
    ],
    loud: [
        "😤 Yes! Let those feelings out! You're doing amazing!",
        "🔥 Feel that energy! It's okay to be loud about your emotions!",
        "💥 Your voice deserves to be heard - keep going!"
    ],
    shout: [
        "😡 THAT'S IT! Shout it all out! You're being so brave!",
        "🎯 You're releasing so much tension - this is healthy!",
        "⚡ Feel that power in your voice! Let it ALL out!"
    ],
    scream: [
        "🤬 YES! SCREAM IT ALL OUT! You're incredibly strong!",
        "🌪️ Feel that release! You're letting go of so much pain!",
        "🚀 AMAZING! You're transforming pain into power!"
    ]
};

const PrivateVentingRoom = () => {
    // Mode State: 'text' or 'sound'
    const [mode, setMode] = useState('text');

    // Text Venting State
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Sound Venting State
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [maxDb, setMaxDb] = useState(0);
    const [currentDb, setCurrentDb] = useState(0);
    const [avgDb, setAvgDb] = useState(0);
    const [screamCount, setScreamCount] = useState(0);
    const [showSoundReport, setShowSoundReport] = useState(false);
    const [isScreaming, setIsScreaming] = useState(false);
    const [encouragement, setEncouragement] = useState("💪 It's okay to let it all out. You're in a safe space here.");
    const [currentLevel, setCurrentLevel] = useState('whisper');

    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const dbReadingsRef = useRef([]);
    const isScreamingRef = useRef(false);
    const isRecordingRef = useRef(false);
    const maxDbRef = useRef(0);
    const screamDebounceRef = useRef(null);
    const screamDurationRef = useRef(null);
    const lastUiUpdateRef = useRef(0);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    const logActivity = async (action, metadata = {}) => {
        try {
            await fetch(`${API_URL}/api/activity/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    activity_type: 'venting',
                    action: action,
                    extra_data: metadata
                })
            });
        } catch (e) {
            console.error("Logging failed", e);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => { });
            }

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            setIsRecording(true);
            isRecordingRef.current = true;
            setDuration(0);
            setMaxDb(0);
            setCurrentDb(0);
            maxDbRef.current = 0;
            setScreamCount(0);
            dbReadingsRef.current = [];
            isScreamingRef.current = false;
            setIsScreaming(false);
            setEncouragement("Listening... Feel free to release your voice.");

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            drawVisualizer();
            logActivity('sound_venting_start');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = async () => {
        if (!isRecordingRef.current) return;

        isRecordingRef.current = false;
        setIsRecording(false);
        setIsScreaming(false);

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(e => console.log(e));
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        const readings = dbReadingsRef.current;
        const avg = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : 0;
        setAvgDb(avg);
        setMaxDb(maxDbRef.current);
        setShowSoundReport(true);

        try {
            await fetch(`${API_URL}/api/venting/sound_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    duration: duration,
                    max_decibel: maxDbRef.current,
                    avg_decibel: avg,
                    scream_count: screamCount,
                    session_type: 'sound_venting'
                })
            });
            logActivity('sound_venting_complete', { duration, max_db: maxDbRef.current, screams: screamCount });
        } catch (e) {
            console.error("Failed to save sound session", e);
        }
    };

    const drawVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            if (!isRecordingRef.current) return;
            rafIdRef.current = requestAnimationFrame(draw);

            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const db = (average / 255) * 100;

            dbReadingsRef.current.push(db);

            if (db > maxDbRef.current) {
                maxDbRef.current = Math.round(db);
            }

            const now = Date.now();
            if (now - lastUiUpdateRef.current > 150) {
                setCurrentDb(Math.round(db));
                updateIntensity(db);
                lastUiUpdateRef.current = now;
            }

            const SCREAM_THRESHOLD = 35;

            if (db > SCREAM_THRESHOLD) {
                if (!isScreamingRef.current) {
                    isScreamingRef.current = true;
                    setIsScreaming(true);
                    if (navigator.vibrate) navigator.vibrate(200);
                    if (!screamDebounceRef.current) {
                        setScreamCount(prev => prev + 1);
                        screamDebounceRef.current = setTimeout(() => {
                            screamDebounceRef.current = null;
                        }, 2000);
                    }
                }
                if (screamDurationRef.current) clearTimeout(screamDurationRef.current);
                screamDurationRef.current = setTimeout(() => {
                    isScreamingRef.current = false;
                    setIsScreaming(false);
                }, 300);
            }

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 1.5;
                let r, g, b;
                if (isScreamingRef.current) {
                    r = 255; g = Math.random() * 50; b = Math.random() * 50;
                } else {
                    r = barHeight + (25 * (i / bufferLength));
                    g = 250 * (i / bufferLength);
                    b = 50;
                }
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    };

    const updateIntensity = (db) => {
        let level = 'whisper';
        if (db < 30) level = 'whisper';
        else if (db < 50) level = 'normal';
        else if (db < 70) level = 'loud';
        else if (db < 90) level = 'shout';
        else level = 'scream';

        if (level !== currentLevel) {
            setCurrentLevel(level);
            const msgs = encouragementMessages[level];
            setEncouragement(msgs[Math.floor(Math.random() * msgs.length)]);
        }
    };

    const handleBurn = () => {
        if (!text.trim()) return;
        setIsBurning(true);
        logActivity('text_burning_complete', { length: text.length });
        setTimeout(() => {
            setText('');
            setIsBurning(false);
            setShowConfirmation(true);
            setTimeout(() => setShowConfirmation(false), 4000);
        }, 3000);
    };

    return (
        <div className={`min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-100 ${isScreaming ? 'bg-[#1a0505]' : 'bg-black'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/40 via-neutral-950 to-neutral-950" />

            {isScreaming && (
                <div className="absolute inset-0 z-0 animate-scream-shake opacity-80 pointer-events-none">
                    <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-transparent to-transparent animate-pulse-fast" />
                </div>
            )}

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/2 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] animate-pulse ${isScreaming ? 'bg-red-600/30 scale-150 duration-75' : ''}`} />
                <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] ${isScreaming ? 'bg-red-800/30 scale-125 duration-100' : ''}`} />
            </div>

            <div className={`relative w-full max-w-4xl z-10 flex flex-col items-center ${isScreaming ? 'animate-vibrate' : ''}`}>

                <div className="mb-8 text-center space-y-4">
                    <h1 className={`text-4xl font-light text-white tracking-[0.2em] uppercase font-serif transition-all ${isScreaming ? 'text-red-500 scale-110 tracking-[0.3em] font-bold' : ''}`}>
                        {isScreaming ? "LET IT OUT!" : "The Void"}
                    </h1>
                    <p className="text-neutral-500 font-light max-w-lg mx-auto">
                        {mode === 'text' ? "Release your burdens. Type them down and watch them incinerate into the digital abyss." : "A safe, private space to release built-up tension by screaming, shouting, or whispering."}
                    </p>

                    <div className="flex items-center justify-center gap-4 bg-white/5 p-1.5 rounded-full backdrop-blur-md inline-flex border border-white/10">
                        <button
                            onClick={() => { setMode('text'); setShowSoundReport(false); }}
                            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${mode === 'text' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <Flame size={16} /> Burning
                        </button>
                        <button
                            onClick={() => { setMode('sound'); setShowSoundReport(false); }}
                            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${mode === 'sound' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <Volume2 size={16} /> Screaming
                        </button>
                    </div>
                </div>

                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {mode === 'text' ? (
                            <div className="relative w-full group">
                                <div className={`absolute -inset-1 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 blur-xl transition-opacity duration-1000 ${isBurning ? 'opacity-100' : 'opacity-0'}`} />
                                <div className={`relative bg-[#1a1a1a] border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-[2000ms] ease-in-out ${isBurning ? 'scale-90 opacity-0 translate-y-[-50px] rotate-3 brightness-150' : 'hover:border-white/10'}`}>
                                    {isBurning && (
                                        <div className="absolute inset-0 z-50 bg-gradient-to-t from-orange-600/20 via-transparent to-transparent flex items-end justify-center">
                                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-500/40 via-red-900/20 to-transparent animate-pulse" />
                                        </div>
                                    )}
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        disabled={isBurning}
                                        className={`w-full h-[350px] bg-[#0a0a0a]/50 p-8 text-neutral-300 text-lg leading-relaxed font-serif resize-none outline-none placeholder:text-neutral-700 transition-colors duration-500 ${isBurning ? 'text-orange-200/50' : ''}`}
                                        placeholder="Type here. Your words are private and ephemeral.&#10;They exists only for a moment, then vanish forever."
                                    />
                                    <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-between items-center text-xs text-neutral-600 uppercase tracking-widest">
                                        <span>{text.length} characters releasing</span>
                                        <Flame size={14} className={text.length > 0 ? "text-orange-600" : "text-neutral-800"} />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-center">
                                    {showConfirmation ? (
                                        <div className="animate-fade-in-up text-emerald-400 flex items-center gap-2 font-serif bg-emerald-950/30 px-8 py-3 rounded-full border border-emerald-500/20 shadow-lg">
                                            <Activity size={16} /> Your burden has been released. 🌬️
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBurn}
                                            disabled={!text.trim() || isBurning}
                                            className={`group flex items-center gap-3 px-10 py-4 rounded-full font-serif tracking-widest uppercase text-sm transition-all duration-500 ${!text.trim() ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800' : 'bg-white text-black hover:bg-orange-500 hover:text-white hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]'}`}
                                        >
                                            {isBurning ? 'Incinerating...' : 'Cast into Void'}
                                            {!isBurning && <Send size={16} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full relative">
                                <div className={`bg-[#1a1a1a] border border-white/5 rounded-2xl shadow-2xl p-8 flex flex-col items-center transition-all duration-75 min-h-[450px] justify-center ${isScreaming ? 'border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]' : ''}`}>
                                    {!showSoundReport ? (
                                        <>
                                            <div className={`w-full h-56 bg-black/50 rounded-xl mb-8 overflow-hidden relative border transition-all duration-75 ${isScreaming ? 'border-red-500/50 scale-[1.01]' : 'border-white/5'}`}>
                                                <canvas ref={canvasRef} width={600} height={256} className="w-full h-full" />
                                                {!isRecording && <div className="absolute inset-0 flex items-center justify-center text-neutral-500 font-light">Microphone ready. Ready to let it out?</div>}
                                                {isRecording && (
                                                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                                        <div className="px-3 py-1 bg-black/60 rounded-full border border-white/10 text-xs font-mono text-purple-400 backdrop-blur-md">
                                                            {currentDb} dB | {new Date(duration * 1000).toISOString().substr(14, 5)}
                                                        </div>
                                                        {screamCount > 0 && <div className="px-3 py-1 bg-red-950/40 rounded-full border border-red-500/30 text-xs font-bold text-red-500 animate-pulse">SCREAMS: {screamCount}</div>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-center gap-6">
                                                {!isRecording ? (
                                                    <button onClick={startRecording} className="w-24 h-24 rounded-full bg-neutral-800 border border-purple-500/30 flex items-center justify-center hover:scale-110 hover:border-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all duration-500 group">
                                                        <Mic className="w-10 h-10 text-purple-400 group-hover:text-white" />
                                                    </button>
                                                ) : (
                                                    <button onClick={stopRecording} className={`w-24 h-24 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-all duration-100 ${isScreaming ? 'bg-red-600 border-red-400 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'bg-red-900/20 border-red-500 animate-pulse'}`}>
                                                        <Square className={`w-10 h-10 ${isScreaming ? 'text-white' : 'text-red-500 fill-red-500'}`} />
                                                    </button>
                                                )}
                                                <div className="text-center">
                                                    <p className={`text-lg font-serif transition-colors italic ${isScreaming ? 'text-red-400' : 'text-neutral-400'}`}>
                                                        {encouragement}
                                                    </p>
                                                    <p className="text-xs uppercase tracking-widest text-neutral-600 mt-2">{isRecording ? "Double tap to finish" : "Press to begin session"}</p>
                                                </div>

                                                <div className="flex gap-2 mt-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                                                    {['whisper', 'normal', 'loud', 'shout', 'scream'].map(lvl => (
                                                        <div key={lvl} className={`w-8 h-1.5 rounded-full transition-all duration-300 ${currentLevel === lvl ? (lvl === 'scream' ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-purple-500') : 'bg-neutral-800'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="animate-fade-in-up text-center w-full py-8">
                                            <div className="w-20 h-20 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20 text-purple-400">
                                                <Activity size={32} />
                                            </div>
                                            <h3 className="text-2xl font-serif text-white mb-8">Emotional Release Summary</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-white mb-1">{duration}s</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Time</div>
                                                </div>
                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-purple-400 mb-1">{maxDb}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Peak Intensity</div>
                                                </div>
                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-red-500 mb-1">{screamCount}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Screams</div>
                                                </div>
                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                    <div className="text-2xl font-bold text-white mb-1">{Math.round(avgDb)}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Avg dB</div>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowSoundReport(false)} className="px-12 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all shadow-xl shadow-white/5">New Release</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-xl">
                            <h4 className="text-white font-serif mb-4 flex items-center gap-2"><div className="w-1 h-3 bg-orange-600 rounded-full" /> Safe Space Guidelines</h4>
                            <ul className="text-sm text-neutral-400 space-y-4 font-light">
                                <li className="flex gap-3"><span className="text-orange-500/60 font-mono">01</span> No data is stored permanently. Everything is ephemeral.</li>
                                <li className="flex gap-3"><span className="text-orange-500/60 font-mono">02</span> Express anger, grief, or frustration without judgment.</li>
                                <li className="flex gap-3"><span className="text-orange-500/60 font-mono">03</span> This is a tool for catharsis, not a replacement for therapy.</li>
                            </ul>
                        </div>

                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-xl">
                            <h4 className="text-white font-serif mb-4 flex items-center gap-2"><div className="w-1 h-3 bg-teal-500 rounded-full" /> After-Venting Tips</h4>
                            <div className="space-y-4">
                                <a href="/app/ar-breathing" className="block group p-3 bg-white/5 rounded-xl border border-white/5 hover:border-teal-500/30 transition-all">
                                    <div className="text-xs text-neutral-400 mb-1 group-hover:text-teal-400 transition-colors">Breathe</div>
                                    <div className="text-sm text-neutral-200">Start a 2-min AR Breathing session to ground yourself.</div>
                                </a>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-xs text-neutral-400 mb-1">Self-Care</div>
                                    <div className="text-sm text-neutral-200">Drink warm water and rest your vocal cords for 10 minutes.</div>
                                </div>
                                <a href="/app/consultation" className="block group p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
                                    <div className="text-xs text-neutral-400 mb-1 group-hover:text-blue-400 transition-colors">Support</div>
                                    <div className="text-sm text-neutral-200">If you feel overwhelmed, connect with a counselor.</div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                @keyframes vibrate { 0% { transform: translate(0, 0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0, 0); } }
                .animate-vibrate { animation: vibrate 0.1s linear infinite; }
                @keyframes scream-shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) translateY(2px); } 20%, 40%, 60%, 80% { transform: translateX(5px) translateY(-2px); } }
                .animate-scream-shake { animation: scream-shake 0.2s linear infinite; }
                @keyframes pulse-fast { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
                .animate-pulse-fast { animation: pulse-fast 0.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
};

export default PrivateVentingRoom;
