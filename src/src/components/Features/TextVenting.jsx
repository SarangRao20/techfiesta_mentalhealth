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
                    <div className={`
                        relative flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl shadow-2xl overflow-hidden
                        transition-all duration-[2000ms] ease-in-out flex flex-col min-h-[300px]
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
                                flex-1 w-full bg-[#0a0a0a]/50 p-8 
                                text-neutral-300 text-lg leading-relaxed font-serif resize-none outline-none
                                placeholder:text-neutral-700 transition-colors duration-500
                                ${isBurning ? 'text-orange-200/50' : ''}
                            `}
                            placeholder="Type here. Your words are private and ephemeral.&#10;They exist only for a moment, then vanish forever."
                        />

                        {/* Footer */}
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
        </div>
    );
};

export default TextVenting;
