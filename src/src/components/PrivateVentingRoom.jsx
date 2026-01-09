import React, { useState, useRef, useEffect } from 'react';
import { Flame, Mic, Volume2, Activity, Square } from 'lucide-react';

// Note: Ensure API_URL is defined or replace with your endpoint
const API_URL = 'http://localhost:5000';

const PrivateVentingRoom = () => {
    const [mode, setMode] = useState('text');
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Audio context for the fire sound
    const fireAudioCtx = useRef(null);

    // Sound Venting State
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [maxDb, setMaxDb] = useState(0);
    const [currentDb, setCurrentDb] = useState(0);
    const [screamCount, setScreamCount] = useState(0);
    const [showSoundReport, setShowSoundReport] = useState(false);
    const [isScreaming, setIsScreaming] = useState(false);

    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const rafIdRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);

    const isRecordingRef = useRef(false);
    const maxDbRef = useRef(0);
    const screamDebounceRef = useRef(null);
    const screamDurationRef = useRef(null);

    useEffect(() => {
        return () => {
            stopRecording();
            if (fireAudioCtx.current) fireAudioCtx.current.close();
        };
    }, []);

    // --- REALISTIC FIRE AUDIO ENGINE ---
    const playFireSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            fireAudioCtx.current = ctx;

            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 4;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);

            const crackleInterval = setInterval(() => {
                if (!isBurning) { clearInterval(crackleInterval); return; }
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(Math.random() * 150 + 50, ctx.currentTime);
                g.gain.setValueAtTime(0.05, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
                osc.connect(g).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.03);
            }, 60);

            noise.connect(filter).connect(gainNode).connect(ctx.destination);
            noise.start();

            setTimeout(() => {
                noise.stop();
                ctx.close();
            }, 4000);
        } catch (e) {
            console.error("Audio failed", e);
        }
    };

    const handleBurn = () => {
        if (!text.trim()) return;
        setIsBurning(true);
        playFireSound();

        setTimeout(() => {
            setText('');
            setIsBurning(false);
            setShowConfirmation(true);
            setTimeout(() => setShowConfirmation(false), 4000);
        }, 3800);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            setIsRecording(true);
            isRecordingRef.current = true;
            setDuration(0);
            maxDbRef.current = 0;
            setScreamCount(0);
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
            drawVisualizer();
        } catch (err) {
            alert("Please enable microphone access to scream into the void.");
        }
    };

    const stopRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setIsScreaming(false);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setShowSoundReport(true);
    };

    const drawVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!isRecordingRef.current) return;
            rafIdRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const db = (sum / bufferLength / 255) * 100;
            if (db > maxDbRef.current) maxDbRef.current = Math.round(db);
            setCurrentDb(Math.round(db));

            if (db > 35) {
                if (!screamDebounceRef.current) {
                    setIsScreaming(true);
                    setScreamCount(p => p + 1);
                    screamDebounceRef.current = setTimeout(() => { screamDebounceRef.current = null; }, 1000);
                }
                if (screamDurationRef.current) clearTimeout(screamDurationRef.current);
                screamDurationRef.current = setTimeout(() => setIsScreaming(false), 300);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barH = dataArray[i] * 0.8;
                ctx.fillStyle = isScreaming ? `rgb(255, ${Math.random() * 50}, 0)` : `rgb(100, 50, 255)`;
                ctx.fillRect(x, canvas.height - barH, barWidth, barH);
                x += barWidth + 1;
            }
        };
        draw();
    };

    return (
        <div className={`min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700 ${isScreaming ? 'bg-[#1a0000]' : ''}`}>

            <div className={`absolute inset-0 transition-opacity duration-1000 ${isBurning ? 'opacity-40' : 'opacity-10'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#f97316_0%,_transparent_70%)]" />
            </div>

            <div className="relative w-full max-w-2xl z-10 flex flex-col items-center">

                <div className="mb-12 flex gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                    <button onClick={() => setMode('text')} className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${mode === 'text' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Burn Burden</button>
                    <button onClick={() => setMode('sound')} className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${mode === 'sound' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Scream Void</button>
                </div>

                {mode === 'text' ? (
                    <div className="w-full max-w-lg perspective-1000 relative">
                        {/* ENHANCED ASH & FIRE PARTICLES */}
                        {isBurning && [...Array(80)].map((_, i) => {
                            const randomColor = Math.random();
                            let colorClass = "ash-gray";
                            if (randomColor > 0.5) colorClass = "ash-orange";
                            if (randomColor > 0.75) colorClass = "ash-yellow";
                            if (randomColor > 0.9) colorClass = "ash-white";

                            return (
                                <div
                                    key={i}
                                    className={`ash-particle ${colorClass}`}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        width: `${Math.random() * 6 + 2}px`,
                                        height: `${Math.random() * 6 + 2}px`,
                                        animationDuration: `${Math.random() * 1.5 + 2.5}s`
                                    }}
                                />
                            );
                        })}

                        {/* FIRE FLAMES */}
                        {isBurning && [...Array(15)].map((_, i) => (
                            <div
                                key={`flame-${i}`}
                                className="fire-flame"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    animationDuration: `${Math.random() * 0.3 + 0.4}s`
                                }}
                            />
                        ))}

                        <div className={`
                            relative min-h-[400px] bg-[#fdfbf7] rounded-sm p-10
                            transition-all duration-[3800ms] shadow-2xl overflow-visible
                            ${isBurning ? 'paper-burn-animation char-look' : 'border border-neutral-300'}
                        `}
                            style={isBurning ? {
                                maskImage: 'radial-gradient(ellipse at 50% 45%, transparent 0%, black 100%)',
                                WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, transparent 0%, black 100%)',
                                maskSize: '500% 500%',
                                maskPosition: 'center',
                                animation: 'burn-hole 3.8s forwards cubic-bezier(0.4, 0.0, 0.6, 1)'
                            } : {}}>

                            {isBurning && (
                                <>
                                    <div className="absolute inset-0 z-30 fire-edge-glow pointer-events-none" />
                                    <div className="absolute inset-0 z-20 burn-edges pointer-events-none" />
                                    <div className="absolute inset-0 z-10 smoke-effect pointer-events-none" />
                                </>
                            )}

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={isBurning}
                                className={`
                                    w-full h-[320px] bg-transparent
                                    text-neutral-800 text-xl leading-[2.5rem] font-serif resize-none outline-none
                                    transition-all duration-[2500ms]
                                    ${isBurning ? 'text-orange-700 opacity-0 blur-2xl translate-y-[-60px]' : 'placeholder:text-neutral-300'}
                                `}
                                placeholder="Write down what is hurting you... then click below to destroy it."
                                style={{ backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }}
                            />
                        </div>

                        <div className="mt-12 flex justify-center h-16">
                            {showConfirmation ? (
                                <div className="animate-fade-in text-orange-400 font-serif text-lg italic">It has been turned to ash.</div>
                            ) : (
                                <button
                                    onClick={handleBurn}
                                    disabled={!text.trim() || isBurning}
                                    className="group relative px-14 py-4 bg-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                                >
                                    <span className="relative z-10 font-bold tracking-[0.2em] text-black flex items-center gap-2">
                                        {isBurning ? 'CONSUMING...' : 'INCINERATE'} <Flame size={20} />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (

                    <div className="w-full max-w-md bg-[#151a23] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                        {/* Subtle Background Gradient for Card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

                        {!showSoundReport ? (
                            <div className="flex flex-col items-center relative z-10">
                                <canvas ref={canvasRef} width={400} height={150} className="w-full mb-8 rounded-xl bg-white/[0.02]" />

                                <div className="relative">
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                                    )}
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`
                                            relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
                                            ${isRecording
                                                ? 'bg-gradient-to-br from-red-500 to-red-600 scale-100 shadow-red-500/30'
                                                : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 shadow-indigo-500/30 hover:shadow-indigo-500/50'}
                                        `}
                                    >
                                        {isRecording ? <Square fill="white" size={24} /> : <Mic color="white" size={28} />}
                                    </button>
                                </div>

                                <div className="mt-8 text-center space-y-1">
                                    <p className={`text-sm font-bold tracking-wider transition-colors duration-300 ${isRecording ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>
                                        {isRecording ? 'LISTENING...' : 'TAP TO START'}
                                    </p>
                                    <p className="text-xs text-white/30 font-medium">
                                        {isRecording ? `${currentDb} dB` : 'Scream into the void'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center animate-fade-in relative z-10">
                                <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                    <Activity className="text-emerald-400" size={32} />
                                </div>

                                <h2 className="text-xl text-white font-semibold mb-2">Void Cleansed</h2>
                                <p className="text-sm text-white/40 mb-8">You released your tension into the abyss.</p>

                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Screams Released</p>
                                        <p className="text-2xl text-white font-bold">{screamCount}</p>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Max Intensity</p>
                                        <p className="text-2xl text-white font-bold">{maxDbRef.current} <span className="text-xs font-normal text-white/30">dB</span></p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSoundReport(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl transition-all font-medium text-sm"
                                >
                                    Start New Session
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                
                @keyframes burn-hole {
                    0% { 
                        mask-size: 500% 500%; 
                        filter: brightness(1);
                    }
                    30% {
                        mask-size: 350% 350%;
                        filter: brightness(1.2) contrast(1.1);
                    }
                    70% {
                        mask-size: 150% 150%;
                        filter: brightness(0.8) contrast(1.3);
                    }
                    100% { 
                        mask-size: 0% 0%; 
                        filter: brightness(0.3) contrast(2);
                    }
                }

                .char-look {
                    background: radial-gradient(ellipse at center, #2a1a0a 0%, #1a0f05 30%, #0a0500 60%, #000 100%) !important;
                }

                .paper-burn-animation {
                    transform: scale(0.92) rotateX(12deg) rotateY(-2deg) translateY(-15px);
                    box-shadow: 
                        0 0 80px rgba(255, 68, 0, 0.6),
                        0 0 150px rgba(255, 140, 0, 0.4),
                        inset 0 0 100px rgba(255, 68, 0, 0.3);
                }

                .fire-edge-glow {
                    box-shadow: 
                        inset 0 0 80px #ff3300, 
                        inset 0 0 40px #ffaa00,
                        0 0 40px #ff6600;
                    animation: flicker 0.08s infinite, pulse-glow 0.5s ease-in-out infinite;
                    border-radius: 2px;
                }

                .burn-edges {
                    background: radial-gradient(ellipse at 50% 45%, 
                        transparent 0%, 
                        rgba(139, 69, 19, 0.4) 35%,
                        rgba(101, 67, 33, 0.6) 45%,
                        rgba(69, 42, 19, 0.8) 55%,
                        transparent 65%
                    );
                    animation: char-spread 3.8s forwards;
                }

                .smoke-effect {
                    background: radial-gradient(ellipse at 50% 40%, 
                        rgba(40, 40, 40, 0.3) 0%, 
                        transparent 50%
                    );
                    animation: smoke-rise 3.8s forwards;
                }

                @keyframes char-spread {
                    0% { opacity: 0; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1); }
                    100% { opacity: 1; transform: scale(1.2); }
                }

                @keyframes smoke-rise {
                    0% { opacity: 0; transform: translateY(0); }
                    50% { opacity: 0.6; transform: translateY(-30px) scale(1.2); }
                    100% { opacity: 0; transform: translateY(-100px) scale(1.8); }
                }

                @keyframes pulse-glow {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.3); }
                }

                .fire-flame {
                    position: absolute;
                    bottom: 0;
                    width: 8px;
                    height: 40px;
                    background: linear-gradient(to top, #ff3300 0%, #ff6600 30%, #ffaa00 60%, transparent 100%);
                    border-radius: 50% 50% 20% 20%;
                    filter: blur(4px);
                    animation: flame-dance 0.6s ease-in-out infinite;
                    z-index: 25;
                    pointer-events: none;
                }

                @keyframes flame-dance {
                    0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); opacity: 0.9; }
                    25% { transform: translateY(-8px) scaleY(1.2) scaleX(0.9); opacity: 1; }
                    50% { transform: translateY(-4px) scaleY(0.9) scaleX(1.1); opacity: 0.95; }
                    75% { transform: translateY(-10px) scaleY(1.3) scaleX(0.8); opacity: 1; }
                }

                .ash-particle {
                    position: absolute;
                    bottom: 20%;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: ash-rise 3.5s ease-out forwards;
                    z-index: 40;
                }

                .ash-gray { 
                    background: #444; 
                    box-shadow: 0 0 3px #222;
                }
                .ash-orange { 
                    background: #ff4500; 
                    box-shadow: 0 0 12px #ff4500, 0 0 6px #ff6600;
                    animation: ash-rise 3.5s ease-out forwards, flicker 0.15s infinite;
                }
                .ash-yellow { 
                    background: #ffcc00; 
                    box-shadow: 0 0 15px #ffcc00, 0 0 8px #ffaa00;
                    animation: ash-rise 3.5s ease-out forwards, flicker 0.1s infinite;
                }
                .ash-white {
                    background: #fff8dc;
                    box-shadow: 0 0 20px #fff8dc, 0 0 10px #ffeb99;
                    animation: ash-rise 3s ease-out forwards, flicker 0.08s infinite;
                }

                @keyframes ash-rise {
                    0% { 
                        transform: translateY(0) translateX(0) rotate(0deg) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(-700px) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 100}px) rotate(${Math.random() * 1080}deg) scale(0.1); 
                        opacity: 0; 
                    }
                }

                @keyframes flicker {
                    0%, 100% { opacity: 0.7; filter: brightness(1); }
                    50% { opacity: 1; filter: brightness(1.4); }
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
};

export default PrivateVentingRoom;