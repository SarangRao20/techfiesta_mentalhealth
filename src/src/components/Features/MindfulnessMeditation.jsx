import React, { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, RotateCcw, X, Volume2, VolumeX, Sparkles } from 'lucide-react';

const MindfulnessMeditation = ({ onComplete, onExit }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentGuide, setCurrentGuide] = useState("Find a comfortable position...");
  
  const duration = 600; // 10 minutes
  const soundFreq = 528;
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const mindfulnessGuides = [
    { time: 0, text: 'Find a comfortable position. Focus on your breath.' },
    { time: 30, text: 'Notice your thoughts without judgment.' },
    { time: 90, text: 'Observe sensations in your body.' },
    { time: 150, text: 'Listen to sounds around you.' },
    { time: 210, text: 'Feel the air touching your skin.' },
    { time: 270, text: 'Return to your breath when the mind wanders.' },
    { time: 330, text: 'Acknowledge emotions that arise.' },
    { time: 390, text: 'Stay present in this moment.' },
    { time: 450, text: 'Appreciate this time for yourself.' },
    { time: 510, text: 'Begin to deepen your awareness.' },
    { time: 570, text: 'Prepare to complete your practice.' }
  ];

  const speak = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
    setCurrentGuide(text);
  };

  const playSound = () => {
    if (isMuted) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = soundFreq;
    gainNode.gain.value = 0.05;
    oscillator.start();
    audioRef.current = { oscillator, audioContext, stop: () => { oscillator.stop(); audioContext.close(); } };
  };

  useEffect(() => {
    playSound();
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeElapsed(prev => {
          const next = prev + 1;
          const guide = mindfulnessGuides.find(g => g.time === next);
          if (guide) speak(guide.text);
          if (next >= duration) {
            clearInterval(intervalRef.current);
            onComplete(duration, 'meditation');
          }
          return next;
        });
      }
    }, 1000);
    return () => {
      if (audioRef.current) audioRef.current.stop();
      clearInterval(intervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, [isPaused, isMuted]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900/40 via-teal-900/40 to-emerald-900/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            {/* Focus Anchor Visualizer */}
            <div className={`absolute inset-0 bg-cyan-500/20 rounded-full animate-ping ${isPaused ? 'pause' : ''}`} />
            <div className="relative p-6 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Mindfulness</h2>
          <p className="text-gray-400 italic h-12 px-4">"{currentGuide}"</p>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-white mb-2">{formatTime(timeElapsed)}</div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-1000" 
              style={{ width: `${(timeElapsed / duration) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <button onClick={() => setIsPaused(!isPaused)} className="p-4 bg-cyan-600 rounded-full hover:scale-110 transition-transform">
            {isPaused ? <Play fill="white" /> : <Pause fill="white" />}
          </button>
          <button onClick={onExit} className="p-4 bg-slate-700 rounded-full hover:bg-red-500 transition-colors">
            <X className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MindfulnessMeditation;