import React, { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';

function BreathingExercise({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [breathPhase, setBreathPhase] = useState('');
  const [breathCount, setBreathCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [breathDuration] = useState(4);
  const duration = 30; // 30 seconds

  const intervalRef = useRef(null);
  const breathIntervalRef = useRef(null);
  const synthRef = useRef(null);
  const audioRef = useRef(null);

  const speak = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    if (synthRef.current) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const playSound = () => {
    if (isMuted) return;
    if (audioRef.current) audioRef.current.stop();

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 432;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.08;
    oscillator.start();

    audioRef.current = {
      oscillator,
      audioContext,
      stop: () => {
        try {
          oscillator.stop();
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
    if (synthRef.current) window.speechSynthesis.cancel();
  };

  const startBreathingGuide = () => {
    const cycle = () => {
      setBreathPhase('Breathe In');
      speak('Breathe in');
      setTimeout(() => {
        setBreathPhase('Hold');
        speak('Hold');
      }, breathDuration * 1000);
      setTimeout(() => {
        setBreathPhase('Breathe Out');
        speak('Breathe out');
      }, breathDuration * 2000);
      setTimeout(() => {
        setBreathPhase('Hold');
        speak('Hold');
      }, breathDuration * 3000);
      setTimeout(() => {
        setBreathCount(prev => prev + 1);
      }, breathDuration * 4000);
    };
    cycle();
    breathIntervalRef.current = setInterval(cycle, breathDuration * 4000);
  };

  const handleStart = () => {
    setIsActive(true);
    setTimeElapsed(0);
    setBreathCount(0);
    playSound();
    setTimeout(() => speak("Let's begin. Get comfortable and relax."), 500);
    setTimeout(() => startBreathingGuide(), 2000);

    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (newTime >= duration) {
          handleEnd();
          return duration;
        }
        return newTime;
      });
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      playSound();
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          if (prev + 1 >= duration) {
            handleEnd();
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
      startBreathingGuide();
    } else {
      setIsPaused(true);
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
        breathIntervalRef.current = null;
      }
    }
  };

  const handleEnd = () => {
    speak('Great job! Session complete.');
    setIsActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    setBreathPhase('');
    stopSound();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
  };

  const handleReset = () => {
    setTimeElapsed(0);
    setBreathCount(0);
    if (!isPaused) {
      stopSound();
      playSound();
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      startBreathingGuide();
    }
  };

  useEffect(() => {
    return () => {
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeElapsed / duration) * 100;
  const getBreathScale = () => {
    if (breathPhase === 'Breathe In') return 'scale-150';
    if (breathPhase === 'Breathe Out') return 'scale-75';
    return 'scale-100';
  };

  if (!isActive) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">1/2-Minute Breathing Exercise</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
              <Brain className="w-16 h-16 text-white" />
            </div>
            <p className="text-white/70 mb-6 max-w-md">
              A simple 30-second breathing technique to reduce stress and anxiety. Follow the voice guidance for best results.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">Reduces stress</span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm">Calms mind</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">Quick relief</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center gap-3 transition-all hover:scale-105"
          >
            <Play className="w-6 h-6" />
            Start Exercise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 p-6 flex flex-col items-center justify-center relative">
      <button
        onClick={isMuted ? () => setIsMuted(false) : () => setIsMuted(true)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      <div className="mb-8">
        <div className={`inline-flex p-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform duration-1000 ${getBreathScale()}`}>
          <Brain className="w-16 h-16 text-white" />
        </div>
      </div>

      {breathPhase && (
        <div className="mb-6">
          <div className={`px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-400/50 transition-all duration-1000 ${getBreathScale()}`}>
            <p className="text-3xl font-bold text-indigo-300">{breathPhase}</p>
          </div>
          <p className="text-white/60 mt-3 text-center">Breath Cycle: {breathCount}</p>
        </div>
      )}

      <div className="mb-6 text-center">
        <div className="text-6xl font-bold text-white mb-2">{formatTime(timeElapsed)}</div>
        <div className="text-white/60">of {formatTime(duration)}</div>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
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
          className="p-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all"
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



export default BreathingExercise;