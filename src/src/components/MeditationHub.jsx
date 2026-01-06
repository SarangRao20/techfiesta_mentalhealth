import React, { useState } from 'react';
import { Brain, Wind, Glasses } from 'lucide-react';
import Meditation from './Meditation';
import Ar_breathing from './Features/Ar_breathing';
import VrMeditation from './VrMeditation';

function MeditationHub() {
    const [mode, setMode] = useState('standard');

    const getTitle = () => {
        switch (mode) {
            case 'standard': return 'Standard Meditation';
            case 'ar': return 'AR Breathing';
            case 'vr': return 'VR Meditation';
            default: return 'Meditation Hub';
        }
    };

    const getDescription = () => {
        switch (mode) {
            case 'standard': return 'Guided sessions for mental clarity and focus';
            case 'ar': return 'Augmented reality guided breathing techniques';
            case 'vr': return 'Immersive virtual environment meditation';
            default: return 'Choose your preferred meditation method';
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col">
            {/* Premium Header - Inspired by PrivateVentingRoom */}
            <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-serif text-white tracking-widest uppercase">
                                {getTitle()}
                            </h1>
                            <p className="text-neutral-500 text-sm font-light mt-1">
                                {getDescription()}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full backdrop-blur-md self-start md:self-center">
                            <button
                                onClick={() => setMode('standard')}
                                className={`px-5 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${mode === 'standard'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Brain size={14} /> Standard
                            </button>
                            <button
                                onClick={() => setMode('ar')}
                                className={`px-5 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${mode === 'ar'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Wind size={14} /> AR
                            </button>
                            <button
                                onClick={() => setMode('vr')}
                                className={`px-5 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${mode === 'vr'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Glasses size={14} /> VR
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full bg-[#050505]">
                <div key={mode} className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                    {mode === 'standard' && <Meditation />}
                    {mode === 'ar' && <Ar_breathing />}
                    {mode === 'vr' && <VrMeditation />}
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom {
                    from { transform: translateY(10px); }
                    to { transform: translateY(0); }
                }
                .animate-in {
                    animation: fade-in 0.5s ease-out, slide-in-from-bottom 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}

export default MeditationHub;
