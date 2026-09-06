export default function ParallelogramBackdrop({ variant = "light", className = "" }) {
  const isDark = variant === "dark";
  const shapes = isDark
    ? [
        { color: "#3868B6", opacity: 0.82 },
        { color: "#2D5698", opacity: 0.78 },
        { color: "#24457B", opacity: 0.74 },
        { color: "#1B335E", opacity: 0.70 },
        { color: "#122240", opacity: 0.66 },
        { color: "#091122", opacity: 0.62 },
      ]
    : [
        { color: "#4285F4", opacity: 0.13 },
        { color: "#4285F4", opacity: 0.10 },
        { color: "#4285F4", opacity: 0.08 },
        { color: "#4285F4", opacity: 0.06 },
        { color: "#4285F4", opacity: 0.04 },
      ];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ background: isDark ? "#05070f" : "transparent" }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
        {shapes.map((s, i) => (
          <div
            key={i}
            style={{
              width: "clamp(70px, 13vw, 150px)",
              height: "clamp(300px, 72vh, 560px)",
              backgroundColor: s.color,
              opacity: s.opacity,
              transform: "skewX(-16deg)",
              marginLeft: i === 0 ? 0 : "-38px",
              borderRadius: "14px",
            }}
          />
        ))}
      </div>
    </div>
  );
}