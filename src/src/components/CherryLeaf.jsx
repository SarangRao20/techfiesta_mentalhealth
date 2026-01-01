export function CherryLeaf({ x, y, rotation, visible, delay }) {
  const uniqueId = `${x}-${y}-${Math.random()}`;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={visible ? 1 : 0}
      style={{
        transition: `opacity 0.6s ease-out ${delay}s`,
      }}
    >
      {visible && (
        <>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            values="0,0; 0.5,-0.5; -0.5,0.5; 0.5,0; 0,0"
            dur="5.5s"
            repeatCount="indefinite"
            begin={`${delay}s`}
            additive="sum"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            values="0; 2; -2; 1; 0"
            dur="6s"
            repeatCount="indefinite"
            begin={`${delay}s`}
            additive="sum"
          />
        </>
      )}

      <defs>
        <linearGradient
          id={`leafGrad-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#86a372" />
          <stop offset="50%" stopColor="#6b8e5a" />
          <stop offset="100%" stopColor="#567347" />
        </linearGradient>

        <filter id={`leafShadow-${uniqueId}`}>
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

      {/* Leaf body */}
      <ellipse
        cx="0"
        cy="-12"
        rx="6"
        ry="12"
        fill={`url(#leafGrad-${uniqueId})`}
        stroke="#567347"
        strokeWidth="0.5"
        filter={`url(#leafShadow-${uniqueId})`}
      />

      {/* Center vein */}
      <line
        x1="0"
        y1="-2"
        x2="0"
        y2="-22"
        stroke="#567347"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Side veins */}
      <line x1="0" y1="-8" x2="-3" y2="-10" stroke="#567347" strokeWidth="0.4" opacity="0.4" />
      <line x1="0" y1="-8" x2="3" y2="-10" stroke="#567347" strokeWidth="0.4" opacity="0.4" />

      <line x1="0" y1="-13" x2="-4" y2="-15" stroke="#567347" strokeWidth="0.4" opacity="0.4" />
      <line x1="0" y1="-13" x2="4" y2="-15" stroke="#567347" strokeWidth="0.4" opacity="0.4" />

      <line x1="0" y1="-18" x2="-3" y2="-19" stroke="#567347" strokeWidth="0.4" opacity="0.4" />
      <line x1="0" y1="-18" x2="3" y2="-19" stroke="#567347" strokeWidth="0.4" opacity="0.4" />
    </g>
  );
}
