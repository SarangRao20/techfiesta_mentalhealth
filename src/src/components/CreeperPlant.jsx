import { useState, useEffect } from 'react';
import { Stem } from './Stem';

export function CreeperPlant({ growth }) {
  const [dimensions, setDimensions] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        w: window.innerWidth,
        h: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { w, h } = dimensions;

  // Aesthetic framing vines that grow from the corners
  // Removing mid-screen "floating" vines to fix the "randomly positioned" feel.
  // Focusing on lush, dense growth originating strictly from the four corners/edges.

  const vinePaths = [
    // Top Left - Lush Draping Vine (Primary)
    {
      id: 'tl-main',
      path: `M 0,-10 Q 50,80 120,120 T 250,200 T 320,350`,
      leaves: [
        { percent: 5, side: 'right' }, { percent: 12, side: 'left' },
        { percent: 18, side: 'right' }, { percent: 25, side: 'left' },
        { percent: 32, side: 'right' }, { percent: 40, side: 'left' },
        { percent: 48, side: 'right' }, { percent: 55, side: 'left' },
        { percent: 62, side: 'right' }, { percent: 70, side: 'left' },
        { percent: 78, side: 'right' }, { percent: 85, side: 'left' },
        { percent: 92, side: 'right' }, { percent: 98, side: 'left' },
      ],
      buds: [
        { percent: 15, side: 'left', bloomAt: 35 },
        { percent: 30, side: 'right', bloomAt: 55 },
        { percent: 50, side: 'left', bloomAt: 75 },
        { percent: 75, side: 'right', bloomAt: 90 },
        { percent: 90, side: 'left', bloomAt: 98 },
      ],
    },
    // Top Left - Secondary Tendril (Hugging top edge)
    {
      id: 'tl-top',
      path: `M -10,20 Q 80,30 180,20 T 350,40`,
      leaves: [
        { percent: 20, side: 'left' }, { percent: 45, side: 'right' },
        { percent: 70, side: 'left' }, { percent: 90, side: 'right' },
      ],
      buds: [
        { percent: 40, side: 'right', bloomAt: 60 },
        { percent: 85, side: 'left', bloomAt: 95 },
      ],
    },

    // Top Right - Main Drape (Curving inwards)
    {
      id: 'tr-main',
      path: `M ${w},-10 Q ${w - 60},80 ${w - 140},140 T ${w - 280},220`,
      leaves: [
        { percent: 10, side: 'left' }, { percent: 22, side: 'right' },
        { percent: 35, side: 'left' }, { percent: 48, side: 'right' },
        { percent: 60, side: 'left' }, { percent: 75, side: 'right' },
        { percent: 88, side: 'left' },
      ],
      buds: [
        { percent: 25, side: 'right', bloomAt: 45 },
        { percent: 55, side: 'left', bloomAt: 75 },
        { percent: 85, side: 'right', bloomAt: 95 },
      ],
    },
    // Top Right - Secondary (Hugging right edge)
    {
      id: 'tr-side',
      path: `M ${w},40 Q ${w - 40},100 ${w - 30},200 T ${w - 50},350`,
      leaves: [
        { percent: 15, side: 'left' }, { percent: 35, side: 'right' },
        { percent: 55, side: 'left' }, { percent: 75, side: 'right' },
        { percent: 95, side: 'left' },
      ],
      buds: [
        { percent: 30, side: 'left', bloomAt: 50 },
        { percent: 70, side: 'right', bloomAt: 85 },
      ],
    },

    // Bottom Left - Climber (Tall and graceful)
    {
      id: 'bl-tall',
      path: `M 10,${h + 10} Q 60,${h - 100} 100,${h - 250} T 180,${h - 450} T 300,${h - 600}`,
      leaves: [
        { percent: 5, side: 'right' }, { percent: 12, side: 'left' },
        { percent: 18, side: 'right' }, { percent: 26, side: 'left' },
        { percent: 34, side: 'right' }, { percent: 42, side: 'left' },
        { percent: 50, side: 'right' }, { percent: 58, side: 'left' },
        { percent: 66, side: 'right' }, { percent: 74, side: 'left' },
        { percent: 82, side: 'right' }, { percent: 90, side: 'left' },
        { percent: 98, side: 'right' },
      ],
      buds: [
        { percent: 20, side: 'left', bloomAt: 40 },
        { percent: 45, side: 'right', bloomAt: 60 },
        { percent: 65, side: 'left', bloomAt: 80 },
        { percent: 85, side: 'right', bloomAt: 95 },
      ],
    },
    // Bottom Left - Floor Runner
    {
      id: 'bl-floor',
      path: `M -10,${h - 20} Q 100,${h - 40} 250,${h - 30} T 450,${h - 50}`,
      leaves: [
        { percent: 15, side: 'right' }, { percent: 35, side: 'left' },
        { percent: 55, side: 'right' }, { percent: 75, side: 'left' },
        { percent: 95, side: 'right' },
      ],
      buds: [
        { percent: 40, side: 'left', bloomAt: 60 },
        { percent: 80, side: 'right', bloomAt: 90 },
      ],
    },

    // Bottom Right - Climber
    {
      id: 'br-tall',
      path: `M ${w - 20},${h + 10} Q ${w - 80},${h - 150} ${w - 150},${h - 300} T ${w - 300},${h - 480}`,
      leaves: [
        { percent: 8, side: 'left' }, { percent: 16, side: 'right' },
        { percent: 24, side: 'left' }, { percent: 32, side: 'right' },
        { percent: 40, side: 'left' }, { percent: 50, side: 'right' },
        { percent: 60, side: 'left' }, { percent: 70, side: 'right' },
        { percent: 80, side: 'left' }, { percent: 90, side: 'right' },
      ],
      buds: [
        { percent: 25, side: 'right', bloomAt: 45 },
        { percent: 55, side: 'left', bloomAt: 75 },
        { percent: 85, side: 'right', bloomAt: 95 },
      ],
    },
    // Bottom Right - Floor Runner
    {
      id: 'br-floor',
      path: `M ${w + 10},${h - 30} Q ${w - 120},${h - 40} ${w - 280},${h - 50}`,
      leaves: [
        { percent: 20, side: 'left' }, { percent: 50, side: 'right' },
        { percent: 80, side: 'left' },
      ],
      buds: [
        { percent: 60, side: 'right', bloomAt: 80 },
      ],
    }
  ];

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {vinePaths.map(branch => (
          <Stem
            key={branch.id}
            path={branch.path}
            growth={growth}
            leaves={branch.leaves}
            buds={branch.buds}
          />
        ))}
      </svg>
    </div>
  );
}
