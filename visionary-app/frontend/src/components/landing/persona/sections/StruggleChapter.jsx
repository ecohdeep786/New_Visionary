import React from "react";
import { useInViewOnce } from "@/components/landing/system/hooks";
import { revealStyle, useAppleLinkedReveal, STRUGGLE_MASK } from "./reveal-helpers.js";
import CarouselDots from "./CarouselDots.jsx";
import { color } from "@/components/landing/system/tokens";

const StruggleChapter = React.memo(function StruggleChapter({ slides, index, goTo, lines, label, kicker = "The problem", copy, linked = false }) {
  const slide = slides[index];
  /* one observer for the whole problem beat; children stagger like Apple's
     chapter enters — kicker, statement, support, photograph, quote, dots.
     `linked` switches the beat to Apple's hero-scroll-linked reveal instead
     (the education-initiative tween), so this chapter always leads with the
     hero above it. */
  const linkedReveal = useAppleLinkedReveal(linked);
  const observer = useInViewOnce(linked ? 0 : 0.2);
  const entered = linked ? true : observer.entered;
  const revealRef = linked ? linkedReveal.ref : observer.ref;
  return (
    <div ref={revealRef} style={linked ? linkedReveal.style : undefined}>
      <p className="sr-only">{label}</p>
      <div className="px-6">
        <p className="text-center text-[16px] font-normal" style={{ color: color.slate, ...revealStyle(entered, 0) }}>
          {kicker}
        </p>
        <h2
          data-type="section"
          className="mx-auto mt-[clamp(14px,1.8vw,24px)] max-w-[980px] text-center"
          style={{ color: color.ink, ...revealStyle(entered, 90) }}
        >
          {/* the fixed problem sentence always holds line one; the rotating
              accent word is reserved on line two (a min-h slot) so the chapter
              never reflows and the page never jumps when the word swaps */}
          <span className="block text-balance">{lines.join(" ")}</span>
          <span key={`w-${index}`} className="hero-fade-up accent-gradient block min-h-[1.05em] [animation-duration:0.9s]">
            {slide.word}.
          </span>
        </h2>
        {/* Apple's premium beat carries one supporting line directly under the
            statement (the 17px body run Apple places beneath a feature or
            story headline), before the photograph — statement → one line → shot.
            No arrow to the image; the photograph breaks below on the section's
            own white with measured air. Clean, centered, calm. */}
        {copy && (
          <p
            className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17px]"
            style={{ color: color.slate, ...revealStyle(entered, 165) }}
          >
            {copy}
          </p>
        )}
      </div>
      <figure className="m-0 relative" style={{ ...revealStyle(entered, 240) }}>
        {/* a whisper of Apple's product-wash — the subject breathes over a
            barely-there radial at the base, never a card, never a band */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
          style={{ background: "radial-gradient(46% 62% at 50% 100%, rgba(0,102,204,0.05) 0%, rgba(0,102,204,0.02) 46%, rgba(0,102,204,0) 72%)" }}
        />
        {/* the subject shares the statement's centered column — the same
            980px spine the heading and copy sit on, so the photograph is
            optically centered with the text on every screen */}
        <div className="relative mx-auto mt-[clamp(32px,5vw,80px)] h-[clamp(300px,46svh,440px)] w-full max-w-[980px] sm:h-[clamp(330px,min(46vw,64svh),640px)]">
          {slides.map((s, i) => (
            <img
              key={s.alt}
              src={s.image}
              alt={i === index ? s.alt : ""}
              aria-hidden={i !== index}
              loading="eager"
              decoding="async"
              draggable="false"
              style={STRUGGLE_MASK}
              className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none transition-opacity duration-700 ease-apple motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <figcaption
          key={`q-${index}`}
          aria-live="polite"
          className="hero-fade-up mx-auto mt-[clamp(16px,2.4vw,32px)] w-full max-w-[640px] px-6 text-center [animation-delay:80ms] [animation-fill-mode:both]"
        >
          {/* the reserved two-line slot keeps the dots from jumping when a
              shorter quote occupies one line */}
          <p data-type="body" className="flex min-h-[2.9em] items-center justify-center" style={{ color: color.ink }}>
            {slide.quote}
          </p>
        </figcaption>
      </figure>
      <div className="mt-8 flex justify-center" style={{ ...revealStyle(entered, 360) }}>
        <CarouselDots total={slides.length} active={index} onSelect={goTo} label={label} />
      </div>
    </div>
  );
});
export default StruggleChapter;
