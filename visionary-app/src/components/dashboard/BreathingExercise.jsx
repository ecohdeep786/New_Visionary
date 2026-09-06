import { useState, useEffect } from "react";

const phases = [
  { label: "Breathe in", duration: 4000 },
  { label: "Hold", duration: 2000 },
  { label: "Breathe out", duration: 6000 },
  { label: "Rest", duration: 1000 },
];

export default function BreathingExercise() {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      if (phaseIndex === phases.length - 1) {
        setCycleCount((c) => c + 1);
        setPhaseIndex(0);
      } else {
        setPhaseIndex((p) => p + 1);
      }
    }, phases[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [active, phaseIndex]);

  const toggle = () => {
    if (!active) {
      setPhaseIndex(0);
      setCycleCount(0);
    }
    setActive(!active);
  };

  const phase = phases[phaseIndex];
  const breatheScale = phase.label === "Breathe in" ? 1.4 : phase.label === "Hold" && phaseIndex === 1 ? 1.4 : 1;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <button
        onClick={toggle}
        className="relative w-32 h-32 flex items-center justify-center"
        aria-label="Toggle breathing exercise"
      >
        <div
          className="absolute inset-0 rounded-full transition-transform ease-in-out"
          style={{
            transform: active ? `scale(${breatheScale})` : "scale(1)",
            transitionDuration: `${phase.duration}ms`,
            backgroundColor: "#1a73e8",
            opacity: 0.15,
          }}
        />
        <div
          className="absolute inset-0 rounded-full transition-transform ease-in-out"
          style={{
            transform: active ? `scale(${breatheScale * 0.75})` : "scale(0.6)",
            transitionDuration: `${phase.duration}ms`,
            backgroundColor: "#1a73e8",
            opacity: 0.25,
          }}
        />
        <div className="relative z-10 w-16 h-16 rounded-full bg-[#1a73e8] flex items-center justify-center">
          <span className="text-white text-sm font-medium text-center leading-tight">
            {active ? phase.label : "Start"}
          </span>
        </div>
      </button>
      <div className="text-center">
        <p className="text-base font-normal text-[#3c4043]">
          {active ? "Follow the rhythm" : "Tap the circle to begin"}
        </p>
        {cycleCount > 0 && (
          <p className="text-sm font-medium text-[#1a73e8] mt-1">{cycleCount} cycle{cycleCount !== 1 ? "s" : ""} complete</p>
        )}
      </div>
    </div>
  );
}