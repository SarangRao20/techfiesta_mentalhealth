import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Wind, Mountain, Waves, X } from 'lucide-react';
import { API_URL } from '../../config';

const VrMeditation = ({ onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [scene, setScene] = useState('forest');
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);
    const [loaded, setLoaded] = useState(false);

    const scenes = {
        forest: {
            name: 'Peaceful Forest',
            gradient: 'from-green-900 to-emerald-900',
            sky: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg',
            audio: '/assets/audio/nature-documentary-309042.mp3',
            icon: Wind
        },
        ocean: {
            name: 'Calm Beach',
            gradient: 'from-blue-900 to-cyan-900',
            sky: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/cubes.jpg',
            audio: '/assets/audio/waves-382467.mp3',
            icon: Waves
        },
        mountain: {
            name: 'High Mountain',
            gradient: 'from-gray-900 to-stone-900',
            sky: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg',
            audio: '/assets/audio/nostalgic-piano-396511.mp3',
            icon: Mountain
        }
    };

    useEffect(() => {
        // Load A-Frame if not present
        if (!document.querySelector('script[src*="aframe.min.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
            script.async = true;
            script.onload = () => setLoaded(true);
            document.head.appendChild(script);
        } else {
            setLoaded(true);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        if (isPlaying) {
            if (!audioRef.current) {
                audioRef.current = new Audio(scenes[scene].audio);
                audioRef.current.loop = true;
            } else if (audioRef.current.src !== window.location.origin + scenes[scene].audio) {
                audioRef.current.pause();
                audioRef.current = new Audio(scenes[scene].audio);
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(e => console.log("Audio play error", e));
        } else {
            if (audioRef.current) audioRef.current.pause();
        }
    }, [isPlaying, scene]);

    // Timer
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    if (!loaded) return (
        <div className="h-full bg-black flex items-center justify-center p-6">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-sm text-white/60">Loading VR Engine...</p>
            </div>
        </div>
    );

    return (
        <div className="relative h-full bg-black overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-20">
                <div>
                    <h2 className="text-xl font-serif text-white">{scenes[scene].name}</h2>
                    <p className="text-white/60 text-xs mt-0.5">360° VR Experience</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                        <span className="font-mono text-sm text-white">{formatTime(duration)}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                </div>
            </div>

            {/* A-Frame Scene */}
            <div className="flex-1 relative z-0">
                <a-scene embedded style={{ width: '100%', height: '100%' }}>
                    <a-sky src={scenes[scene].sky} rotation="0 -130 0" animation="property: rotation; to: 0 -130 360; dur: 200000; loop: true; easing: linear"></a-sky>

                    {/* Breathing Sphere Guide in VR */}
                    <a-sphere position="0 1.6 -3" radius="0.2" color="white" opacity="0.8"
                        animation="property: scale; to: 1.5 1.5 1.5; dir: alternate; dur: 4000; loop: true; easing: easeInOutSine"
                    >
                        <a-light type="point" color="white" intensity="0.5" distance="5"></a-light>
                    </a-sphere>

                    <a-camera position="0 1.6 0" look-controls="enabled: true">
                        <a-cursor color="white" scale="0.5 0.5 0.5"></a-cursor>
                    </a-camera>
                </a-scene>
            </div>

            {/* Footer Controls */}
            <div className="flex flex-col items-center gap-4 p-4 bg-black/40 backdrop-blur-md border-t border-white/10 z-20">
                {/* Scene Selector */}
                <div className="flex gap-3 p-1.5 bg-black/50 backdrop-blur-lg rounded-xl border border-white/10">
                    {Object.entries(scenes).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setScene(key)}
                                className={`
                                    flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg transition-all
                                    ${scene === key ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <Icon size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">{key}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Control */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        {isPlaying ? <Pause className="text-black fill-current" size={20} /> : <Play className="text-black fill-current ml-0.5" size={20} />}
                    </button>
                    <p className="text-white/50 text-xs font-light tracking-widest uppercase">
                        {isPlaying ? 'Breathe with the sphere' : 'Press Play to Begin'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VrMeditation;
