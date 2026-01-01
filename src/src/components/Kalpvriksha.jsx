import { useState, useEffect } from 'react';
import { CreeperPlant } from './CreeperPlant';
import { GrowthControls } from './GrowthControls';

export default function Kalpvriksha() {
  const [growth, setGrowth] = useState(0);
  const [weight, setWeight] = useState(0);

  // Auto-grow based on weight
  useEffect(() => {
    const targetGrowth = Math.min(weight * 2, 100);

    if (growth < targetGrowth) {
      const timer = setTimeout(() => {
        setGrowth(prev => Math.min(prev + 0.5, targetGrowth));
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [growth, weight]);

  const addWeight = (amount) => {
    setWeight(prev => Math.min(prev + amount, 50));
  };

  const reset = () => {
    setGrowth(0);
    setWeight(0);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[black] to-teal-100">
      {/* Creeper plant */}
      <CreeperPlant growth={growth} />

      {/* Controls */}
      <GrowthControls
        weight={weight}
        growth={growth}
        onAddWeight={addWeight}
        onReset={reset}
      />

      {/* Center message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <h1 className="text-emerald-700 opacity-30 mb-4">
          {growth < 30 && '🌱 Plant your seeds of growth...'}
          {growth >= 30 && growth < 60 && '🌿 Nurturing progress...'}
          {growth >= 60 && growth < 90 && '🍃 Flourishing beautifully...'}
          {growth >= 90 && "🌸 In full bloom! You're thriving! 🌺"}
        </h1>

        <p className="text-emerald-600 opacity-25 text-2xl mt-4">
          {growth >= 50 && "Keep going, you're doing great!"}
        </p>
      </div>
    </div>
  );
}
