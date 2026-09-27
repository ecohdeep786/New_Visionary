import { Link } from "react-router-dom";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ HeroFanCards — the fanned card strip: alternating tilt (fanned), full
   width bleeding off-screen, and an always-on anticlockwise drift (row moves
   leftward in a seamless loop). Duplicated list makes the -50% loop seamless;
   duplicates are aria-hidden and unfocusable. Tilt/lift use a wrap-safe
   alternating formula so every neighbour differs at any card count. ═══ */
const cardPose = (i) => ({
  tilt: (i % 2 === 0 ? -1 : 1) * (3.5 + (i % 3) * 1.75),
  lift: (i % 2 === 0 ? 18 : 4) + (i % 3) * 3,
});

export default function HeroFanCards({ items, ariaLabel }) {
  return (
    <div role="region" aria-label={ariaLabel}>
      <div className="w-full overflow-hidden">
        <style>{`
          @keyframes hero-fan-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .hero-fan-track { animation: hero-fan-drift 70s linear infinite !important; }
        `}</style>
        <div className="overflow-hidden py-12">
          <div className="hero-fan-track flex w-max">
            {[...items, ...items].map((item, i) => {
              const dup = i >= items.length;
              const { tilt, lift } = cardPose(i % items.length);
              return (
                <Link
                  key={item.label + "-" + i}
                  to={item.to}
                  aria-hidden={dup || undefined}
                  tabIndex={dup ? -1 : undefined}
                  className="group relative mr-6 flex h-[360px] w-[290px] shrink-0 flex-col overflow-hidden rounded-[28px] p-7 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(32,33,36,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4"
                  style={{ backgroundColor: item.tint, transform: `translateY(${lift}px) rotate(${tilt}deg)` }}
                >
                  <span className="text-[22px] font-medium leading-[1.3] text-[#202124]">{item.label}</span>
                  <SpotIllustration subject={item.subject} className="pointer-events-none absolute bottom-0 left-1/2 h-[72%] w-auto -translate-x-1/2 transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
