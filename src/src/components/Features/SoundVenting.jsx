import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Activity, X } from 'lucide-react';
import { API_URL } from '../../config';

const SoundVenting = ({ onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [maxDb, setMaxDb] = useState(0);
    const [currentDb, setCurrentDb] = useState(0);
    const [avgDb, setAvgDb] = useState(0);
    const [screamCount, setScreamCount] = useState(0);
    const [showSoundReport, setShowSoundReport] = useState(false);
    const [isScreaming, setIsScreaming] = useState(false);

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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
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
            if (now - lastUiUpdateRef.current > 100) {
                setCurrentDb(Math.round(db));
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
                    r = 255;
                    g = Math.random() * 50;
                    b = Math.random() * 50;
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

    return (
        <div className={`h-full bg-black flex flex-col p-6 relative overflow-hidden transition-colors duration-100 ${isScreaming ? 'bg-[#1a0505]' : 'bg-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={`text-2xl font-light text-white tracking-[0.2em] uppercase font-serif transition-all ${isScreaming ? 'text-red-500 scale-110 tracking-[0.3em] font-bold' : ''}`}>
                        {isScreaming ? "LET IT OUT!" : "Sound Venting"}
                    </h2>
                    <p className="text-neutral-500 font-light text-sm mt-1">
                        Scream into the void. Let it out.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>
            </div>

            {/* Visual Feedback Overlay */}
            {isScreaming && (
                <div className="absolute inset-0 z-0 animate-scream-shake opacity-80 pointer-events-none">
                    <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-transparent to-transparent animate-pulse-fast" />
                </div>
            )}

            {/* Fire particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className={`absolute top-1/2 left-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] animate-pulse ${isScreaming ? 'bg-red-600/30 scale-150 duration-75' : ''}`} />
                <div className={`absolute bottom-0 right-1/4 w-64 h-64 bg-red-900/10 rounded-full blur-[100px] ${isScreaming ? 'bg-red-800/30 scale-125 duration-100' : ''}`} />
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col relative ${isScreaming ? 'animate-vibrate' : ''}`}>
                <div className={`flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl shadow-2xl p-6 flex flex-col items-center transition-all duration-75 ${isScreaming ? 'border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : ''}`}>
                    {!showSoundReport ? (
                        <>
                            {/* Visualizer Canvas */}
                            <div className={`w-full flex-1 bg-black/50 rounded-lg mb-6 overflow-hidden relative border transition-all duration-75 ${isScreaming ? 'border-red-500 scale-[1.02]' : 'border-white/5'}`}>
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={256}
                                    className="w-full h-full"
                                />
                                {!isRecording && (
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
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
                            <div className="flex flex-col items-center gap-3">
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-purple-500/50 flex items-center justify-center hover:scale-110 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 group"
                                    >
                                        <Mic className="w-6 h-6 text-purple-400 group-hover:text-white" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-all duration-100 ${isScreaming ? 'bg-red-600 border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-pulse-fast' : 'bg-red-900/20 border-red-500 animate-pulse hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'}`}
                                    >
                                        <Square className={`w-6 h-6 ${isScreaming ? 'text-white fill-white' : 'text-red-500 fill-red-500'}`} />
                                    </button>
                                )}
                                <p className={`text-xs tracking-wider uppercase transition-colors ${isScreaming ? 'text-red-400 font-bold animate-pulse' : 'text-neutral-500'}`}>
                                    {isRecording ? (isScreaming ? "SCREAM!" : "Listening...") : "Tap to Start Session"}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="animate-fade-in-up text-center w-full">
                            <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                            <h3 className="text-xl font-light text-white mb-4">Session Complete</h3>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-2xl font-bold text-white mb-1">{duration}s</div>
                                    <div className="text-xs text-neutral-500 uppercase">Duration</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-400 mb-1">{maxDb}</div>
                                    <div className="text-xs text-neutral-500 uppercase">Max Intensity</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-2xl font-bold text-red-500 mb-1">{screamCount}</div>
                                    <div className="text-xs text-neutral-500 uppercase">Screams</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-2xl font-bold text-white mb-1">{Math.round(avgDb)}</div>
                                    <div className="text-xs text-neutral-500 uppercase">Avg Intensity</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSoundReport(false)}
                                className="px-6 py-2 bg-white text-black font-serif rounded-full hover:bg-purple-500 hover:text-white transition-all text-sm"
                            >
                                Start New Session
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
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

export default SoundVenting;
