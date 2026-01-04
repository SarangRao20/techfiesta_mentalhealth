import React, { useState } from 'react';
import { Flame, Send, X, AlertCircle } from 'lucide-react';

const PrivateVentingRoom = () => {
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

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

                {/* Header */}
                <div className="mb-10 text-center space-y-2">
                    <h1 className="text-4xl font-light text-white tracking-[0.2em] uppercase font-serif">The Void</h1>
                    <p className="text-neutral-500 font-light">Release your burdens. Let them burn.</p>
                </div>

                {/* Paper Container */}
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
                </div>

                {/* Action Button */}
                <div className="mt-12 relative">
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
