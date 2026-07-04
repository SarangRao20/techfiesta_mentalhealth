import React, { useState, useRef, useEffect } from 'react';
import { Flame, X } from 'lucide-react';

const TextVenting = ({ onClose }) => {
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Audio context for the fire sound
    const fireAudioCtx = useRef(null);

    useEffect(() => {
        return () => {
            if (fireAudioCtx.current) fireAudioCtx.current.close().catch(() => {});
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

    return (
        <div className="h-full bg-black flex flex-col p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 z-10">
                <div>
                    <h2 className="text-2xl font-light text-white tracking-[0.2em] uppercase font-serif">
                        The Void
                    </h2>
                    <p className="text-neutral-500 font-light text-sm mt-1">
                        Release your burdens. Let them burn.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>
            </div>

            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/40 via-neutral-950 to-neutral-950 -z-10" />
            
            {/* Fire particles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-orange-600/10 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 blur-xl transition-opacity duration-1000 ${isBurning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="w-full max-w-lg mx-auto perspective-1000 relative flex-1 flex flex-col">
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
                        relative flex-1 bg-[#fdfbf7] rounded-sm p-10
                        transition-all duration-[3800ms] shadow-2xl overflow-visible flex flex-col
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
                                flex-1 w-full bg-transparent
                                text-neutral-800 text-xl leading-[2.5rem] font-serif resize-none outline-none
                                transition-all duration-[2500ms]
                                ${isBurning ? 'text-orange-700 opacity-0 blur-2xl translate-y-[-60px]' : 'placeholder:text-neutral-300'}
                            `}
                            placeholder="Write down what is hurting you... then incinerate it."
                            style={{ backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }}
                        />
                    </div>

                    <div className="mt-6 flex justify-center h-16">
                        {showConfirmation ? (
                            <div className="animate-fade-in text-orange-400 font-serif text-lg italic">It has been turned to ash.</div>
                        ) : (
                            <button
                                onClick={handleBurn}
                                disabled={!text.trim() || isBurning}
                                className="group relative px-14 py-4 bg-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-30 border border-neutral-300"
                            >
                                <span className="relative z-10 font-bold tracking-[0.2em] text-black flex items-center gap-2">
                                    {isBurning ? 'CONSUMING...' : 'INCINERATE'} <Flame size={20} className="text-orange-600" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        )}
                    </div>
                </div>
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
                        transform: translateY(-700px) translateX(0px) rotate(0deg) scale(0.1); 
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
        </div>
    );
};

export default TextVenting;
