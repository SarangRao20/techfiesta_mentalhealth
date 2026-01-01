import { useEffect, useState } from "react";

/**
 * growth: 0 → 1
 * This single value controls everything
 */
function CreeperPlant({ growth = 0.4 }) {
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      {/* Stem */}
      <Stem growth={growth} />

      {/* Leaves */}
      {growth > 0.2 && <Leaf side="left" level={1} />}
      {growth > 0.3 && <Leaf side="right" level={2} />}
      {growth > 0.45 && <Leaf side="left" level={3} />}

      {/* Bud */}
      {growth > 0.6 && <Bud />}

      {/* Flower */}
      {growth > 0.8 && <Flower />}
    </div>
  );
}

/* -------------------- SUB COMPONENTS -------------------- */

function Stem({ growth }) {
  return (
    <div
      className="absolute bottom-0 w-[6px] bg-[#3A5F4B] rounded-full transition-all duration-1000 ease-out"
      style={{
        height: `${growth * 380}px`,
      }}
    />
  );
}

function Leaf({ side, level }) {
  const isLeft = side === "left";

  return (
    <div
      className={`absolute ${
        isLeft ? "-left-6" : "left-2"
      } w-10 h-6 bg-[#5F8F72] rounded-full rotate-${
        isLeft ? "-20" : "20"
      } animate-sway`}
      style={{
        bottom: `${level * 90}px`,
      }}
    />
  );
}

function Bud() {
  return (
    <div
      className="absolute w-3 h-3 rounded-full bg-[#9DB8A0] animate-pulse"
      style={{ bottom: "320px" }}
    />
  );
}

function Flower() {
  return (
    <div
      className="absolute w-6 h-6 rounded-full bg-pink-300 animate-bloom"
      style={{ bottom: "350px" }}
    />
  );
}

export default CreeperPlant;