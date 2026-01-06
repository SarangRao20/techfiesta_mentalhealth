import React, { useState, useEffect, useRef } from 'react';
import { Heart, Info, Activity, Camera, X } from 'lucide-react';
import { API_URL } from '../config';

const Ar_breathing = () => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [currentPattern, setCurrentPattern] = useState({ inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'Box Breathing' });
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseText, setPhaseText] = useState('Get Ready...');
  const [patternInfo, setPatternInfo] = useState('Box Breathing: In-4, Hold-4, Out-4, Hold-4');
  const [todaySessions, setTodaySessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [panicUses, setPanicUses] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState('4-4-4-4');
  const [arInitialized, setArInitialized] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const breathingInterval = useRef(null);
  const sessionStartTime = useRef(null);
  const phaseTimeout = useRef(null);

  const patterns = {
    '4-4-4-4': { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'Box Breathing' },
    '4-7-8': { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: 'Sleep Breathing' },
    '6-2-6-2': { inhale: 6, hold1: 2, exhale: 6, hold2: 2, name: 'Calm Breathing' },
    'emergency': { inhale: 3, hold1: 0, exhale: 3, hold2: 0, name: 'Emergency' }
  };

  useEffect(() => {
    // Load stats
    fetchStats();

    // Load A-Frame and AR.js scripts
    const loadScripts = async () => {
      // Load A-Frame
      if (!window.AFRAME) {
        const aframeScript = document.createElement('script');
        aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
        aframeScript.async = true;
        document.head.appendChild(aframeScript);

        await new Promise(resolve => {
          aframeScript.onload = resolve;
        });
      }

      // Load AR.js
      if (!window.ARJS) {
        const arjsScript = document.createElement('script');
        arjsScript.src = 'https://cdn.jsdelivr.net/npm/ar.js@3.4.5/aframe/build/aframe-ar.js';
        arjsScript.async = true;
        document.head.appendChild(arjsScript);

        await new Promise(resolve => {
          arjsScript.onload = resolve;
        });
      }

      initializeAR();
    };

    loadScripts();

    return () => {
      if (breathingInterval.current) clearInterval(breathingInterval.current);
      if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meditation/stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTodaySessions(data.total_sessions);
        setTotalMinutes(data.total_minutes);
      }
    } catch (e) { console.error(e); }
  };

  const initializeAR = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUseFallback(true);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setArInitialized(true);
      })
      .catch(() => {
        setUseFallback(true);
      });
  };

  const handlePatternChange = (patternName) => {
    const pattern = patterns[patternName];
    setCurrentPattern(pattern);
    setSelectedPattern(patternName);

    const infoTexts = {
      '4-7-8': 'Sleep Breathing: In-4, Hold-7, Out-8',
      '6-2-6-2': 'Calm Breathing: In-6, Hold-2, Out-6, Hold-2',
      'emergency': 'Emergency: Quick In-3, Out-3 (for panic attacks)',
      '4-4-4-4': 'Box Breathing: In-4, Hold-4, Out-4, Hold-4'
    };

    setPatternInfo(infoTexts[patternName]);

    if (breathingActive) {
      stopBreathing();
      setTimeout(() => startBreathing(), 500);
    }
  };

  const isBreathingRef = useRef(false);

  // ... (keep existing refs)

  const startBreathing = () => {
    setBreathingActive(true);
    isBreathingRef.current = true;
    sessionStartTime.current = Date.now();
    setCurrentPhase(0);
    nextBreathingPhase(0);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    isBreathingRef.current = false;

    if (breathingInterval.current) {
      clearInterval(breathingInterval.current);
      breathingInterval.current = null;
    }

    if (phaseTimeout.current) {
      clearTimeout(phaseTimeout.current);
      phaseTimeout.current = null;
    }

    setPhaseText('Breathing Stopped');

    if (sessionStartTime.current && (Date.now() - sessionStartTime.current) > 30000) {
      saveBreathingSession();
    }
  };

  const nextBreathingPhase = (phase) => {
    if (!isBreathingRef.current) return;

    const phases = ['inhale', 'hold1', 'exhale', 'hold2'];
    const phaseNames = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
    const phaseDurations = [
      currentPattern.inhale,
      currentPattern.hold1,
      currentPattern.exhale,
      currentPattern.hold2
    ];

    let currentPhaseIndex = phase;

    // Skip phases with 0 duration
    while (phaseDurations[currentPhaseIndex] === 0) {
      currentPhaseIndex = (currentPhaseIndex + 1) % 4;
    }

    const phaseName = phaseNames[currentPhaseIndex];
    const duration = phaseDurations[currentPhaseIndex];

    setPhaseText(`${phaseName} (${duration}s)`);
    setCurrentPhase(currentPhaseIndex);

    updateSphereAnimation(phases[currentPhaseIndex], duration);

    phaseTimeout.current = setTimeout(() => {
      if (isBreathingRef.current) {
        const nextPhase = (currentPhaseIndex + 1) % 4;
        nextBreathingPhase(nextPhase);
      }
    }, duration * 1000);
  };

  const updateSphereAnimation = (phase, duration) => {
    const sphere = document.querySelector('#arBreathingSphere');
    const fallbackSphere = document.querySelector('#fallbackSphere');
    const arText = document.querySelector('#arBreathingText');

    const phaseNames = {
      'inhale': 'Breathe In',
      'exhale': 'Breathe Out',
      'hold1': 'Hold',
      'hold2': 'Hold'
    };

    let scale, color;
    if (phase === 'inhale') {
      scale = '2 2 2';
      color = '#4ecdc4';
    } else if (phase === 'exhale') {
      scale = '0.5 0.5 0.5';
      color = '#ff6b6b';
    } else {
      scale = '1.5 1.5 1.5';
      color = '#feca57';
    }

    if (sphere) {
      sphere.removeAttribute('animation');
      sphere.setAttribute('animation', `property: scale; to: ${scale}; dur: ${duration * 1000}; easing: easeInOutSine`);
      sphere.setAttribute('color', color);
    }

    if (fallbackSphere) {
      fallbackSphere.removeAttribute('animation');
      fallbackSphere.setAttribute('animation', `property: scale; to: ${scale}; dur: ${duration * 1000}; easing: easeInOutSine`);
      fallbackSphere.setAttribute('color', color);
    }

    if (arText) {
      arText.setAttribute('value', phaseNames[phase]);
      arText.setAttribute('color', color);
    }
  };

  const emergencyBreathing = () => {
    handlePatternChange('emergency');
    startBreathing();
    setPanicUses(prev => prev + 1);
    setPhaseText('🚨 Emergency Mode - Focus on breathing');

    setTimeout(() => {
      if (breathingActive) {
        stopBreathing();
        alert('Emergency breathing complete. Consider reaching out for support if needed.');
      }
    }, 120000);
  };

  const saveBreathingSession = async () => {
    if (!sessionStartTime.current) return;

    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    setTodaySessions(prev => prev + 1);
    setTotalMinutes(prev => prev + Math.floor(duration / 60));

    try {
      await fetch(`${API_URL}/api/meditation/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration: duration,
          session_type: 'ar_breathing'
        })
      });
    } catch (e) { console.error("Failed to save session", e); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">AR RESONANCE</h1>
          <p className="text-gray-400 font-light">Augmented Reality Breathwork</p>
        </div>

        {/* Instructions */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-white/5 shadow-2xl">
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-400">
            <Info className="w-5 h-5" />
            {useFallback ? 'Using 3D Mode:' : 'How to Use AR:'}
          </h5>
          {useFallback ? (
            <p className="text-gray-400 font-light">
              Camera access not available. Using standard 3D breathing guide. The Sphere will guide you.
            </p>
          ) : (
            <ul className="list-disc list-inside space-y-2 text-gray-400 font-light text-sm">
              <li><strong>Allow Camera:</strong> Enable camera permissions.</li>
              <li><strong>Point & Focus:</strong> Point your camera at a flat surface.</li>
              <li><strong>Sync Breath:</strong> Inhale as the orb expands, exhale as it contracts.</li>
            </ul>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 mb-6 border border-white/10 shadow-lg">
          <h4 className="text-xl font-light text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Select Resonance Pattern
          </h4>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Object.entries(patterns).map(([key, pattern]) => (
              <button
                key={key}
                onClick={() => handlePatternChange(key)}
                className={`px-6 py-3 rounded-full transition-all text-sm font-light tracking-wide ${selectedPattern === key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
              >
                {pattern.name}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6">
            <button
              onClick={startBreathing}
              disabled={breathingActive}
              className={`px-10 py-4 rounded-full font-semibold transition-all ${breathingActive ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-purple-50 hover:text-purple-900 hover:scale-105'
                }`}
            >
              Initialize Session
            </button>
            <button
              onClick={stopBreathing}
              disabled={!breathingActive}
              className="px-10 py-4 border border-white/20 text-white rounded-full hover:bg-red-900/20 hover:border-red-500/50 transition-all font-light"
            >
              Terminate
            </button>
          </div>
        </div>

        {/* AR Container */}
        <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl my-12 border border-white/5" style={{ height: '60vh' }}>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-8 py-4 rounded-full z-10 border border-white/10 pointer-events-none transition-all duration-300">
            <div className="text-2xl font-light tracking-wider text-center whitespace-nowrap">{phaseText}</div>
            <div className="text-xs text-blue-300 text-center mt-1 uppercase tracking-[0.2em]">{currentPattern.name}</div>
          </div>

          <a-scene
            id="arScene"
            embedded
            arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; trackingMethod: best;"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            style={{ height: '100%', width: '100%' }}
          >
            <a-marker preset="hiro" id="breathingMarker">
              <a-sphere
                id="arBreathingSphere"
                position="0 0.5 0"
                radius="0.4"
                color="#ff6b6b"
                opacity="0.9"
                material="transparent: true; shader: standard"
              >
                <a-sphere
                  radius="0.45"
                  color="#ffffff"
                  opacity="0.3"
                  material="transparent: true"
                />
                <a-ring
                  position="0 0 0"
                  radius-inner="0.5"
                  radius-outer="0.7"
                  color="#4ecdc4"
                  opacity="0.5"
                  rotation="90 0 0"
                />
              </a-sphere>

              <a-text
                id="arBreathingText"
                value="Breathe In..."
                position="0 1.8 0"
                align="center"
                color="#ffffff"
                scale="2 2 2"
              />
            </a-marker>

            <a-entity id="markerlessBreathing" visible={useFallback} position="0 0 -4">
              <a-sphere
                id="fallbackSphere"
                position="0 0 0"
                radius="0.5"
                color="#ff6b6b"
                opacity="0.9"
                material="transparent: true"
              >
                <a-ring
                  position="0 0 0"
                  radius-inner="0.6"
                  radius-outer="0.8"
                  color="#4ecdc4"
                  opacity="0.5"
                  rotation="90 0 0"
                />
              </a-sphere>
            </a-entity>

            <a-entity camera look-controls-enabled="false" wasd-controls-enabled="false" />
          </a-scene>
        </div>

        {/* Emergency Button */}
        <button
          onClick={emergencyBreathing}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-red-600/90 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-110 hover:bg-red-500 transition-all z-50 flex items-center justify-center animate-pulse"
        >
          <Heart className="w-6 h-6 fill-white" />
        </button>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
            <h3 className="text-2xl font-bold text-blue-400">{todaySessions}</h3>
            <p className="text-gray-500 text-xs uppercase mt-2">Sessions Today</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
            <h3 className="text-2xl font-bold text-purple-400">{totalMinutes}</h3>
            <p className="text-gray-500 text-xs uppercase mt-2">Total Minutes</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
            <h3 className="text-2xl font-bold text-emerald-400">{selectedPattern.split('-')[1] || '4'}s</h3>
            <p className="text-gray-500 text-xs uppercase mt-2">Avg Hold Time</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
            <h3 className="text-2xl font-bold text-red-400">{panicUses}</h3>
            <p className="text-gray-500 text-xs uppercase mt-2">SOS Activations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ar_breathing;