import React from "react";

/**
 * Google-style product illustration — clean, minimal, with subtle color accent.
 * No decorative blobs. Google uses clean backgrounds with centered icon on a
 * rounded white card with subtle shadow. This matches workspace.google.com pattern.
 */
export default function GoogleIllustration({ Icon, color = "#1a73e8", seed = 0, size = "lg" }) {
  const dim = size === "lg" ? "w-full max-w-[560px] aspect-[16/10]" : "w-full max-w-[400px] aspect-[4/3]";
  const iconDim = size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const iconSize = size === "lg" ? "w-10 h-10" : "w-8 h-8";

  // Subtle accent lines — Google uses clean geometric accents, not blobs
  const lines = [
    { w: 180, h: 3, x: "50%", y: "68%", o: 0.08 },
    { w: 120, h: 3, x: "50%", y: "74%", o: 0.05 },
    { w: 80, h: 3, x: "50%", y: "80%", o: 0.03 },
  ];

  return (
    <div
      className={`relative ${dim} rounded-[28px] overflow-hidden flex items-center justify-center`}
      style={{ backgroundColor: "#f8f9fa" }}
    >
      {/* Subtle colored accent ring — Google style, not blob */}
      <div
        className="absolute rounded-full opacity-[0.06]"
        style={{
          width: 320, height: 320,
          border: `3px solid ${color}`,
        }}
      />
      <div
        className="absolute rounded-full opacity-[0.04]"
        style={{
          width: 240, height: 240,
          border: `2px solid ${color}`,
        }}
      />

      {/* Central icon on white glass card — Google pattern */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`${iconDim} rounded-[24px] bg-white shadow-[0_8px_32px_rgba(60,64,67,0.06)] flex items-center justify-center`}
          style={{ color }}
        >
          {Icon && <Icon className={iconSize} strokeWidth={1.6} />}
        </div>
        {/* Clean accent bars below — not blobs */}
        <div className="mt-5 flex gap-1.5">
          {lines.map((l, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: l.w / 4,
                height: l.h,
                backgroundColor: color,
                opacity: l.o,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}