import React from "react";
import { color } from "@/components/landing/system/tokens";

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect, label, tone = "ink" }) {
  /* tone "pill" — the AirPods highlights dotnav (same treatment as the
     landing journey): uniform warm-gray dots riding inside the section's
     light pill, the active one stretching into a 48×8 rounded bar */
  const pill = tone === "pill";
  return (
    <div className={`flex items-center ${pill ? "gap-4" : "gap-2"}`} role="group" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to challenge ${i + 1}`}
          aria-pressed={i === active}
          onClick={() => onSelect(i)}
          className={`relative h-2 cursor-pointer rounded-full transition-all duration-300 after:absolute after:-inset-y-[18px] after:-inset-x-[18px] after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${i === active ? (pill ? "w-12" : "w-10") : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: pill ? "rgba(29,29,31,0.6)" : i === active ? color.ink : `${color.ink}33` }}
        />
      ))}
    </div>
  );
});
export default CarouselDots;
