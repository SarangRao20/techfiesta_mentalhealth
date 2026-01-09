import React, { useState, useEffect, useRef } from 'react';
import { Brain, Music, Play, Pause, RotateCcw, X, Volume2, VolumeX, Settings, Award, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';

const Meditation = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [breathPhase, setBreathPhase] = useState('');
  const [breathCount, setBreathCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [breathDuration, setBreathDuration] = useState(4);
  const [currentStreak, setCurrentStreak] = useState(3);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const breathIntervalRef = useRef(null);
  const synthRef = useRef(null);
  const breathTimeoutsRef = useRef([]);

  const meditationOptions = [
    {
      id: 1,
      icon: Brain,
      title: '1/2-Minute Breathing Exercise',
      description: 'Simple breathing technique to reduce stress and anxiety',
      category: 'breathing',
      duration: 30,
      soundFreq: 4000,
      hasGuide: true,
      difficulty: 'Beginner',
      benefits: ['Reduces stress', 'Calms mind', 'Quick relief'],
      bgGradient: 'from-blue-900/40 via-indigo-900/40 to-purple-900/40',
      bgPattern: '🌤️'
    },
    {
      id: 2,
      icon: Brain,
      title: 'Body Scan Meditation',
      description: 'Progressive relaxation through body awareness',
      category: 'meditation',
      duration: 300,
      soundFreq: 432,
      hasGuide: true,
      difficulty: 'Intermediate',
      benefits: ['Deep relaxation', 'Body awareness', 'Tension release'],
      bgGradient: 'from-purple-900/40 via-pink-900/40 to-rose-900/40',
      bgPattern: '🧘‍♀️'
    },
    {
      id: 3,
      icon: Brain,
      title: 'Mindfulness Meditation',
      description: 'Focus on present moment awareness',
      category: 'meditation',
      duration: 600,
      soundFreq: 528,
      hasGuide: true,
      difficulty: 'Intermediate',
      benefits: ['Present awareness', 'Mental clarity', 'Emotional balance'],
      bgGradient: 'from-cyan-900/40 via-teal-900/40 to-emerald-900/40',
      bgPattern: '☁️'
    },
    {
      id: 4,
      icon: Music,
      title: 'Nature Sounds',
      description: 'Relaxing sounds of rain and forest',
      category: 'sounds',
      duration: 900,
      soundFreq: 396,
      hasGuide: false,
      difficulty: 'Beginner',
      benefits: ['Natural relaxation', 'Sleep aid', 'Focus enhancement'],
      bgGradient: 'from-green-900/40 via-emerald-900/40 to-teal-900/40',
      bgPattern: '🌲'
    },
    {
      id: 5,
      icon: Music,
      title: 'Piano Relaxation',
      description: 'Gentle piano melodies for stress relief',
      category: 'sounds',
      duration: 600,
      soundFreq: 639,
      hasGuide: false,
      difficulty: 'Beginner',
      benefits: ['Stress relief', 'Creativity boost', 'Peaceful mood'],
      bgGradient: 'from-violet-900/40 via-purple-900/40 to-fuchsia-900/40',
      bgPattern: '🎹'
    },
    {
      id: 6,
      icon: Music,
      title: 'Ocean Waves',
      description: 'Calming ocean sounds for deep relaxation',
      category: 'sounds',
      duration: 900,
      soundFreq: 741,
      hasGuide: false,
      difficulty: 'Beginner',
      benefits: ['Deep relaxation', 'Sleep quality', 'Anxiety relief'],
      bgGradient: 'from-blue-900/40 via-cyan-900/40 to-sky-900/40',
      bgPattern: '🌊'
    }
  ];

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

  const mindfulnessGuides = [
    { time: 30, text: 'Notice your thoughts without judgment' },
    { time: 90, text: 'Observe sensations in your body' },
    { time: 150, text: 'Listen to sounds around you' },
    { time: 210, text: 'Feel the air touching your skin' },
    { time: 270, text: 'Return to your breath when mind wanders' },
    { time: 330, text: 'Acknowledge emotions that arise' },
    { time: 390, text: 'Stay present in this moment' },
    { time: 450, text: 'Appreciate this time for yourself' },
    { time: 510, text: 'Begin to deepen your awareness' },
    { time: 570, text: 'Prepare to complete your practice' }
  ];

  // Text-to-speech function
  const speak = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    if (synthRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Play ambient sound
  const playSound = (frequency) => {
    if (isMuted) return;

    if (audioRef.current) {
      audioRef.current.stop();
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.value = 0.08;
    gainNode.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + 1);

    oscillator.start();

    audioRef.current = {
      oscillator,
      audioContext,
      stop: () => {
        try {
          oscillator.stop();
          audioContext.close();
        } catch (e) { }
      }
    };
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current = null;
    }
    if (synthRef.current) {
      window.speechSynthesis.cancel();
    }
  };

  // Breathing guide cycle
  const startBreathingGuide = () => {
    const cycle = () => {
      setBreathPhase('Breathe In');
      speak('Breathe in');

      const t1 = setTimeout(() => {
        setBreathPhase('Hold');
        speak('Hold');
      }, breathDuration * 1000);

      const t2 = setTimeout(() => {
        setBreathPhase('Breathe Out');
        speak('Breathe out');
      }, breathDuration * 2000);

      const t3 = setTimeout(() => {
        setBreathPhase('Hold');
        speak('Hold');
      }, breathDuration * 3000);

      const t4 = setTimeout(() => {
        setBreathCount(prev => prev + 1);
      }, breathDuration * 4000);

      breathTimeoutsRef.current.push(t1, t2, t3, t4);
    };

    cycle();
    breathIntervalRef.current = setInterval(cycle, breathDuration * 4000);
  };

  const clearBreathingGuide = () => {
    // Clear all pending timeouts
    breathTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    breathTimeoutsRef.current = [];
    
    // Clear the interval
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current);
      breathIntervalRef.current = null;
    }
  };

  const handleStartSession = (option) => {
    setSelectedCard(option.id);
    setIsSessionActive(true);
    setIsPaused(false);
    setTimeElapsed(0);
    setBreathCount(0);
    setBreathPhase('');

    playSound(option.soundFreq);

    // Start appropriate guidance
    if (option.id === 1) {
      setTimeout(() => speak('Let\'s begin. Get comfortable and relax.'), 500);
      setTimeout(() => startBreathingGuide(), 2000);
    } else if (option.id === 2) {
      setTimeout(() => speak('Close your eyes and get comfortable. We\'ll scan through your body.'), 500);
    } else if (option.id === 3) {
      setTimeout(() => speak('Find a comfortable position. Focus on your breath and stay present.'), 500);
    } else {
      setTimeout(() => speak('Relax and enjoy the peaceful sounds.'), 500);
    }

    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;

        // Body scan guidance
        if (option.id === 2) {
          const guide = bodyScanGuides.find(g => g.time === newTime);
          if (guide) speak(guide.text);
        }

        // Mindfulness guidance
        if (option.id === 3) {
          const guide = mindfulnessGuides.find(g => g.time === newTime);
          if (guide) speak(guide.text);
        }

        if (newTime >= option.duration) {
          handleEndSession();
          return option.duration;
        }
        return newTime;
      });
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      const option = meditationOptions.find(opt => opt.id === selectedCard);
      playSound(option.soundFreq);

      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= option.duration) {
            handleEndSession();
            return option.duration;
          }
          return newTime;
        });
      }, 1000);

      if (option.id === 1) {
        startBreathingGuide();
      }
    } else {
      setIsPaused(true);
      stopSound();
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearBreathingGuide();
    }
  };

  // Fetch stats function
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meditation/stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSessionCompleted(data.total_sessions);
        setTotalMinutes(data.total_minutes);
        setCurrentStreak(data.streak);
      }
    } catch (e) {
      console.error("Failed to fetch meditation stats", e);
    }
  };

  // Fetch stats on load
  useEffect(() => {
    fetchStats();
  }, []);

  const handleEndSession = async () => {
    const minutes = Math.floor(timeElapsed / 60);
    // Optimistic update
    setSessionCompleted(prev => prev + 1);
    setTotalMinutes(prev => prev + minutes);

    speak('Great job! Session complete.');

    // Save to backend
    try {
      const option = meditationOptions.find(opt => opt.id === selectedCard);
      await fetch(`${API_URL}/api/meditation/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration: timeElapsed, // Send seconds
          session_type: option ? option.category : 'meditation'
        })
      });
      await fetchStats();
    } catch (e) {
      console.error("Failed to save session", e);
    }

    setIsSessionActive(false);
    setIsPaused(false);
    setTimeElapsed(0);
    setBreathPhase('');
    stopSound();
    if (intervalRef.current) clearInterval(intervalRef.current);
    clearBreathingGuide();
  };

  const handleReset = () => {
    setTimeElapsed(0);
    setBreathCount(0);
    const option = meditationOptions.find(opt => opt.id === selectedCard);
    if (!isPaused) {
      stopSound();
      playSound(option.soundFreq);
      if (option.id === 1) {
        clearBreathingGuide();
        startBreathingGuide();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopSound();
    } else {
      const option = meditationOptions.find(opt => opt.id === selectedCard);
      if (option && !isPaused) {
        playSound(option.soundFreq);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearBreathingGuide();
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedOption = meditationOptions.find(opt => opt.id === selectedCard);
  const progress = selectedOption ? (timeElapsed / selectedOption.duration) * 100 : 0;

  // Breathing animation scale
  const getBreathScale = () => {
    if (breathPhase === 'Breathe In') return 'scale-150';
    if (breathPhase === 'Breathe Out') return 'scale-75';
    return 'scale-100';
  };

  if (isSessionActive) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${selectedOption.bgGradient} text-gray-100 p-4 md:p-8 flex items-center justify-center relative overflow-hidden`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
          <div className="absolute top-10 left-10 text-9xl opacity-20 animate-pulse">
            {selectedOption.bgPattern}
          </div>
          <div className="absolute bottom-20 right-20 text-9xl opacity-20 animate-pulse delay-1000">
            {selectedOption.bgPattern}
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-5">
            {selectedOption.bgPattern}
          </div>
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-10 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">

            {/* Ambient Background Animation */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-700/50 hover:bg-slate-600 transition-all z-10"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Session Title */}
            <div className="text-center mb-6 relative z-10">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50 transition-transform duration-${breathDuration * 1000} ${selectedOption.id === 1 ? getBreathScale() : ''}`}>
                  {selectedOption.icon === Brain ? (
                    <Brain className="w-12 h-12 text-white" />
                  ) : (
                    <Music className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {selectedOption.title}
              </h2>
            </div>

            {/* Breathing Guide Display */}
            {selectedOption.id === 1 && breathPhase && (
              <div className="text-center mb-6 relative z-10">
                <div className={`inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-400/50 transition-all duration-1000 ${getBreathScale()}`}>
                  <p className="text-2xl md:text-3xl font-bold text-indigo-300">
                    {breathPhase}
                  </p>
                </div>
                <p className="text-gray-400 mt-3 text-sm">Breath Cycle: {breathCount}</p>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center mb-5 relative z-10">
              <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-gray-400 text-xs md:text-sm">
                of {formatTime(selectedOption.duration)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 relative z-10">
              <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-linear rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <span>0%</span>
                <span>{Math.round(progress)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 justify-center items-center relative z-10">
              <button
                onClick={handleReset}
                className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handlePauseResume}
                className="p-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-indigo-500/50"
              >
                {isPaused ? (
                  <Play className="w-7 h-7" />
                ) : (
                  <Pause className="w-7 h-7" />
                )}
              </button>

              <button
                onClick={handleEndSession}
                className="p-3 rounded-full bg-slate-700 hover:bg-red-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                title="End Session"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Text */}
            <div className="text-center mt-5 relative z-10">
              <p className="text-gray-400 text-xs md:text-sm">
                {isPaused ? '⏸ Paused - Resume when ready' : '🧘 Stay present and breathe'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Guided Meditation
            </h1>
          </div>
          <p className="text-xl text-gray-400 mb-4">Choose your meditation journey</p>

          {/* Streak Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full px-4 py-2">
            <Award className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-semibold">{currentStreak} Day Streak! 🔥</span>
          </div>
        </div>

        {/* Stats Section - Moved to top */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm uppercase tracking-wider">
                Sessions This Week
              </h4>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {sessionCompleted}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm uppercase tracking-wider">
                Total Minutes
              </h4>
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {totalMinutes}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm uppercase tracking-wider">
                Current Streak
              </h4>
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {currentStreak} days
            </p>
          </div>
        </div>

        {/* Meditation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meditationOptions.map((option) => {
            const IconComponent = option.icon;

            return (
              <div
                key={option.id}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-slate-700 hover:border-indigo-400 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
              >
                {/* Difficulty Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${option.difficulty === 'Beginner'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                    {option.difficulty}
                  </span>
                </div>

                <div className="relative mt-4">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-slate-700 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 transition-all duration-300">
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-center mb-3 text-gray-100">
                    {option.title}
                  </h3>

                  {/* Description */}
                  <p className="text-center text-gray-400 mb-3 text-sm leading-relaxed">
                    {option.description}
                  </p>

                  {/* Benefits */}
                  <div className="mb-4 space-y-1">
                    {option.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Duration & Guide Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-indigo-400 text-sm font-semibold">
                      {Math.floor(option.duration / 60)} min
                    </p>
                    {option.hasGuide && (
                      <span className="text-xs text-purple-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        Voice Guided
                      </span>
                    )}
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={() => handleStartSession(option)}
                    className="w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 bg-slate-700 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg group-hover:shadow-indigo-500/30"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Session</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips Section */}
        <div className="mt-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-indigo-500/30">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Meditation Tips
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="text-2xl">🧘‍♀️</div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Find Your Space</h4>
                <p className="text-sm text-gray-400">Choose a quiet, comfortable place where you won't be disturbed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">⏰</div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Consistency Matters</h4>
                <p className="text-sm text-gray-400">Practice at the same time daily to build a lasting habit</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">🎧</div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Use Headphones</h4>
                <p className="text-sm text-gray-400">For the best experience, use headphones for voice guidance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">💭</div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Don't Judge</h4>
                <p className="text-sm text-gray-400">Let thoughts come and go naturally without judgment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meditation;