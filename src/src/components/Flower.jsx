export function Flower({ x, y, color, visible, delay = 0 }) {
  const uniqueId = `${x}-${y}-${Math.random()}`;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={visible ? 1 : 0}
      style={{
        transition: `opacity 0.8s ease-out ${delay}s`,
        transformOrigin: 'center',
      }}
    >
      <defs>
        <radialGradient id={`petalGrad-${uniqueId}`}>
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="40%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </radialGradient>

        <filter id={`flowerShadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Petals */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <g key={i} transform={`rotate(${angle})`}>
          <ellipse
            cx="0"
            cy="-10"
            rx="5"
            ry="8"
            fill={`url(#petalGrad-${uniqueId})`}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.95"
            filter={`url(#flowerShadow-${uniqueId})`}
          />
          <line
            x1="0"
            y1="-3"
            x2="0"
            y2="-15"
            stroke={color}
            strokeWidth="0.4"
            opacity="0.3"
          />
        </g>
      ))}

      {/* Center */}
      <circle
        cx="0"
        cy="0"
        r="4"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.5"
        filter={`url(#flowerShadow-${uniqueId})`}
      />

      {/* Center texture */}
      <circle cx="-1.5" cy="-1" r="0.6" fill="#f59e0b" opacity="0.8" />
      <circle cx="1.5" cy="-1" r="0.6" fill="#f59e0b" opacity="0.8" />
      <circle cx="0" cy="1" r="0.6" fill="#f59e0b" opacity="0.8" />
      <circle cx="-1" cy="0.5" r="0.5" fill="#d97706" opacity="0.6" />
      <circle cx="1" cy="0.5" r="0.5" fill="#d97706" opacity="0.6" />
      <circle cx="0" cy="-1.5" r="0.5" fill="#d97706" opacity="0.6" />

      {/* Stamens */}
      {[0, 120, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const stamenX = Math.cos(rad) * 2;
        const stamenY = Math.sin(rad) * 2;

        return (
          <g key={`stamen-${i}`}>
            <line
              x1="0"
              y1="0"
              x2={stamenX}
              y2={stamenY}
              stroke="#d97706"
              strokeWidth="0.4"
              opacity="0.7"
            />
            <circle
              cx={stamenX}
              cy={stamenY}
              r="0.5"
              fill="#fbbf24"
              opacity="0.9"
            />
          </g>
        );
      })}
    </g>
  );
}
