import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const rise = (delay = 0) => ({
  animation: "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
  animationDelay: `${delay}ms`,
});

function useCycle(total, ms) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!ms || ms <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), ms);
    return () => clearInterval(id);
  }, [total, ms]);
  return index;
}

/* Circle-cluster geometry — measured once from the approved composition */
const CROPS = [
  { cls: "left-0 top-[2%] w-[48.4%]", pos: "center 30%" },
  { cls: "left-[59.2%] top-[26.7%] w-[22%]", pos: "center 45%" },
  { cls: "left-[86%] top-[16.7%] w-[12.2%]", pos: "center 20%" },
  { cls: "left-[55.7%] top-[64%] w-[27.8%]", pos: "center 60%" },
];

export default function PersonaHero({
  words,
  wordMs = 2800,
  srSentence,
  sub,
  img,
  alt,
  ctaTo = "/register",
  ctaLabel = "Start learning free",
  secondaryTo = "/how-it-works",
  secondaryLabel = "See how it works",
}) {
  const index = useCycle(words.length, wordMs);
  const display = "block whitespace-nowrap font-medium tracking-[0] leading-[1] text-[clamp(40px,9.57vw,168px)]";
  return (
    <section data-section="01-hero" className="relative overflow-hidden bg-white">
      <div className="relative mx-auto min-h-[calc(100svh-64px)] w-full max-w-[1756px] px-6 pt-16 pb-24 sm:px-8 sm:pt-20 lg:px-0 lg:py-0">
        {/* ONE animated heading — sr-only sentence lives inside so AT reads the h1 */}
        <h1 className="m-0">
          <span aria-hidden="true" className={`hero-fade-up ${display} lg:absolute lg:left-[6.5%] lg:top-[20%]`} style={rise(0)}>
            <span key={index} className="inline-block" style={{ color: "#121317", animation: "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both" }}>
              {words[index]}
            </span>
          </span>
          <span className="sr-only">{srSentence}</span>
        </h1>

        {/* supporting sentence */}
        <p
          className="hero-fade-up mt-10 max-w-[320px] font-normal tracking-[0] leading-[1.6] text-[clamp(15px,0.97vw,17px)] lg:absolute lg:left-[7%] lg:top-[50%] lg:mt-0 xl:max-w-[410px]"
          style={{ color: "#5f6368", animationDelay: "160ms", animationFillMode: "both" }}
        >
          {sub}
        </p>

        {/* arrow: copy → CTA */}
        <svg viewBox="0 0 220 120" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className="pointer-events-none absolute left-[40%] top-[60%] hidden h-20 w-40 lg:block" style={{ color: "#121317" }}>
          <path d="M212 10 C150 14, 84 40, 24 96" />
          <path d="M24 96 l5 -15" />
          <path d="M24 96 l15 -4" />
        </svg>

        {/* circle cluster */}
        <div className="hero-fade-up relative mx-auto mt-16 aspect-[5/4] w-full max-w-[560px] [animation-delay:120ms] [animation-fill-mode:both] lg:absolute lg:right-[2%] lg:top-[34%] lg:mt-0 lg:w-[41%] lg:max-w-none">
          {CROPS.map((c, i) => (
            <div key={c.cls} className={`absolute aspect-square overflow-hidden rounded-full ${c.cls}`}>
              <img src={img} alt={i === 0 ? alt : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" style={{ objectPosition: c.pos }} />
            </div>
          ))}
        </div>

        {/* CTA pair */}
        <div className="hero-fade-up mt-10 flex flex-wrap items-center gap-4 [animation-delay:240ms] [animation-fill-mode:both] lg:absolute lg:left-[7%] lg:top-[70%] lg:mt-0">
          <Link to={ctaTo} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121317] px-7 text-[15px] font-medium tracking-[0.24px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
            {ctaLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link to={secondaryTo} className="inline-flex h-12 items-center justify-center rounded-full border border-[#dadce0] bg-white px-7 text-[15px] font-normal tracking-[0.24px] text-[#4285F4] transition-colors duration-200 hover:bg-[#F8F9FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}