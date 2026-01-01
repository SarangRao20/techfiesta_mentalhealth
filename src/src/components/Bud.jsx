export function Bud({ x, y, rotation, visible, delay }) {
  const uniqueId = `${x}-${y}-${Math.random()}`;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={visible ? 1 : 0}
      style={{
        transition: `opacity 0.6s ease-out ${delay}s`,
      }}
    >
      <defs>
        <linearGradient
          id={`budGrad-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#db2777" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>

        <filter id={`budShadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
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

      {/* Bud base */}
      <ellipse
        cx="0"
        cy="-1"
        rx="3.5"
        ry="5"
        fill={`url(#budGrad-${uniqueId})`}
        filter={`url(#budShadow-${uniqueId})`}
      />

      {/* Bud tip */}
      <ellipse
        cx="0"
        cy="-4"
        rx="2"
        ry="3"
        fill="#9f1239"
        opacity="0.6"
      />

      {/* Highlight */}
      <ellipse
        cx="-1"
        cy="-2"
        rx="1.5"
        ry="2"
        fill="#f9a8d4"
        opacity="0.4"
      />

      {/* Sepal lines */}
      <line x1="0" y1="-5" x2="0" y2="3" stroke="#881337" strokeWidth="0.4" opacity="0.5" />
      <line x1="-2" y1="-4" x2="-2" y2="2" stroke="#881337" strokeWidth="0.3" opacity="0.4" />
      <line x1="2" y1="-4" x2="2" y2="2" stroke="#881337" strokeWidth="0.3" opacity="0.4" />

      {/* Calyx */}
      <ellipse
        cx="0"
        cy="3"
        rx="2.5"
        ry="1.5"
        fill="#567347"
        opacity="0.8"
      />
    </g>
  );
}
