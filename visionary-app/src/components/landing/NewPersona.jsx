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

/* Scrim fades the photo into the page color behind the text zone */
const scrim = (c) => ({
  background: `linear-gradient(to top, ${c} 0%, ${c}F2 14%, ${c}B3 30%, ${c}33 46%, ${c}00 62%)`,
});

export default function NewPersona({
  words,
  wordMs = 2800,
  srSentence,
  sub,
  img,
  alt,
  heroBg = "#fafafc",
  ctaTo = "/register",
  ctaLabel = "Start learning free",
  secondaryTo = "/how-it-works",
  secondaryLabel = "See how it works",
}) {
  const index = useCycle(words.length, wordMs);
  /* EXACT display string used on every page from Landing → Organization */
  const display =
    "block whitespace-nowrap font-medium tracking-[0] leading-[1] text-[clamp(40px,9.57vw,168px)]";

  return (
    <section
      data-section="01-hero"
      className="relative overflow-hidden"
      style={{
        backgroundColor: heroBg,
        height: "calc(100svh - 64px)",
        minHeight: 620,
        marginTop: 64,
      }}
    >
      {/* full-bleed photo — anchored TOP so the head is never cropped */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={img}
          alt={alt}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover lg:object-contain"
          style={{ objectPosition: "50% 0%" }}
        />
        <div className="absolute inset-0" style={scrim(heroBg)} />
      </div>

      {/* content pinned to the bottom edge — nothing below it */}
      <div className="relative mx-auto flex h-full w-full max-w-[1756px] flex-col justify-end px-6 pb-[7vh] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          {/* left: heading + sub — system type */}
          <div className="max-w-[980px]">
            <h1 className="m-0">
              <span aria-hidden="true" className={display} style={{ color: "#121317" }}>
                <span
                  key={index}
                  className="inline-block"
                  style={{ animation: "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                  {words[index]}
                </span>
              </span>
              <span className="sr-only">{srSentence}</span>
            </h1>
            <p
              className="mt-6 max-w-[410px] font-normal tracking-[0] leading-[1.6] text-[clamp(15px,0.97vw,17px)]"
              style={{ color: "#121317", ...rise(140) }}
            >
              {sub}
            </p>
          </div>

          {/* right: CTA pair, bottom-aligned like the Apple hero */}
          <div className="flex flex-wrap items-center gap-3 lg:shrink-0 lg:pb-2" style={rise(260)}>
            <Link
              to={ctaTo}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121317] px-7 text-[15px] font-medium tracking-[0.24px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            >
              {ctaLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              to={secondaryTo}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#dadce0] bg-white px-7 text-[15px] font-normal tracking-[0.24px] text-[#121317] transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}