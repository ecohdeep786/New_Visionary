import React from "react";

/**
 * Google-style soft illustration — colored blob backgrounds with centered icon.
 * Used on safety.google, about.google, ai.google to break text-heavy sections.
 * Generates unique blob patterns per `seed` so every instance looks different.
 */
export default function GoogleIllustration({ Icon, color = "#1a73e8", seed = 0, size = "lg" }) {
  const dim = size === "lg" ? "w-full max-w-[560px] aspect-[16/10]" : "w-full max-w-[400px] aspect-[4/3]";
  const iconDim = size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const iconSize = size === "lg" ? "w-10 h-10" : "w-8 h-8";

  // Deterministic blob positions based on seed
  const blobs = [
    { w: 280, h: 280, x: -40, y: -60, c: color, o: 0.14, blur: 80 },
    { w: 200, h: 200, x: seed % 2 === 0 ? 200 : 60, y: seed % 2 === 0 ? 80 : 180, c: "#34A853", o: 0.10, blur: 70 },
    { w: 180, h: 180, x: seed % 2 === 0 ? 40 : 260, y: seed % 3 === 0 ? 20 : 140, c: "#FBBC04", o: 0.08, blur: 60 },
    { w: 160, h: 160, x: seed % 2 === 0 ? 280 : 140, y: seed % 3 === 0 ? 160 : 20, c: "#EA4335", o: 0.07, blur: 65 },
  ];

  return (
    <div className={`relative ${dim} rounded-[32px] overflow-hidden flex items-center justify-center`}
      style={{ backgroundColor: "#f8f9fa" }}
    >
      {/* Soft colored blobs */}
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.w, height: b.w,
            left: b.x, top: b.y,
            background: `radial-gradient(circle, ${b.c}${Math.round(b.o * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
            filter: `blur(${b.blur}px)`,
          }}
        />
      ))}
      {/* Central icon on white glass card */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`${iconDim} rounded-[24px] bg-white shadow-[0_16px_48px_rgba(60,64,67,0.1)] flex items-center justify-center`}
          style={{ color }}
        >
          {Icon && <Icon className={iconSize} strokeWidth={1.6} />}
        </div>
        {/* Decorative lines below icon */}
        <div className="mt-5 flex gap-1.5">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: `${color}25` }} />
          <div className="h-1 w-6 rounded-full" style={{ backgroundColor: `${color}15` }} />
          <div className="h-1 w-4 rounded-full" style={{ backgroundColor: `${color}0A` }} />
        </div>
      </div>
    </div>
  );
}