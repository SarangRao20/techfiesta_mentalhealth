export function CherryBlossom({ x, y, visible, delay = 0, size = 'medium' }) {
  const uniqueId = `${x}-${y}-${Math.random()}`;

  const sizes = {
    small: 0.8,
    medium: 0.93,
    large: 1.2,
  };

  const scale = sizes[size] || 1;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      opacity={visible ? 1 : 0}
      style={{
        transition: `opacity 1.2s ease-out ${delay}s`,
      }}
    >
      {visible && (
        <>
          {/* Gentle swaying motion */}
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            values="0,0; 1.5,-1; -1,1.5; 1,0.5; 0,0"
            dur="7s"
            repeatCount="indefinite"
            begin={`${delay}s`}
            additive="sum"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            values="0; 3; -3; 2; 0"
            dur="8s"
            repeatCount="indefinite"
            begin={`${delay}s`}
            additive="sum"
          />
        </>
      )}

      <defs>
        <radialGradient id={`petalGrad-${uniqueId}`}>
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fce7f3" />
          <stop offset="70%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </radialGradient>

        <filter id={`blossomShadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
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
          <path
            d="M 0,-6 Q -5,-8 -6,-12 Q -7,-15 -5,-17 Q -3,-18.5 0,-18 Q 3,-18.5 5,-17 Q 7,-15 6,-12 Q 5,-8 0,-6 Z"
            fill={`url(#petalGrad-${uniqueId})`}
            stroke="#f9a8d4"
            strokeWidth="0.4"
            filter={`url(#blossomShadow-${uniqueId})`}
          />

          <ellipse
            cx="0"
            cy="-16"
            rx="2.5"
            ry="2"
            fill="#f9a8d4"
            opacity="0.3"
          />

          <line
            x1="0"
            y1="-6"
            x2="0"
            y2="-16"
            stroke="#f9a8d4"
            strokeWidth="0.3"
            opacity="0.3"
          />
          <line
            x1="-2"
            y1="-10"
            x2="-4"
            y2="-14"
            stroke="#f9a8d4"
            strokeWidth="0.2"
            opacity="0.2"
          />
          <line
            x1="2"
            y1="-10"
            x2="4"
            y2="-14"
            stroke="#f9a8d4"
            strokeWidth="0.2"
            opacity="0.2"
          />
        </g>
      ))}

      {/* Center */}
      <circle cx="0" cy="0" r="3.5" fill="#be185d" opacity="0.4" />
      <circle cx="0" cy="0" r="2" fill="#9f1239" opacity="0.6" />

      {/* Stamens */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const stamenX = Math.cos(rad) * 2.5;
        const stamenY = Math.sin(rad) * 2.5;

        return (
          <g key={`stamen-${i}`}>
            <line
              x1="0"
              y1="0"
              x2={stamenX}
              y2={stamenY}
              stroke="#881337"
              strokeWidth="0.4"
              opacity="0.7"
            />
            <circle
              cx={stamenX}
              cy={stamenY}
              r="0.6"
              fill="#fde047"
              stroke="#eab308"
              strokeWidth="0.2"
              opacity="0.9"
            />
          </g>
        );
      })}

      {/* Center texture dots */}
      {Array.from({ length: 15 }).map((_, i) => {
        const angle = (i * 24 * Math.PI) / 180;
        const radius = 0.5 + Math.random() * 1.2;
        const dotX = Math.cos(angle) * radius;
        const dotY = Math.sin(angle) * radius;

        return (
          <circle
            key={`dot-${i}`}
            cx={dotX}
            cy={dotY}
            r="0.25"
            fill="#450a0a"
            opacity="0.5"
          />
        );
      })}
    </g>
  );
}
