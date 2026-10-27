import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";
import LazyImage from "@/components/landing/LazyImage";

/* ═══════════════════════ 10 · JOURNEY FLOW ═══════════════════════
   Apple's statement-then-row anatomy (AirPods "Get to know AirPods."): the
   chapter's one idea stated at full display scale, then the content itself carries
   it — two equal stage cards joined by a quiet arrow, auto-advancing one pair
   per beat the way Apple's product highlights do, silent while off-screen,
   with the page's bare control row and one muted link closing the chapter. */

/* The journey tile — Apple's card anatomy measured on the AirPods tiles:
   no icon chrome, a 17px semibold stage label above a 28px semibold
   statement on the #f5f5f7 ground (32px padding, 18px radius), and the
   photograph filling the card's lower field edge to edge — text never
   overlays the image. */
const JourneyPairCard = React.memo(function JourneyPairCard({ stage, className = "" }) {
  return (
    <figure className={`relative flex flex-col overflow-hidden rounded-[18px] bg-[#f5f5f7] ${className}`}>
      <figcaption className="p-8 pb-0">
        <h3 data-type="card-name" className="max-w-[18ch] text-balance" style={{ color: color.ink }}>
          {stage.title}
        </h3>
        <p
          className="mt-2 text-balance text-[28px] font-semibold leading-[1.14] tracking-[0.007em]"
          style={{ color: color.ink, maxWidth: "22ch" }}
        >
          {stage.statement}
        </p>
      </figcaption>
      <div className="media-settle relative mt-7 min-h-0 flex-1">
        <LazyImage
          key={stage.statement}
          src={stage.image}
          alt={stage.alt}
          decoding="async"
          className="hero-fade-up absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </figure>
  );
});

const PremiumPlayPauseButton = React.memo(function PremiumPlayPauseButton({ playing, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={playing ? `Pause the ${label}` : `Play the ${label}`}
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

/* The chapter, parameterized by the page's own journey stages (each stage
   needs title/statement/copy/image/alt — the same shape the journey gallery
   uses). Props: stages, eyebrow, heading (node), sub, linkLabel, linkTo. */
function PremiumJourneyFlowSection({ stages, eyebrow = "Your journey", heading, sub, linkLabel = "See how Visionary keeps it connected", linkTo = "/how-it-works" }) {
  const { ref } = useRevealOnce();
  const stageRef = useRef(null);
  const inViewRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);

  const categories = stages.map((s) => s.title);
  const stageByTitle = Object.fromEntries(stages.map((s) => [s.title, s]));
  const stepCount = categories.length - 1;
  const first = categories[index];
  const second = categories[index + 1];

  /* the reel advances on its own while on screen; the control holds it */
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      if (inViewRef.current) setIndex((i) => (i + 1) % stepCount);
    }, 4200);
    return () => clearInterval(id);
  }, [playing, stepCount]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const step = useCallback((d) => setIndex((i) => (i + d + stepCount) % stepCount), [stepCount]);

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <p className="px-6 text-center text-[17px] font-medium" style={{ color: color.slate }}>{eyebrow}</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2
            data-type="section"
            className="px-6 text-balance text-center font-semibold"
            style={{ color: color.ink, maxWidth: "24ch", marginInline: "auto", marginTop: "var(--gap-eyebrow-title-display)" }}
          >
            {heading}
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p
            className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] px-6 text-center font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: color.slate }}
          >
            {sub}
          </p>
        </RevealItem>

        {/* the flow row — two equal stage cards, one quiet connector */}
        <RevealItem idx={3} className="stagger-group">
          <div ref={stageRef} className="mx-auto mt-14 w-full max-w-[1265px] px-6 lg:mt-20 lg:px-[80px]">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center lg:gap-16">
              <JourneyPairCard stage={stageByTitle[first]} className="stagger-child h-[560px] w-full max-w-[440px] lg:h-[680px] lg:w-[440px]" />
              {/* the continuity arc — Apple's crafted connector between stages */}
              <svg
                viewBox="0 0 64 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="hidden h-12 w-16 shrink-0 self-center opacity-55 lg:block"
                style={{ color: color.ink }}
              >
                <path d="M4 36 C 20 8, 42 6, 58 22" />
                <path d="M58 22 l-11 -4" />
                <path d="M58 22 l-8 8" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-5 w-5 shrink-0 opacity-60 lg:hidden"
                style={{ color: color.ink }}
              >
                <path d="M12 4v16" />
                <path d="m5 13 7 7 7-7" />
              </svg>
              <JourneyPairCard stage={stageByTitle[second]} className="stagger-child h-[560px] w-full max-w-[440px] lg:h-[680px] lg:w-[440px]" />
            </div>

            {/* the bare control row — pause left, chevrons right */}
            <div className="mx-auto mt-8 flex w-full max-w-[944px] items-center justify-between">
              <PremiumPlayPauseButton playing={playing} onClick={() => setPlaying((v) => !v)} label="journey" />
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  aria-label="Previous stages"
                  onClick={() => step(-1)}
                  className="flex h-11 w-11 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next stages"
                  onClick={() => step(1)}
                  className="flex h-11 w-11 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </RevealItem>

        {/* one quiet link closes the chapter */}
        <RevealItem idx={4}>
          <div className="mt-10 flex justify-center px-6 lg:mt-12">
            <Link
              to={linkTo}
              className="relative after:absolute after:-inset-y-3 after:-inset-x-2 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              {linkLabel}
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}
export default PremiumJourneyFlowSection;
