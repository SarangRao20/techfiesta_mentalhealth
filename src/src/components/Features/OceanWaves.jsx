import React, { useState, useEffect, useRef } from 'react';
import { Waves, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';

function OceanWaves({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const duration = 1200; // 20 minutes

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const playOceanSound = () => {
    if (isMuted) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow tide rhythm

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    lfo.connect(gainNode.gain);
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    lfo.start();
    noise.start();

    audioRef.current = {
      stop: () => {
        try { noise.stop(); lfo.stop(); audioContext.close(); } catch (e) {}
      }
    };
  };

  const stopSound = () => {
    if (audioRef.current) { audioRef.current.stop(); audioRef.current = null; }
  };

  const handleStart = () => {
    setIsActive(true);
    playOceanSound();
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => (prev + 1 >= duration ? handleEnd() || duration : prev + 1));
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      playOceanSound();
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => (prev + 1 >= duration ? handleEnd() || duration : prev + 1));
      }, 1000);
    } else {
      setIsPaused(true);
      stopSound();
      clearInterval(intervalRef.current);
    }
  };

  const handleEnd = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    stopSound();
    clearInterval(intervalRef.current);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = (timeElapsed / duration) * 100;

  if (!isActive) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-900/40 via-cyan-900/40 to-indigo-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Ocean Waves</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="p-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 mb-6 shadow-lg shadow-blue-500/20">
            <Waves className="w-16 h-16 text-white" />
          </div>
          <p className="text-white/70 mb-6 max-w-md">Calm your mind with the rhythmic ebb and flow of deep sea waves. Ideal for stress relief and meditation.</p>
          <div className="flex gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">Rhythmic</span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm">Soothing</span>
          </div>
          <button onClick={handleStart} className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold flex items-center gap-3 hover:scale-105 transition-all">
            <Play className="w-6 h-6" /> Start Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/40 via-cyan-900/40 to-indigo-900/40 p-6 flex flex-col items-center justify-center relative">
      <button onClick={() => { setIsMuted(!isMuted); isMuted ? playOceanSound() : stopSound(); }} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20">
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>
      <div className="mb-8 relative flex items-center justify-center">
        <div className={`absolute w-32 h-32 bg-cyan-500/20 rounded-full blur-xl transition-transform duration-[4000ms] ${!isPaused ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`} />
        <div className="relative p-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
          <Waves className={`w-16 h-16 text-white ${!isPaused ? 'animate-pulse' : ''}`} />
        </div>
      </div>
      <div className="text-center mb-10">
          <h3 className="text-4xl font-bold text-white mb-2">{formatTime(timeElapsed)}</h3>
          <p className="text-cyan-300/60 uppercase tracking-tighter">Deep Sea Drift</p>
      </div>
      <div className="w-full max-w-md mb-8">
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setTimeElapsed(0)} className="p-4 rounded-full bg-white/10 text-white"><RotateCcw className="w-5 h-5"/></button>
        <button onClick={handlePauseResume} className="p-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          {isPaused ? <Play fill="white"/> : <Pause fill="white"/>}
        </button>
        <button onClick={handleEnd} className="p-4 rounded-full bg-white/10 text-white hover:bg-red-500/40"><X /></button>
      </div>
    </div>
  );
}

export default OceanWaves;