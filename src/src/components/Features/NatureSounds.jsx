import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, RotateCcw, X, Volume2, VolumeX, Wind } from 'lucide-react';

function NatureSounds({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const duration = 900; // 15 minutes

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const playNatureSound = () => {
    if (isMuted) return;
    if (audioRef.current) audioRef.current.stop();

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a Brown Noise buffer for a "Rain/Wind" effect
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // volume adjustment
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.15;

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    noiseSource.start();

    audioRef.current = {
      stop: () => {
        try {
          noiseSource.stop();
          audioContext.close();
        } catch (e) {}
      }
    };
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current = null;
    }
  };

  const handleStart = () => {
    setIsActive(true);
    playNatureSound();
    
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev + 1 >= duration) {
          handleEnd();
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      playNatureSound();
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          if (prev + 1 >= duration) {
            handleEnd();
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleEnd = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    stopSound();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setTimeElapsed(0);
    if (!isPaused) {
      stopSound();
      playNatureSound();
    }
  };

  useEffect(() => {
    return () => {
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeElapsed / duration) * 100;

  // Intro Screen
  if (!isActive) {
    return (
      <div className="h-full bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-teal-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Nature Sounds</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/20">
              <Music className="w-16 h-16 text-white" />
            </div>
            <p className="text-white/70 mb-6 max-w-md">
              Immerse yourself in the relaxing sounds of rain and forest. Perfect for deep focus or drifting off to sleep.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">Natural relaxation</span>
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-sm">Sleep aid</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">Focus enhancement</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-3 transition-all hover:scale-105"
          >
            <Play className="w-6 h-6" />
            Start Listening
          </button>
        </div>
      </div>
    );
  }

  // Active Session Screen
  return (
    <div className="h-full bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-teal-900/40 p-6 flex flex-col items-center justify-center relative">
      <button
        onClick={() => {
            const nextMute = !isMuted;
            setIsMuted(nextMute);
            if (nextMute) stopSound();
            else if (!isPaused) playNatureSound();
        }}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      {/* Nature Visual Element */}
      <div className="mb-8 relative">
        <div className={`absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse ${isPaused ? 'opacity-0' : 'opacity-100'}`} />
        <div className="relative inline-flex p-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
          <Wind className={`w-16 h-16 text-white ${!isPaused ? 'animate-bounce' : ''}`} style={{ animationDuration: '3s' }} />
        </div>
      </div>

      <div className="mb-10 text-center">
        <h3 className="text-3xl font-bold text-white mb-2">Forest Rain</h3>
        <p className="text-emerald-300/60 uppercase tracking-widest text-xs">Ambient Audio</p>
      </div>

      <div className="mb-6 text-center">
        <div className="text-6xl font-bold text-white mb-2">{formatTime(timeElapsed)}</div>
        <div className="text-white/60">of {formatTime(duration)}</div>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleReset}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handlePauseResume}
          className="p-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all"
        >
          {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={handleEnd}
          className="p-4 rounded-full bg-white/10 hover:bg-red-600/50 transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default NatureSounds;