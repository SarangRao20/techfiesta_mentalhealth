import React, { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';

const BodyScanMeditation = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentGuide, setCurrentGuide] = useState('');
  const duration = 300;

  const intervalRef = useRef(null);
  const synthRef = useRef(null);
  const audioRef = useRef(null);

  const bodyScanGuides = [
    { time: 10, text: 'Focus on your toes... feel them relax' },
    { time: 30, text: 'Move awareness to your feet and ankles' },
    { time: 60, text: 'Feel your calves and knees softening' },
    { time: 90, text: 'Notice your thighs and hips' },
    { time: 120, text: 'Bring attention to your lower back and abdomen' },
    { time: 150, text: 'Feel your chest and shoulders' },
    { time: 180, text: 'Notice your arms, hands, and fingers' },
    { time: 210, text: 'Relax your neck and throat' },
    { time: 240, text: 'Soften your jaw and facial muscles' },
    { time: 270, text: 'Feel your entire body in complete relaxation' }
  ];

  const speak = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    if (synthRef.current) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setCurrentGuide(text);
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
    gainNode.gain.value = 0.04;
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

  const handleStart = () => {
    setIsActive(true);
    setTimeElapsed(0);
    setCurrentGuide('');
    playSound();
    setTimeout(() => speak('Close your eyes and get comfortable. We will scan through your body.'), 500);

    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        const guide = bodyScanGuides.find(g => g.time === newTime);
        if (guide) speak(guide.text);
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
          const newTime = prev + 1;
          const guide = bodyScanGuides.find(g => g.time === newTime);
          if (guide) speak(guide.text);
          if (newTime >= duration) {
            handleEnd();
            return duration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleEnd = () => {
    speak('Great job! Session complete.');
    setIsActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    setCurrentGuide('');
    stopSound();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setTimeElapsed(0);
    setCurrentGuide('');
    if (!isPaused) {
      stopSound();
      playSound();
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

  if (!isActive) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-rose-900/50 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Body Scan Meditation</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-10 text-center">
            <div className="inline-flex p-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-8 shadow-2xl shadow-purple-500/50">
              <Brain className="w-20 h-20 text-white" />
            </div>
            <p className="text-white/80 mb-8 max-w-lg text-lg leading-relaxed">
              Progressive relaxation through body awareness. A 5-minute guided journey to release tension and achieve deep relaxation.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-400/30">🌙 Deep relaxation</span>
              <span className="px-4 py-2 rounded-full bg-pink-500/20 text-pink-300 text-sm font-medium border border-pink-400/30">🧘 Body awareness</span>
              <span className="px-4 py-2 rounded-full bg-rose-500/20 text-rose-300 text-sm font-medium border border-rose-400/30">✨ Tension release</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-semibold flex items-center gap-3 transition-all hover:scale-105 shadow-2xl shadow-purple-500/30"
          >
            <Play className="w-6 h-6" />
            Start Meditation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-rose-900/50 p-8 flex flex-col items-center justify-center relative">
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      <div className="mb-10">
        <div className="inline-flex p-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-2xl">
          <Brain className="w-20 h-20 text-white" />
        </div>
      </div>

      {currentGuide && (
        <div className="mb-8 max-w-2xl">
          <div className="px-8 py-4 rounded-2xl bg-purple-600/30 border border-purple-400/50 backdrop-blur-sm">
            <p className="text-xl text-white text-center font-medium">{currentGuide}</p>
          </div>
        </div>
      )}

      <div className="mb-8 text-center">
        <div className="text-7xl font-bold text-white mb-3">{formatTime(timeElapsed)}</div>
        <div className="text-white/60 text-lg">of {formatTime(duration)}</div>
      </div>

      <div className="w-full max-w-lg mb-10">
        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 transition-all duration-1000 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-white/50">
          <span>Start</span>
          <span>{Math.round(progress)}%</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="flex gap-5">
        <button
          onClick={handleReset}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110"
          title="Reset"
        >
          <RotateCcw className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={handlePauseResume}
          className="p-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-110 shadow-xl"
        >
          {isPaused ? <Play className="w-7 h-7 text-white" /> : <Pause className="w-7 h-7 text-white" />}
        </button>
        <button
          onClick={handleEnd}
          className="p-4 rounded-full bg-white/10 hover:bg-red-600/70 transition-all hover:scale-110"
          title="End Session"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <p className="text-white/60 mt-8 text-center text-lg">
        {isPaused ? '⏸ Paused - Resume when ready' : '🧘 Stay present and breathe'}
      </p>
    </div>
  );
};

export default BodyScanMeditation;