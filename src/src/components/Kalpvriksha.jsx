import { useState, useEffect, useRef } from 'react';
import { CreeperPlant } from './CreeperPlant';

export default function Kalpvriksha() {
  const [growth, setGrowth] = useState(0);
  const targetGrowthRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Calculate target growth from intent history
  const calculateGrowthFromHistory = () => {
    try {
      const historyStr = localStorage.getItem('intent_history');
      if (!historyStr) return 0;

      const history = JSON.parse(historyStr);
      if (!Array.isArray(history)) return 0;

      let lastConfidence = 0; // 👈 this is your "empty var"

      const totalScore = history.reduce((acc, item) => {
        const current = Number(item.confidence_score) || 0;

        // 🔑 YOUR LOGIC
        const effectiveConfidence =
          current > lastConfidence ? current : lastConfidence;

        lastConfidence = effectiveConfidence;

        const normalized = (effectiveConfidence) * 5;
        return acc + normalized;
      }, 0);

      return Math.min(totalScore, 100);
    } catch (e) {
      console.error("Error calculating growth:", e);
      return 0;
    }
  };


  useEffect(() => {
    const updateTarget = () => {
      const target = calculateGrowthFromHistory();
      targetGrowthRef.current = target;
    };

    updateTarget();

    // Poll every 2 seconds for updates
    const interval = setInterval(updateTarget, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      setGrowth(prev => {
        const target = targetGrowthRef.current;
        const diff = target - prev;

        if (Math.abs(diff) < 0.1) return prev;

        // Smooth interpolation
        return prev + diff * 0.05;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none">
      <CreeperPlant growth={growth} />
    </div>
  );
}
