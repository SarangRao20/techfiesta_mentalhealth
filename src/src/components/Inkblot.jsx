import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Eye, Send, RotateCcw, BookOpen, Download, CheckCircle, FileText, Share2 } from 'lucide-react';

const Inkblot = () => {
    const [started, setStarted] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sequence, setSequence] = useState([]);
    const [elaboration, setElaboration] = useState('');
    const [step, setStep] = useState('elaboration'); // 'elaboration', 'results'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const [resultId, setResultId] = useState(null);

    // Total plates available in assets
    const TOTAL_ASSETS = 10;
    const SESSION_LENGTH = 5;

    const logActivity = async (action, metadata = {}) => {
        try {
            await fetch(`${API_URL}/api/activity/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    activity_type: 'inkblot',
                    action: action,
                    extra_data: metadata
                })
            });
        } catch (e) {
            console.error("Logging failed", e);
        }
    };

    const handleStart = async () => {
        setShowInstructions(true);
    };

    const handleBeginTest = async () => {
        const numbers = Array.from({ length: TOTAL_ASSETS }, (_, i) => i + 1);
        const shuffled = numbers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, SESSION_LENGTH);

        setSequence(selected);
        setCurrentIndex(0);
        setElaboration('');
        setStep('elaboration');
        setResultId(null);
        setStarted(true);
        setShowInstructions(false);

        try {
            await fetch(`${API_URL}/api/inkblot/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            logActivity('inkblot_start');
        } catch (e) {
            console.error("Failed to init session", e);
        }
    };

    const handleNext = async () => {
        if (!elaboration.trim()) return;
        await submitStep();
    };

    const submitStep = async () => {
        setIsSubmitting(true);
        const currentBlotId = sequence[currentIndex];

        try {
            await fetch(`${API_URL}/api/inkblot/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    blot_num: currentBlotId,
                    response: elaboration,
                    elaboration: elaboration
                })
            });

            if (currentIndex < SESSION_LENGTH - 1) {
                setShowTransition(true);
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    setElaboration('');
                    setStep('elaboration');
                    setShowTransition(false);
                }, 800);
            } else {
                await finishSession();
            }
        } catch (e) {
            console.error("Submit failed", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const finishSession = async () => {
        try {
            const res = await fetch(`${API_URL}/api/inkblot/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            setResultId(data.result_id);
            setStep('results');
            logActivity('inkblot_complete', { result_id: data.result_id });
        } catch (e) {
            console.error("Finish failed", e);
        }
    };

    const currentBlotNum = sequence[currentIndex];

    if (step === 'results') {
        return (
            <div className="min-h-screen bg-[#0f0f10] text-gray-100 flex items-center justify-center p-6">
                <div className="max-w-lg text-center space-y-8 animate-fade-in-up">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle size={36} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif mb-4 tracking-wide">Test Complete</h1>
                        <p className="text-neutral-400 leading-relaxed text-lg">
                            Thank you for completing the Inkblot Test.
                            <br />Your responses have been saved.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                if (resultId) {
                                    window.open(`${API_URL}/api/inkblot/export/${resultId}`, '_blank');
                                }
                            }}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-all"
                        >
                            <Download size={18} />
                            Download Report
                        </button>
                        <button
                            onClick={() => window.location.href = '/app/consultation'}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
                        >
                            <Share2 size={18} />
                            Share with Counselor
                        </button>
                    </div>

                    <button
                        onClick={() => setStarted(false)}
                        className="text-neutral-500 hover:text-white transition-colors text-sm uppercase tracking-widest flex items-center gap-2 mx-auto"
                    >
                        <RotateCcw size={14} /> Back to Start
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] text-gray-100 flex items-center justify-center p-6">
            {/* Instructions Screen */}
            {showInstructions && (
                <div className="max-w-xl text-center space-y-8 animate-fade-in-up">
                    <div className="w-20 h-20 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        <BookOpen size={36} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif mb-4 tracking-wide">How It Works</h1>
                        <p className="text-neutral-400 leading-relaxed text-lg">
                            You'll see {SESSION_LENGTH} inkblot images. For each one:
                        </p>
                    </div>
                    
                    <div className="space-y-4 max-w-md mx-auto text-left">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                                <span className="text-purple-400 font-bold text-sm">1</span>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Observe the inkblot</h3>
                                <p className="text-neutral-500 text-sm">What do you see, feel, or imagine?</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                                <span className="text-purple-400 font-bold text-sm">2</span>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Elaborate deeply</h3>
                                <p className="text-neutral-500 text-sm">Describe your perception and tell its story</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-neutral-500 text-sm italic">
                        No right or wrong answers. Trust your intuition.
                    </p>

                    <button
                        onClick={handleBeginTest}
                        className="px-10 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all tracking-wider uppercase text-sm shadow-xl shadow-white/5"
                    >
                        Begin Test
                    </button>
                </div>
            )}

            {!started && !showInstructions ? (
                <div className="max-w-xl text-center space-y-8 animate-fade-in-up">
                    <div className="w-32 h-32 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Eye size={48} className="text-neutral-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif mb-4 tracking-wide">Projective Inkblot Test</h1>
                        <p className="text-neutral-400 leading-relaxed font-light text-lg">
                            An immersive psychological exploration. Describe your perceptions and elaborate on the stories your mind creates.
                            <br /><br />
                            <span className="text-sm italic opacity-60">There are no right or wrong answers. Trust your intuition.</span>
                        </p>
                    </div>
                    <button
                        onClick={handleStart}
                        className="px-10 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all tracking-wider uppercase text-sm shadow-xl shadow-white/5"
                    >
                        Enter the Test
                    </button>
                </div>
            ) : started && (
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* Visual Area */}
                    <div className={`
                        relative bg-white rounded-2xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center p-12
                        transition-all duration-1000 transform border-4 border-black
                        ${showTransition ? 'opacity-0 scale-90 blur-xl rotate-12' : 'opacity-100 scale-100 blur-0 rotate-0'}
                    `}>
                        <img
                            src={`/assets/inkblots/blot${currentBlotNum}.jpg`}
                            alt={`Rorschach Plate ${currentBlotNum}`}
                            className="w-full h-full object-contain mix-blend-multiply opacity-90 contrast-125 grayscale hover:grayscale-0 transition-all duration-1000 cursor-none"
                            style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' }}
                        />
                        <div className="absolute inset-0 bg-[#f4f1ea] mix-blend-multiply opacity-30 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/5 pointer-events-none" />

                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-black/80 rounded-full border border-white/10 text-[10px] font-mono text-gray-400">
                            <FileText size={10} />
                            PLATE {currentIndex + 1} OF {SESSION_LENGTH}
                        </div>
                    </div>

                    {/* Interaction Area */}
                    <div className="space-y-8 animate-fade-in-right">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold">
                                <div className="w-6 h-[1px] bg-neutral-700" />
                                Deep Dive
                            </div>
                            <h2 className="text-3xl font-serif italic text-white">
                                What do you see? Tell the story...
                            </h2>
                            <p className="text-neutral-500 font-light leading-relaxed">
                                Describe what you perceive, what feelings it evokes, and build a narrative around it. Be as detailed as possible.
                            </p>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={elaboration}
                                onChange={(e) => setElaboration(e.target.value)}
                                className="w-full h-48 bg-[#1a1a1a]/50 border border-white/5 rounded-2xl p-6 text-white text-lg leading-relaxed placeholder-neutral-700 focus:outline-none focus:border-white/20 focus:bg-[#1a1a1a] transition-all resize-none shadow-inner"
                                placeholder="I see... and it makes me think of..."
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <div className="flex gap-1.5">
                                {[...Array(SESSION_LENGTH)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-500 ${i < currentIndex ? 'w-6 bg-emerald-500' : i === currentIndex ? 'w-10 bg-white' : 'w-6 bg-white/10'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={!elaboration.trim() || isSubmitting}
                                className={`
                                    flex items-center gap-3 px-10 py-4 rounded-full font-bold transition-all uppercase tracking-widest text-xs
                                    ${!elaboration.trim()
                                        ? 'bg-white/5 text-neutral-600 cursor-not-allowed border border-white/5'
                                        : 'bg-white text-black hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'}
                                `}
                            >
                                {isSubmitting ? 'Recording...' : 'Submit Response'}
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-right {
                    0% { opacity: 0; transform: translateX(20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .animate-fade-in-right {
                    animation: fade-in-right 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default Inkblot;
