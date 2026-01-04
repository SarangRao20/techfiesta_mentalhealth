import React, { useState, useEffect, useRef } from 'react';
import { Heart, Info, Activity } from 'lucide-react';

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
    '4-4-4-4': { inhale: 4, hold1: 4, exhaale: 4, hold2: 4, name: 'Box Breathing' },
    '4-7-8': { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: 'Sleep Breathing' },
    '6-2-6-2': { inhale: 6, hold1: 2, exhale: 6, hold2: 2, name: 'Calm Breathing' },
    'emergency': { inhale: 3, hold1: 0, exhale: 3, hold2: 0, name: 'Emergency' }
  };

  useEffect(() => {
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

  const startBreathing = () => {
    setBreathingActive(true);
    sessionStartTime.current = Date.now();
    setCurrentPhase(0);
    
    nextBreathingPhase(0);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    
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
      if (breathingActive) {
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

  const saveBreathingSession = () => {
    if (!sessionStartTime.current) return;
    
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    setTodaySessions(prev => prev + 1);
    setTotalMinutes(prev => prev + Math.floor(duration / 60));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">📱 AR Breathing Exercise</h1>
          <p className="text-lg text-gray-600">Augmented Reality guided breathing for anxiety relief</p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-6 mb-4 border-l-4 border-red-500 shadow-lg">
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Info className="text-red-500" />
            {useFallback ? 'Using Fallback Mode:' : 'How to Use AR Breathing:'}
          </h5>
          {useFallback ? (
            <p className="text-gray-700">
              Camera access not available. Using standard 3D breathing guide instead. The breathing sphere will appear in the center of your screen.
            </p>
          ) : (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Allow Camera Access:</strong> Click "Allow" when prompted for camera permissions</li>
              <li><strong>Point Camera:</strong> Point your phone/webcam at any flat surface</li>
              <li><strong>Follow the Guide:</strong> A 3D breathing sphere will appear in your real environment</li>
              <li><strong>Breathe with the Sphere:</strong> Inhale when it grows, exhale when it shrinks</li>
              <li><strong>Emergency Mode:</strong> Red panic button for immediate anxiety relief</li>
            </ul>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 mb-4 shadow-lg">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Choose Breathing Pattern
          </h4>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {Object.entries(patterns).map(([key, pattern]) => (
              <button
                key={key}
                onClick={() => handlePatternChange(key)}
                className={`px-6 py-3 rounded-full transition-all ${
                  selectedPattern === key
                    ? 'bg-white/30 shadow-lg scale-105'
                    : 'bg-white/20 hover:bg-white/30'
                } text-white backdrop-blur-md`}
              >
                {key === '4-4-4-4' && '📦 Box Breathing (4-4-4-4)'}
                {key === '4-7-8' && '🌙 Sleep Breathing (4-7-8)'}
                {key === '6-2-6-2' && '🧘 Calm Breathing (6-2-6-2)'}
                {key === 'emergency' && '🚨 Emergency (3-3-3)'}
              </button>
            ))}
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={startBreathing}
              className="px-8 py-3 bg-white text-red-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Start AR Breathing
            </button>
            <button
              onClick={stopBreathing}
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors backdrop-blur-md"
            >
              Stop
            </button>
          </div>
        </div>

        {/* AR Container */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl mb-6" style={{ height: '70vh' }}>
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full z-10">
            <div className="text-lg font-semibold">{phaseText}</div>
            <div className="text-sm opacity-80">{patternInfo}</div>
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
                  opacity="0.4"
                  material="transparent: true"
                />
                <a-ring
                  position="0 0 0"
                  radius-inner="0.5"
                  radius-outer="0.7"
                  color="#4ecdc4"
                  opacity="0.6"
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
            
            <a-entity id="markerlessBreathing" visible={useFallback} position="0 0 -3">
              <a-sphere
                id="fallbackSphere"
                position="0 0 0"
                radius="0.3"
                color="#ff6b6b"
                opacity="0.9"
                material="transparent: true"
              >
                <a-ring
                  position="0 0 0"
                  radius-inner="0.4"
                  radius-outer="0.6"
                  color="#4ecdc4"
                  opacity="0.6"
                  rotation="90 0 0"
                />
              </a-sphere>
              
              <a-text
                value="Follow the breathing sphere"
                position="0 1 0"
                align="center"
                color="#ffffff"
                scale="1.2 1.2 1.2"
              />
            </a-entity>

            <a-entity camera look-controls-enabled="false" wasd-controls-enabled="false" />
          </a-scene>
        </div>

        {/* Emergency Button */}
        <button
          onClick={emergencyBreathing}
          className="fixed bottom-5 right-5 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl hover:scale-110 transition-transform z-50 flex flex-col items-center justify-center animate-pulse"
        >
          <Heart className="w-8 h-8" />
          <span className="text-xs mt-1">SOS</span>
        </button>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-green-600">{todaySessions}</h3>
            <p className="text-gray-600 mt-2">Sessions Today</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-blue-600">{totalMinutes}</h3>
            <p className="text-gray-600 mt-2">Total Minutes</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-yellow-600">{currentPattern.name.split(' ')[0]}</h3>
            <p className="text-gray-600 mt-2">Current Pattern</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-red-600">{panicUses}</h3>
            <p className="text-gray-600 mt-2">Emergency Uses</p>
          </div>
        </div>

        {/* Alternative Link */}
        <div className="text-center mt-6">
          <p className="text-gray-500">
            Camera not working?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Try Regular Breathing Exercises
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Ar_breathing;