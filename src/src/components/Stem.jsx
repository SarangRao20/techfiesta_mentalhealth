import { useEffect, useRef, useState } from 'react';
import { CherryBlossom } from './CherryBlossom';
import { CherryLeaf } from './CherryLeaf';
import { Bud } from './Bud';

export function Stem({ path, growth, leaves, buds }) {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [path]);

  const drawLength = (growth / 100) * pathLength;

  // Get point along path
  const getPointAtPercent = (percent) => {
    if (!pathRef.current) return { x: 0, y: 0, angle: 0 };

    const length = pathLength * (percent / 100);
    const point = pathRef.current.getPointAtLength(length);

    const nextPoint = pathRef.current.getPointAtLength(
      Math.min(length + 5, pathLength)
    );

    const angle =
      Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
      (180 / Math.PI);

    return { x: point.x, y: point.y, angle };
  };

  return (
    <g>
      {/* Main branch */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="#3e2723"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength - drawLength}
        style={{
          transition: 'stroke-dashoffset 0.3s ease-out',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
      />

      {/* Branch texture */}
      <path
        d={path}
        fill="none"
        stroke="#4e342e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength - drawLength}
        opacity="0.6"
        style={{
          transition: 'stroke-dashoffset 0.3s ease-out',
        }}
      />

      {/* Leaves */}
      {leaves.map((leaf, i) => {
        const shouldShow = growth >= leaf.percent;
        if (!shouldShow) return null;

        const point = getPointAtPercent(leaf.percent);
        const leafAngle =
          leaf.side === 'left' ? point.angle - 75 : point.angle + 75;

        const leafStemLength = 8;
        const endX =
          point.x +
          Math.cos((leafAngle * Math.PI) / 180) * leafStemLength;
        const endY =
          point.y +
          Math.sin((leafAngle * Math.PI) / 180) * leafStemLength;

        return (
          <g key={`leaf-${i}`}>
            <line
              x1={point.x}
              y1={point.y}
              x2={endX}
              y2={endY}
              stroke="#567347"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                opacity: shouldShow ? 1 : 0,
                transition: `opacity 0.4s ease-out ${0.2 + i * 0.05}s`,
              }}
            />

            <CherryLeaf
              x={endX}
              y={endY}
              rotation={leafAngle + 90}
              visible={shouldShow}
              delay={0.2 + i * 0.05}
            />
          </g>
        );
      })}

      {/* Buds → Blossoms */}
      {buds.map((bud, i) => {
        const shouldShowBud = growth >= bud.percent;
        const shouldBloom = growth >= bud.bloomAt;
        if (!shouldShowBud) return null;

        const point = getPointAtPercent(bud.percent);
        const twigAngle =
          bud.side === 'left' ? point.angle - 55 : point.angle + 55;

        const twigLength = 14;
        const endX =
          point.x +
          Math.cos((twigAngle * Math.PI) / 180) * twigLength;
        const endY =
          point.y +
          Math.sin((twigAngle * Math.PI) / 180) * twigLength;

        return (
          <g key={`bud-${i}`}>
            <line
              x1={point.x}
              y1={point.y}
              x2={endX}
              y2={endY}
              stroke="#3e2723"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                opacity: shouldShowBud ? 1 : 0,
                transition: `opacity 0.4s ease-out ${0.3 + i * 0.08}s`,
              }}
            />

            {!shouldBloom && (
              <Bud
                x={endX}
                y={endY}
                rotation={twigAngle + 90}
                visible={shouldShowBud}
                delay={0.3 + i * 0.08}
              />
            )}

            {shouldBloom && (
              <CherryBlossom
                x={endX}
                y={endY}
                visible={shouldBloom}
                delay={0.3 + i * 0.08}
                size={
                  i % 3 === 0
                    ? 'large'
                    : i % 2 === 0
                    ? 'medium'
                    : 'small'
                }
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
