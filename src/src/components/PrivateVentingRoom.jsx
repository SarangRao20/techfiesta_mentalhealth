import React, { useState, useRef, useEffect } from 'react';
import { Flame, Send, X, AlertCircle, Mic, Volume2, Activity, Play, Square } from 'lucide-react';
import { API_URL } from '../config';

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
    const [avgDb, setAvgDb] = useState(0);
    const [screamCount, setScreamCount] = useState(0);
    const [showSoundReport, setShowSoundReport] = useState(false);

    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const dbReadingsRef = useRef([]);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

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
            sourceRef.current = source;

            setIsRecording(true);
            setDuration(0);
            setMaxDb(0);
            setScreamCount(0);
            dbReadingsRef.current = [];

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
        if (!isRecording) return;

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        setIsRecording(false);

        // Calculate stats
        const readings = dbReadingsRef.current;
        const avg = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : 0;
        setAvgDb(avg);
        setShowSoundReport(true);

        // Save to backend
        try {
            await fetch(`${API_URL}/api/venting/sound_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    duration: duration,
                    max_decibel: maxDb,
                    avg_decibel: avg,
                    scream_count: screamCount,
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
            if (!isRecording) return;
            rafIdRef.current = requestAnimationFrame(draw);

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate dB (approximate)
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const db = (average / 255) * 100; // Normalized 0-100

            dbReadingsRef.current.push(db);
            if (db > maxDb) setMaxDb(Math.round(db));

            // Detect "Scream" (threshold > 80% volume) if needed
            if (db > 80) {
                // Simple debounce could be added here
            }

            ctx.clearRect(0, 0, width, height); // Clear properly
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 1.5; // Scale up

                // Color based on intensity
                const r = barHeight + (25 * (i / bufferLength));
                const g = 250 * (i / bufferLength);
                const b = 50;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    const handleBurn = () => {
        if (!text.trim()) return;
        setIsBurning(true);
        setTimeout(() => {
            setText('');
            setIsBurning(false);
            setShowConfirmation(true);
            setTimeout(() => setShowConfirmation(false), 4000);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/40 via-neutral-950 to-neutral-950" />

            {/* Fire particles effect (simulated) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-2xl z-10 flex flex-col items-center">

                {/* Header with Mode Toggle */}
                <div className="mb-8 text-center space-y-4">
                    <h1 className="text-4xl font-light text-white tracking-[0.2em] uppercase font-serif">The Void</h1>
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
                    /* Text Venting UI */
                    <div className="relative w-full group">
                        {/* Glow effect under paper */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 blur-xl transition-opacity duration-1000 ${isBurning ? 'opacity-100' : 'opacity-0'}`} />

                        <div className={`
                        relative bg-[#1a1a1a] border border-white/5 rounded-xl shadow-2xl overflow-hidden
                        transition-all duration-[2000ms] ease-in-out
                        ${isBurning ? 'scale-90 opacity-0 translate-y-[-50px] rotate-3 brightness-150' : 'hover:border-white/10'}
                    `}>

                            {/* Burning overlay */}
                            {isBurning && (
                                <div className="absolute inset-0 z-50 bg-gradient-to-t from-orange-600/20 via-transparent to-transparent flex items-end justify-center">
                                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-500/40 via-red-900/20 to-transparent animate-pulse" />
                                </div>
                            )}

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={isBurning}
                                className={`
                                w-full h-[300px] md:h-[400px] bg-[#0a0a0a]/50 p-8 
                                text-neutral-300 text-lg leading-relaxed font-serif resize-none outline-none
                                placeholder:text-neutral-700 transition-colors duration-500
                                ${isBurning ? 'text-orange-200/50' : ''}
                            `}
                                placeholder="Type here. Your words are private and ephemeral.&#10;They exists only for a moment, then vanish forever."
                            />

                            {/* Footer in card */}
                            <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs text-neutral-600 uppercase tracking-widest">
                                    {text.length} characters
                                </span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                    <div className="w-2 h-2 rounded-full bg-orange-500/20" />
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-12 relative w-full flex justify-center">
                            {showConfirmation ? (
                                <div className="animate-fade-in-up text-emerald-400/80 flex items-center gap-2 font-serif bg-emerald-950/30 px-6 py-2 rounded-full border border-emerald-500/20">
                                    <Flame size={16} /> Released into the void
                                </div>
                            ) : (
                                <button
                                    onClick={handleBurn}
                                    disabled={!text.trim() || isBurning}
                                    className={`
                                    group flex items-center gap-3 px-8 py-4 rounded-full 
                                    font-serif tracking-widest uppercase text-sm transition-all duration-500
                                    ${!text.trim()
                                            ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
                                            : 'bg-white text-black hover:bg-orange-500 hover:text-white hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] border-transparent'}
                                `}
                                >
                                    {isBurning ? 'Consuming...' : 'Incinerate'}
                                    {!isBurning && <Flame size={16} className={`${text.trim() ? 'text-orange-600 group-hover:text-white' : 'text-neutral-600'}`} />}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Sound Venting UI */
                    <div className="w-full relative">
                        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl shadow-2xl p-8 flex flex-col items-center">

                            {!showSoundReport ? (
                                <>
                                    {/* Visualizer Canvas */}
                                    <div className="w-full h-64 bg-black/50 rounded-lg mb-8 overflow-hidden relative border border-white/5">
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
                                            <div className="absolute top-4 right-4 text-xs font-mono text-purple-400">
                                                {maxDb} dB | {new Date(duration * 1000).toISOString().substr(14, 5)}
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
                                                className="w-20 h-20 rounded-full bg-red-900/20 border-2 border-red-500 flex items-center justify-center hover:scale-105 hover:bg-red-900/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-300 animate-pulse"
                                            >
                                                <Square className="w-8 h-8 text-red-500 fill-red-500" />
                                            </button>
                                        )}
                                        <p className="text-neutral-500 text-sm tracking-wider uppercase">
                                            {isRecording ? "Scream if you need to" : "Tap to Start Session"}
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
                                        <div className="bg-white/5 p-4 rounded-lg col-span-2">
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
                @keyframes fire-flicker {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.98); }
                }
                .animate-fire-rise {
                    animation: fire-flicker 2s infinite;
                }
                 /* Simple fade in up */
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PrivateVentingRoom;
