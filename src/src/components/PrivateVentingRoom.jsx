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
    const [currentDb, setCurrentDb] = useState(0); // Added for live display
    const [avgDb, setAvgDb] = useState(0);
    const [screamCount, setScreamCount] = useState(0);
    const [showSoundReport, setShowSoundReport] = useState(false);
    const [isScreaming, setIsScreaming] = useState(false); // Visual Feedback State

    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    // Refs for safe access inside animation frame
    const dbReadingsRef = useRef([]);
    const isScreamingRef = useRef(false);
    const isRecordingRef = useRef(false);
    const maxDbRef = useRef(0); // Track max locally to avoid stale closures
    const screamDebounceRef = useRef(null); // Minimum time between scream counts
    const screamDurationRef = useRef(null); // To keep visual state active for a bit
    const lastUiUpdateRef = useRef(0); // Throttle UI updates

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

            // Ensure previous context is closed
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
            analyser.smoothingTimeConstant = 0.5; // More responsive
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            setIsRecording(true);
            isRecordingRef.current = true; // Use Ref for loop
            setDuration(0);
            setMaxDb(0);
            setCurrentDb(0);
            maxDbRef.current = 0; // Reset ref
            setScreamCount(0);
            dbReadingsRef.current = [];
            isScreamingRef.current = false;
            setIsScreaming(false);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            drawVisualizer();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = async () => {
        if (!isRecordingRef.current) return;

        isRecordingRef.current = false; // Stop loop immediately
        setIsRecording(false);
        setIsScreaming(false);

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(e => console.log(e));
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        // Calculate stats
        const readings = dbReadingsRef.current;
        const avg = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : 0;
        setAvgDb(avg);
        // Use the Ref for reliable max value
        setMaxDb(maxDbRef.current);
        setShowSoundReport(true);

        // Save to backend
        try {
            await fetch(`${API_URL}/api/venting/sound_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    duration: duration,
                    max_decibel: maxDbRef.current,
                    avg_decibel: avg,
                    scream_count: screamCount, // Use state here
                    session_type: 'sound_venting'
                })
            });
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
            if (!isRecordingRef.current) return; // Check Ref instead of State
            rafIdRef.current = requestAnimationFrame(draw);

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate Volume / Energy
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize approx 0-100 relative to 255 max
            const db = (average / 255) * 100;

            dbReadingsRef.current.push(db);

            // Track Max accurately using Ref
            if (db > maxDbRef.current) {
                maxDbRef.current = Math.round(db);
                // setMaxDb(maxDbRef.current); // Removed to avoid confusion, only update curr
            }

            // Update Live UI (Throttled ~ 100ms)
            const now = Date.now();
            if (now - lastUiUpdateRef.current > 100) {
                setCurrentDb(Math.round(db));
                lastUiUpdateRef.current = now;
            }

            // SCREAM DETECTION LOGIC
            // Threshold updated to 30 based on user feedback
            const SCREAM_THRESHOLD = 35;

            if (db > SCREAM_THRESHOLD) {
                // Trigger scream effects
                if (!isScreamingRef.current) {
                    isScreamingRef.current = true;
                    setIsScreaming(true);

                    // Haptic Feedback
                    if (navigator.vibrate) navigator.vibrate(200);

                    // Increment count only if enough time has passed since last scream (debounce)
                    // e.g., 2 seconds
                    if (!screamDebounceRef.current) {
                        setScreamCount(prev => prev + 1);
                        screamDebounceRef.current = setTimeout(() => {
                            screamDebounceRef.current = null;
                        }, 2000);
                    }
                }

                // Reset "stop screaming" timer
                if (screamDurationRef.current) clearTimeout(screamDurationRef.current);
                screamDurationRef.current = setTimeout(() => {
                    isScreamingRef.current = false;
                    setIsScreaming(false);
                }, 300); // 300ms of silence/low vol to stop effect

            }

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 1.5; // Scale up

                // Dynamic coloring
                let r, g, b;
                if (isScreamingRef.current) {
                    // Angry/Intense colors
                    r = 255; // Always red
                    g = Math.random() * 50; // Flicker black/red
                    b = Math.random() * 50;
                } else {
                    // Calm/Normal gradient
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

    return (
        <div className={`min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-100 ${isScreaming ? 'bg-[#1a0505]' : 'bg-black'}`}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/40 via-neutral-950 to-neutral-950" />

            {/* Visual Feedback Overlay (Shake & Flash) */}
            {isScreaming && (
                <div className="absolute inset-0 z-0 animate-scream-shake opacity-80 pointer-events-none">
                    <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-transparent to-transparent animate-pulse-fast" />
                </div>
            )}

            <div className="relative w-full max-w-2xl z-10 flex flex-col items-center">

                {/* Header with Mode Toggle */}
                <div className="mb-8 text-center space-y-4">
                    <h1 className={`text-4xl font-light text-white tracking-[0.2em] uppercase font-serif transition-all ${isScreaming ? 'text-red-500 scale-110 tracking-[0.3em] font-bold' : ''}`}>
                        {isScreaming ? "LET IT OUT!" : "The Void"}
                    </h1>
                    <p className="text-neutral-500 font-light">
                        {mode === 'text' ? "Release your burdens. Let them burn." : "Scream into the void. Let it out."}
                    </p>

                    <div className="flex items-center justify-center gap-4 bg-white/5 p-1 rounded-full backdrop-blur-md inline-flex">
                        <button
                            onClick={() => setMode('text')}
                            className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${mode === 'text' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Flame size={14} /> Burning</span>
                        </button>
                        <button
                            onClick={() => setMode('sound')}
                            className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${mode === 'sound' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Volume2 size={14} /> Screaming</span>
                        </button>
                    </div>
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

                    /* Sound Venting UI */
                    <div className="w-full relative">
                        <div className={`bg-[#1a1a1a] border border-white/5 rounded-xl shadow-2xl p-8 flex flex-col items-center transition-all duration-75 ${isScreaming ? 'border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : ''}`}>

                            {!showSoundReport ? (
                                <>
                                    {/* Visualizer Canvas */}
                                    <div className={`w-full h-64 bg-black/50 rounded-lg mb-8 overflow-hidden relative border transition-all duration-75 ${isScreaming ? 'border-red-500 scale-[1.02]' : 'border-white/5'}`}>
                                        <canvas
                                            ref={canvasRef}
                                            width={600}
                                            height={256}
                                            className="w-full h-full"
                                        />
                                        {!isRecording && (
                                            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                                                Press Start to calibrate microphone
                                            </div>
                                        )}
                                        {isRecording && (
                                            <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                                                <div className="text-xs font-mono text-purple-400">
                                                    {currentDb} dB | {new Date(duration * 1000).toISOString().substr(14, 5)}
                                                </div>
                                                {screamCount > 0 && (
                                                    <div className="text-xs font-bold text-red-500 animate-pulse">
                                                        SCREAMS: {screamCount}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col items-center gap-4">
                                        {!isRecording ? (
                                            <button
                                                onClick={startRecording}
                                                className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-purple-500/50 flex items-center justify-center hover:scale-110 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 group"
                                            >
                                                <Mic className="w-8 h-8 text-purple-400 group-hover:text-white" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopRecording}
                                                className={`w-20 h-20 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-all duration-100 ${isScreaming ? 'bg-red-600 border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-pulse-fast' : 'bg-red-900/20 border-red-500 animate-pulse hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'}`}
                                            >
                                                <Square className={`w-8 h-8 ${isScreaming ? 'text-white fill-white' : 'text-red-500 fill-red-500'}`} />
                                            </button>
                                        )}
                                        <p className={`text-sm tracking-wider uppercase transition-colors ${isScreaming ? 'text-red-400 font-bold animate-pulse' : 'text-neutral-500'}`}>
                                            {isRecording ? (isScreaming ? "SCREAM!" : "Listening...") : "Tap to Start Session"}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-fade-in-up text-center w-full">
                                    <Activity className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-light text-white mb-6">Session Complete</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-white/5 p-4 rounded-lg">
                                            <div className="text-3xl font-bold text-white mb-1">{duration}s</div>
                                            <div className="text-xs text-neutral-500 uppercase">Duration</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-lg">
                                            <div className="text-3xl font-bold text-purple-400 mb-1">{maxDb}</div>
                                            <div className="text-xs text-neutral-500 uppercase">Max Intensity (dB)</div>
                                        </div>
                                        {/* Scream Count UI */}
                                        <div className="bg-white/5 p-4 rounded-lg">
                                            <div className="text-3xl font-bold text-red-500 mb-1">{screamCount}</div>
                                            <div className="text-xs text-neutral-500 uppercase">Screams Released</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-lg">
                                            <div className="text-3xl font-bold text-white mb-1">{Math.round(avgDb)}</div>
                                            <div className="text-xs text-neutral-500 uppercase">Average Intensity</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowSoundReport(false)}
                                        className="px-8 py-3 bg-white text-black font-serif rounded-full hover:bg-purple-500 hover:text-white transition-all"
                                    >
                                        Start New Session
                                    </button>
                                </div>
                            )}
                        </div>
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

                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                
                /* Scream Animations */
                @keyframes vibrate {
                    0% { transform: translate(0, 0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0, 0); }
                }
                .animate-vibrate {
                    animation: vibrate 0.1s linear infinite;
                }

                @keyframes scream-shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) translateY(2px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px) translateY(-2px); }
                }
                .animate-scream-shake {
                    animation: scream-shake 0.2s linear infinite;
                }

                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 0.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div >
    );
};

export default PrivateVentingRoom;