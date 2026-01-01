export function Leaf({ x, y, rotation, visible, delay }) {
  const uniqueId = `${x}-${y}-${Math.random()}`;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={visible ? 1 : 0}
      style={{
        transition: `opacity 0.6s ease-out ${delay}s`,
        transformOrigin: 'center',
      }}
    >
      <defs>
        <linearGradient
          id={`leafGrad-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        <filter id={`leafShadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0" dy="1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Leaf shape */}
      <path
        d="M 0,0 Q 6,-8 8,-16 Q 9,-22 8,-28 Q 7,-32 5,-34 Q 3,-36 0,-37 Q -3,-36 -5,-34 Q -7,-32 -8,-28 Q -9,-22 -8,-16 Q -6,-8 0,0 Z"
        fill={`url(#leafGrad-${uniqueId})`}
        stroke="#15803d"
        strokeWidth="0.8"
        filter={`url(#leafShadow-${uniqueId})`}
      />

      {/* Center vein */}
      <line
        x1="0"
        y1="-2"
        x2="0"
        y2="-35"
        stroke="#15803d"
        strokeWidth="1"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Side veins */}
      <line x1="0" y1="-8" x2="-4" y2="-12" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />
      <line x1="0" y1="-8" x2="4" y2="-12" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />

      <line x1="0" y1="-15" x2="-5" y2="-18" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />
      <line x1="0" y1="-15" x2="5" y2="-18" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />

      <line x1="0" y1="-22" x2="-6" y2="-25" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />
      <line x1="0" y1="-22" x2="6" y2="-25" stroke="#15803d" strokeWidth="0.6" opacity="0.4" />

      <line x1="0" y1="-28" x2="-4" y2="-30" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
      <line x1="0" y1="-28" x2="4" y2="-30" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}
