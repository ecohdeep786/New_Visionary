import React from "react";
import { color } from "@/components/landing/system/tokens";

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect, label, tone = "ink" }) {
  /* tone "pill" — the AirPods highlights dotnav (same treatment as the
     landing journey): uniform warm-gray dots riding inside the section's
     light pill, the active one stretching into a 48×8 rounded bar.
     Target-size law (F-27): same >=24px button-box geometry as ProgressDots
     — the ±18px ::after expansion created overlapping invisible hit areas
     (Lighthouse target-size score 0 on /student). */
  const pill = tone === "pill";
  return (
    <div className={`flex items-center ${pill ? "gap-4" : ""}`} role="group" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to challenge ${i + 1}`}
          aria-pressed={i === active}
          onClick={() => onSelect(i)}
          className={`relative flex h-6 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${i === active ? (pill ? "w-12" : "w-10") : "w-6 hover:opacity-70"}`}
        >
          <span
            className="block h-2 rounded-full transition-all duration-300"
            style={{ width: i === active ? "100%" : "8px", backgroundColor: pill ? "rgba(29,29,31,0.6)" : i === active ? color.ink : `${color.ink}33` }}
          />
        </button>
      ))}
    </div>
  );
});
export default CarouselDots;
