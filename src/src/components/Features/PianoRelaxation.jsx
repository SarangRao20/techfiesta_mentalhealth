import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';

function PianoRelaxation({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const duration = 900; // 15 minutes

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const playPianoTone = () => {
    if (isMuted) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, audioContext.currentTime); // Healing frequency
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 2);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();

    audioRef.current = {
      stop: () => { try { gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1); setTimeout(() => audioContext.close(), 1000); } catch(e){} }
    };
  };

  const handleStart = () => {
    setIsActive(true);
    playPianoTone();
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => (prev + 1 >= duration ? handleEnd() || duration : prev + 1));
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      playPianoTone();
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => (prev + 1 >= duration ? handleEnd() || duration : prev + 1));
      }, 1000);
    } else {
      setIsPaused(true);
      if (audioRef.current) audioRef.current.stop();
      clearInterval(intervalRef.current);
    }
  };

  const handleEnd = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    if (audioRef.current) audioRef.current.stop();
    clearInterval(intervalRef.current);
  };

  if (!isActive) {
    return (
      <div className="h-full bg-gradient-to-br from-violet-900/40 via-purple-900/40 to-fuchsia-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Piano Relaxation</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="p-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-6 shadow-xl">
            <Music className="w-16 h-16 text-white" />
          </div>
          <p className="text-white/70 mb-6 max-w-md">Soft, melodic piano compositions designed to lower heart rate and encourage mental stillness.</p>
          <div className="flex gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm">Harmonious</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">Gentle</span>
          </div>
          <button onClick={handleStart} className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold flex items-center gap-3 hover:scale-105 transition-all">
            <Play className="w-6 h-6" /> Begin Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-violet-900/40 via-purple-900/40 to-fuchsia-900/40 p-6 flex flex-col items-center justify-center relative">
      <button onClick={() => setIsMuted(!isMuted)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20">
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>
      
      <div className="mb-12 flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`absolute border border-violet-400/20 rounded-full ${!isPaused ? 'animate-ripple' : ''}`}
               style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
        <div className="relative p-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
          <Music className="w-16 h-16 text-violet-300" />
        </div>
      </div>

      <div className="text-center mb-10">
        <div className="text-7xl font-extralight text-white mb-2">
          {Math.floor(timeElapsed / 60).toString().padStart(2, '0')}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>
        <p className="text-violet-300/40 uppercase tracking-[0.3em] text-xs">Midnight Melodies</p>
      </div>

      <div className="flex gap-6">
        <button onClick={handlePauseResume} className="w-20 h-20 rounded-full bg-white text-violet-900 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
          {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
        </button>
        <button onClick={handleEnd} className="w-20 h-20 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 transition-colors">
          <X size={28} />
        </button>
      </div>
    </div>
  );
}

export default PianoRelaxation;