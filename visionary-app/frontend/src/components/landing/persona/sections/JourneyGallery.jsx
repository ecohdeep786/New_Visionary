import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import ChevronIcon from "./ChevronIcon.jsx";
import { useInViewOnce } from "@/components/landing/system/hooks";
import LazyImage from "@/components/landing/LazyImage";
import { color } from "@/components/landing/system/tokens";

const JOURNEY_GALLERY_MS = 5000;

/* The journey gallery on persona pages — one anatomy site-wide, rebuilt to
   Apple's education-initiative story-card grammar (the "Equipping today's
   learners…" chapter, measured live): cards at 68% of the viewport (980px
   @1440), 30px radius, the story headline INSIDE the card bottom-left at
   48px/600 white over Apple's exact bottom smoke (transparent to
   rgba(0,0,0,0.7) across the lower ~43%), a bare 36px white plus glyph
   bottom-right, and the whole card as the button that opens the stage's
   story modal. The controls are Apple's bare 36px glyph row 25px under
   the card: play/pause left, prev/next right, no dots. Auto-advances
   every 5s (opening a card pauses the tour; reduced motion steps
   instantly). The track shares the header's gutter so the statement and
   the first card sit on one spine, with the next card peeking at the
   viewport edge. */
const JourneyGallery = React.memo(function JourneyGallery({ stages, onOpen, label, iconMap }) {
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const lockRef = useRef(0);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);
  /* cards rise in place as the chapter enters — Apple's story-card entrance */
  const reveal = useInViewOnce(0.12);
  /* No autoplay on mount — the tour starts paused with the first card
     shown. It plays only after the user presses play; every time the
     section scrolls back into view it resets to card 0 (Apple restarts
     its story carousels from the first story on revisit). */
  const [playing, setPlaying] = useState(false);

  const stepTo = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0];
    const unit = track.children[1] ? track.children[1].offsetLeft - first.offsetLeft : first.offsetWidth;
    const clamped = Math.min(stages.length - 1, Math.max(0, i));
    setActive(clamped);
    lockRef.current = Date.now() + 700;
    track.scrollTo({ left: clamped * unit, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [stages.length]);

  /* Reset to the first card whenever the gallery re-enters the viewport,
     and pause the tour when it leaves — slides are a user-paced experience,
     they should never spin ahead while off-screen. */
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (lockRef.current + 700 < Date.now()) stepTo(0);
      } else {
        setPlaying(false);
      }
    });
    io.observe(node);
    return () => io.disconnect();
  }, [stepTo]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => stepTo((active + 1) % stages.length), JOURNEY_GALLERY_MS);
    return () => clearInterval(id);
  }, [playing, active, stepTo, stages.length]);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const track = trackRef.current;
      if (!track || !track.children[1] || Date.now() < lockRef.current) return;
      const unit = track.children[1].offsetLeft - track.children[0].offsetLeft || 1;
      setActive(Math.min(stages.length - 1, Math.max(0, Math.round(track.scrollLeft / unit))));
    });
  }, [stages.length]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const openStage = (stage) => {
    setPlaying(false);
    onOpen(stage);
  };

  return (
    <div ref={(node) => { reveal.ref.current = node; rootRef.current = node; }}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mt-16 [&::-webkit-scrollbar]:hidden [scroll-padding-left:24px] min-[735px]:[padding-left:calc((100vw_-_692px)/2)] min-[735px]:[scroll-padding-left:calc((100vw_-_692px)/2)] min-[1069px]:[padding-left:calc((100vw_-_980px)/2)] min-[1069px]:[scroll-padding-left:calc((100vw_-_980px)/2)]"
        style={{ paddingRight: 24 }}
      >
        {stages.map((stage, i) => {
          const StageIcon = (iconMap && iconMap[stage.title]?.Icon) || Sparkles;
          return (
            <div
              key={stage.title}
              className="flex-none snap-start"
              style={{
                opacity: reveal.entered ? 1 : 0,
                transform: reveal.entered ? "none" : "translateY(24px)",
                transition: `opacity var(--motion-duration-statement) var(--ease-out-apple), transform var(--motion-duration-statement) var(--ease-out-apple)`,
                transitionDelay: `${140 + i * 80}ms`,
              }}
            >
              {/* Apple's exact story-card metrics (measured on the education-
                  initiative gallery): 980×516 @≥1069px (1.9), 692×430 @735–1068px
                  (1.61), 275×400 @<735px (portrait). The fixed widths are what
                  give the gallery its premium peek — each instance shows the
                  next story at the viewport edge. */}
              <figure role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${stages.length}: ${stage.title}`}
                className="relative m-0 w-[275px] min-[735px]:w-[692px] min-[1069px]:w-[980px]"
                style={{ opacity: i === active ? 1 : 0.45, transition: "opacity 1500ms var(--ease-out-apple)" }}
              >
            <button
              type="button"
              onClick={() => openStage(stage)}
              aria-label={`Open details for ${stage.title}`}
              className="group relative block w-full overflow-hidden rounded-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
            >
              <LazyImage
                key={stage.title}
                src={stage.image}
                alt={stage.alt}
                decoding="async"
                draggable="false"
                className="aspect-[11/16] w-full select-none object-cover transition-transform duration-500 ease-apple group-hover:scale-[1.02] min-[735px]:aspect-[692/430] min-[1069px]:aspect-[1.9]"
              />
              {/* Apple's exact bottom smoke: transparent → rgba(0,0,0,0.7)
                  across the lower ~53% of the card (66% on the portrait mobile
                  card), so the bottom-left statement reads on any stock photo
                  without a full-card veil */}
              <span className="absolute inset-x-0 bottom-0 h-[66%] bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent min-[735px]:h-[53%]" aria-hidden="true" />
              {/* the sub-category label + story headline — inside the card,
                  bottom-left inset to Apple's 36px text column. The stage title
                  (Primary, Secondary…) acts as the card's category heading, with
                  the story statement as the large typographic tier above the
                  smoke. */}
              <span className="absolute bottom-0 left-0 block max-w-[72%] p-6 text-left sm:p-9">
                <span data-type="caption" className="mb-3 block text-white/75">{stage.title}</span>
                <span key={stage.statement} className="block max-w-[15ch] font-semibold tracking-[-0.01em] leading-[1.08] text-white text-[28px] min-[735px]:text-[40px] min-[1069px]:text-[48px]">{stage.statement || stage.title}</span>
              </span>
              {/* Apple's story-card affordance — a white 36px circular button
                  carrying the plus cutout, pinned to the card's bottom-right
                  over the smoke and matched to our ink color */}
              <span className="public-card-control absolute bottom-6 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white sm:bottom-6 sm:right-6">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="public-icon public-icon-plus" aria-hidden="true" style={{ color: color.ink }}>
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </span>
            </button>
              </figure>
            </div>
          );
        })}
      </div>
      {/* the controls — Apple's bare 36px glyph row 25px under the cards:
          play/pause at the track's left edge, prev/next chevrons at the
          right edge; no dots on this gallery. The row shares the centered
          card column so the glyphs sit under the card, not the viewport edge
          — matching the per-breakpoint card width. */}
      <div className="mt-6 flex items-center justify-between px-6 min-[735px]:mx-auto min-[735px]:w-full min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
        <button
          type="button"
          aria-label={playing ? "Pause the journey" : "Play the journey"}
          aria-pressed={!playing}
          onClick={() => setPlaying((v) => !v)}
          className="flex h-11 w-11 items-center justify-center text-[#1d1d1f] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            disabled={active === 0}
            onClick={() => stepTo(active - 1)}
            className={`flex h-11 w-11 items-center justify-center text-[#1d1d1f] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${active === 0 ? "cursor-default opacity-30" : "hover:opacity-60"}`}
          >
            <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={active === stages.length - 1}
            onClick={() => stepTo(active + 1)}
            className={`flex h-11 w-11 items-center justify-center text-[#1d1d1f] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${active === stages.length - 1 ? "cursor-default opacity-30" : "hover:opacity-60"}`}
          >
            <ChevronIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{`${stages[active].title}. ${stages[active].copy}`}</p>
    </div>
  );
});
export default JourneyGallery;
