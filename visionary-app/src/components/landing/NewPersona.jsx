import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_SRCSETS } from "@/lib/heroVariants";

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

/**
 * NewPersona — the Google-style persona hero.
 *
 * Headline-first split layout (workspace.google / gemini.google grammar):
 *   eyebrow chip → animated display headline → sub → pill CTA pair on the
 *   left, the persona photo in a rounded media panel on the right. The
 *   headline lands ~170px from the top of the viewport — no full-bleed
 * photo with the message pinned to the bottom edge.
 *
 * Props are unchanged from the previous full-bleed version (words, sub,
 * img, alt, ctaTo/Label, secondaryTo/Label) plus an optional eyebrow.
 */
export default function NewPersona({
  words,
  wordMs = 2800,
  srSentence,
  sub,
  img,
  alt,
  eyebrow,
  /* Kept for API compatibility — the split hero always sits on white. */
  heroBg = "#ffffff",
  ctaTo = "/register",
  ctaLabel = "Start learning free",
  secondaryTo = "/how-it-works",
  secondaryLabel = "See how it works",
}) {
  const index = useCycle(words.length, wordMs);
  const word = words[index] || "";
  /* Trailing punctuation gets the accent — a quiet Google two-tone touch. */
  const hasPunct = /[.,]$/.test(word);
  const stem = hasPunct ? word.slice(0, -1) : word;
  const punct = hasPunct ? word.slice(-1) : "";

  return (
    <section
      data-section="01-hero"
      className="relative overflow-hidden"
      style={{ backgroundColor: heroBg }}
      aria-label={srSentence}
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 pb-16 pt-20 sm:px-8 lg:px-10 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* left: message first */}
          <div>
            {eyebrow && (
              <p className="hero-fade-up text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px]" style={{ color: "#5f6368", ...rise(0) }}>
                {eyebrow}
              </p>
            )}
            <h1 className="m-0 mt-4">
              <span
                aria-hidden="true"
                className="hero-fade-up block font-medium tracking-[-0.03em] leading-[1.05] text-[#121317] text-[clamp(44px,5.6vw,84px)]"
                style={rise(eyebrow ? 60 : 0)}
              >
                <span key={index} className="inline-block" style={{ animation: "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both" }}>
                  {stem}
                  {punct && <span style={{ color: "#4285F4" }}>{punct}</span>}
                </span>
              </span>
              <span className="sr-only">{srSentence}</span>
            </h1>
            <p
              className="hero-fade-up mt-6 max-w-[520px] font-normal tracking-[0.1px] leading-[1.65] text-[17px] sm:text-[18px]"
              style={{ color: "#5f6368", ...rise(160) }}
            >
              {sub}
            </p>
            <div className="hero-fade-up mt-9 flex flex-wrap items-center gap-4" style={rise(260)}>
              <Link
                to={ctaTo}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121317] px-7 text-[15px] font-medium tracking-[0.1px] text-white transition-all duration-200 hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                {ctaLabel}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                to={secondaryTo}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#dadce0] bg-white px-7 text-[15px] font-normal tracking-[0.1px] text-[#4285F4] transition-colors duration-200 hover:bg-[#F8F9FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          {/* right: persona photo panel */}
          <div className="hero-fade-up relative" style={rise(140)}>
            <div className="overflow-hidden rounded-[28px] border border-[#dadce0] bg-[#f8f9fa]">
              <img
                src={img}
                srcSet={HERO_SRCSETS[img]}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt={alt}
                loading="eager"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
                style={{ objectPosition: "50% 30%" }}
              />
            </div>
            {/* quiet accent — matches the home hero's dot language */}
            <span aria-hidden="true" className="absolute -left-3 top-[14%] h-6 w-6 rounded-full bg-[#4285F4]" />
            <span aria-hidden="true" className="absolute -right-2 bottom-[16%] h-4 w-4 rounded-full bg-[#FBBC04]" />
          </div>
        </div>
      </div>
    </section>
  );
}
