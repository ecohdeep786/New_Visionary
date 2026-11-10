import React from "react";
import { ART_VARIANTS } from "./art-helpers.js";

const IntelligenceArt = React.memo(function IntelligenceArt({ label, variant = 0, className = "" }) {
  const v = ART_VARIANTS[variant % ART_VARIANTS.length];
  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden bg-[#f5f5f7] ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="none" stroke="#d2d2d7" strokeWidth="0.4" strokeDasharray="4 5" transform={`rotate(${v.rotate} 50 50)`} />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#0066cc" strokeOpacity="0.35" strokeWidth="0.45" strokeDasharray="3 6" transform={`rotate(${-v.rotate * 1.6} 50 50)`} />
        <circle cx="50" cy="50" r="24" fill="#ffffff" stroke="#1d1d1f" strokeOpacity="0.08" strokeWidth="0.4" />
        {v.dots.map((deg, i) => {
          const rad = ((deg + v.rotate) * Math.PI) / 180;
          return (
            <circle
              key={deg}
              cx={50 + 36 * Math.cos(rad)}
              cy={50 + 36 * Math.sin(rad)}
              r={i === 0 ? 2.1 : 1.4}
              fill="#0066cc"
              fillOpacity={i === 0 ? 1 : 0.55}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="1.5 6 60 44.5" className="w-[26%]" fill="none" aria-hidden="true" style={{ transform: `scale(${v.scale})` }}>
          <g transform="translate(0,64) scale(0.1,-0.1)" fill="#1d1d1f" stroke="none">
            <path d="M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z" />
          </g>
        </svg>
      </div>
    </div>
  );
});
export default IntelligenceArt;
