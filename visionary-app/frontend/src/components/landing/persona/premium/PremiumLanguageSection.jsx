import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

/* ═══════════════════════ 07 · LANGUAGE — the voice dial ═══════════════════════
   A centered feature statement with the chapter's one muted link, then the
   dial: six wordless language dots gliding one step per beat on a hairline
   ring, the language at 12 o'clock speaking its own subject question at the
   center. The reel auto-advances while on screen and goes silent off-screen. */

const PremiumOrbitDots = React.memo(function PremiumOrbitDots({ chips, activeIndex, onSelect, reduced }) {
  const stepDeg = 360 / chips.length;
  /* dots laid out counterclockwise so each advance spins the ring clockwise
     and still lands the active language at 12 o'clock */
  const rotation = activeIndex * stepDeg;
  return (
    <>
      {/* the orbit track */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="49.75" fill="none" stroke={color.ink} strokeOpacity="0.12" strokeWidth="0.25" />
      </svg>
      {/* the rotating dot ring */}
      <div className="absolute inset-0 transition-transform ease-apple" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reduced ? "0ms" : "700ms" }}>
        {chips.map((c, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={c.code} className="absolute inset-0" style={{ transform: `rotate(${-i * stepDeg}deg)` }}>
              <button type="button" aria-pressed={isActive} aria-label={`Show ${c.label}`}
                onClick={() => onSelect(i)}
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full after:absolute after:-inset-y-4 after:-inset-x-4 after:rounded-full after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ boxShadow: isActive ? "0 0 0 5px rgba(18,19,23,0.05)" : "none" }}>
                <span className="block rounded-full transition-all duration-500 ease-apple"
                  style={{ width: isActive ? 12 : 7, height: isActive ? 12 : 7, backgroundColor: isActive ? color.ink : `${color.ink}3D` }} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
});

const PremiumPlayPause = React.memo(function PremiumPlayPause({ playing, onClick, labelPrefix }) {
  return (
    <button
      type="button"
      aria-label={playing ? `Pause the ${labelPrefix}` : `Play the ${labelPrefix}`}
      aria-pressed={!playing}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
    >
      {playing ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
          <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
          <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] translate-x-[1px]" aria-hidden="true">
          <path d="M8 5.5c0-.9 1-1.5 1.8-1l9.6 5.6c.8.5.8 1.7 0 2.2l-9.6 5.6c-.8.5-1.8-.1-1.8-1V5.5z" />
        </svg>
      )}
    </button>
  );
});

/* The canonical language chapter, shared by every persona page. Props:
   chips (code/label), questions (array of {code: utterance} — the subject
   bank the dial tours across languages), and the header copy: eyebrow,
   line1, accent, tail (rendered as line1 <br/> accent tail). */
function PremiumLanguageSection({ chips, questions, eyebrow = "Every language", line1, accent, tail, sub }) {
  const reduced = usePrefersReducedMotion();
  const { ref } = useRevealOnce();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const dialRef = useRef(null);
  const inViewRef = useRef(true);
  const active = chips[index];
  const question = questions[index % questions.length][active.code];

  /* Apple's highlights anatomy: the reel advances on its own while it is on
     screen and the visitor holds the control. */
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      if (inViewRef.current) setIndex((i) => (i + 1) % chips.length);
    }, 3200);
    return () => clearInterval(id);
  }, [playing, chips.length]);

  useEffect(() => {
    const node = dialRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i) => setIndex(((i % chips.length) + chips.length) % chips.length), [chips.length]);
  const step = useCallback((d) => setIndex((i) => (i + d + chips.length) % chips.length), [chips.length]);

  return (
    <section ref={ref} data-section="07-language" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <ScrollReveal>
        <RevealItem idx={0}>
          <p className="text-center text-[18px] font-medium" style={{ color: color.slate }}>{eyebrow}</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2
            data-type="section"
            className="text-balance mt-[var(--gap-eyebrow-title-display)] text-center font-semibold"
            style={{ color: color.ink, maxWidth: "24ch", marginInline: "auto" }}
          >
            {line1}<br className="hidden sm:block" /><span className="accent-gradient">{accent}</span>{tail}
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p
            data-type="body"
            className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] text-center"
            style={{ color: color.slate }}
          >
            {sub}
          </p>
        </RevealItem>
        {/* the chapter's one quiet link — Apple's feature-chapter affordance */}
        <RevealItem idx={3}>
          <div className="mt-5 flex justify-center">
            <Link
              to="/how-it-works"
              className="relative after:absolute after:-inset-y-3 after:-inset-x-2 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              How Visionary works
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
        </RevealItem>

        {/* the voice dial — the ring grows with the screen; dots ride the
            hairline while the speaking language's question holds the center. */}
        <RevealItem idx={4}>
          <div ref={dialRef} className="mx-auto mt-14 w-full max-w-[min(604px,88vw)] sm:mt-20">
            <div className="relative aspect-square w-full" role="group" aria-label="Language selection">
              <PremiumOrbitDots chips={chips} activeIndex={index} onSelect={goTo} reduced={reduced} />
              {/* whisper of product-wash beneath the dial */}
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(0,102,204,0.06) 0%, rgba(0,102,204,0.02) 46%, rgba(0,102,204,0) 72%)" }} />
              {/* the center — the speaking language's name in Apple's quiet
                  label voice, its question at statement scale, the one accent
                  listening beneath */}
              <div className="absolute inset-x-[16%] inset-y-[18%] flex flex-col items-center justify-center text-center">
                <span key={`name-${index}`} className="hero-fade-up text-[14px] font-medium tracking-[0] leading-[1.5]" style={{ color: color.slate }}>{active.label}</span>
                <p aria-live="polite" lang={active.code} data-type="feature" className="mt-3 flex items-center justify-center text-center" style={{ color: color.ink, maxWidth: "80%" }}>
                  <span key={index} className="hero-fade-up text-balance">{question}</span>
                </p>
                <div className="mt-5 flex items-end justify-center gap-1.5" aria-hidden="true">
                  {["#1d1d1f", "#0066cc", "#1d1d1f", "#1d1d1f"].map((c, i) => (
                    <span key={i} className="h-6 w-1.5 rounded-full" style={{ backgroundColor: c, opacity: i === 1 ? 1 : 0.22, transformOrigin: "center", animation: `voiceDot 1.2s var(--ease-out-apple) ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
            {/* the control row — Apple's bare 36px glyphs at the stage's
                edges: play/pause left, prev/next right */}
            <div className="mt-6 flex items-center justify-between">
              <PremiumPlayPause playing={playing} onClick={() => setPlaying((v) => !v)} labelPrefix="languages" />
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  aria-label="Previous language"
                  onClick={() => step(-1)}
                  className="flex h-11 w-11 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next language"
                  onClick={() => step(1)}
                  className="flex h-11 w-11 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </RevealItem>

        {/* quiet legend — the chapter's small print sits directly under the
            stage, after the controls (Apple: media → controls → caption) */}
        <RevealItem idx={5}>
          <div className="mx-auto mt-10 w-full max-w-[860px] sm:mt-12">
            <p className="text-center font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: color.muted }}>
              Listening in {active.label} · understood in every language
            </p>
            <p className="mt-1 text-center font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: color.muted }}>
              Use voice or text in the way you're comfortable.
            </p>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}
export default PremiumLanguageSection;
