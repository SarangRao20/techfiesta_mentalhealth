import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Eye, Send, RotateCcw, BookOpen } from 'lucide-react';

const Inkblot = () => {
    const [started, setStarted] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(1);
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTransition, setShowTransition] = useState(false);

    // Mock Inkblot SVGs or Placeholders
    // In a real app, these would be actual Rorschach plate images
    const blots = [
        { id: 1, color: '#1a1a1a', path: 'M100,250 Q150,150 200,250 T300,250 T400,250' }, // Simplified abstraction
        { id: 2, color: '#2a1a1a', path: 'M150,200 Q250,50 350,200 T150,200' },
        { id: 3, color: '#1a1a2a', path: 'M200,100 Q300,300 100,300 T200,100' },
        { id: 4, color: '#1a2a1a', path: 'M100,100 Q400,100 250,400 T100,100' },
        { id: 5, color: '#3a1a1a', path: 'M50,250 Q250,50 450,250 T50,250' },
    ];

    const currentBlot = blots[currentSlide - 1];

    const handleStart = async () => {
        try {
            await fetch(`${API_URL}/api/inkblot/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            setStarted(true);
        } catch (e) {
            console.error("Failed to init session", e);
        }
    };

    const handleSubmit = async () => {
        if (!response.trim()) return;
        setIsSubmitting(true);

        try {
            await fetch(`${API_URL}/api/inkblot/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    blot_num: currentSlide,
                    response: response
                })
            });

            // Transition
            setShowTransition(true);
            setTimeout(() => {
                if (currentSlide < blots.length) {
                    setCurrentSlide(prev => prev + 1);
                    setResponse('');
                    setShowTransition(false);
                } else {
                    alert("Test Complete. Thank you for your participation.");
                    // Reset or Redirect
                    setStarted(false);
                    setCurrentSlide(1);
                    setResponse('');
                    setShowTransition(false);
                }
                setIsSubmitting(false);
            }, 1000);

        } catch (e) {
            console.error("Failed to submit", e);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f10] text-gray-100 flex items-center justify-center p-6">
            {!started ? (
                <div className="max-w-xl text-center space-y-8 animate-fade-in-up">
                    <div className="w-32 h-32 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Eye size={48} className="text-neutral-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif mb-4 tracking-wide">Projective Inkblot Test</h1>
                        <p className="text-neutral-400 leading-relaxed font-light">
                            This is a psychological test in which your perceptions of inkblots are recorded and then analyzed using psychological interpretation.
                            <br /><br />
                            There are no right or wrong answers. Simply describe what you see.
                        </p>
                    </div>
                    <button
                        onClick={handleStart}
                        className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-all tracking-wider uppercase text-sm"
                    >
                        Begin Session
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Visual Area */}
                    <div className={`
                        relative bg-white rounded-xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center p-8
                        transition-all duration-1000 transform
                        ${showTransition ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}
                    `}>
                        <img
                            src={`/assets/inkblots/blot${currentSlide}.jpg`}
                            alt={`Rorschach Plate ${currentSlide}`}
                            className="w-full h-full object-contain mix-blend-multiply opacity-90"
                            onError={(e) => { e.target.style.display = 'none'; alert('Image missing: blot' + currentSlide + '.jpg'); }}
                        />
                        {/* Grain/Texture Overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-20 mix-blend-overlay pointer-events-none" />

                        <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
                            Plate {currentSlide} / 10
                        </div>
                    </div>

                    {/* Interaction Area */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-light">What do you see?</h2>
                            <p className="text-sm text-neutral-500">Describe the image, specific details, or feelings it evokes.</p>
                        </div>

                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="w-full h-40 bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors resize-none font-serif"
                            placeholder="I see..."
                            autoFocus
                        />

                        <div className="flex justify-between items-center">
                            <div className="text-xs text-neutral-600 uppercase tracking-widest">
                                Processing...
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!response.trim() || isSubmitting}
                                className={`
                                    flex items-center gap-3 px-8 py-3 rounded-full font-medium transition-all
                                    ${!response.trim()
                                        ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-gray-200'}
                                `}
                            >
                                {isSubmitting ? 'Recording...' : 'Next Plate'}
                                <Send size={16} />
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
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default Inkblot;
