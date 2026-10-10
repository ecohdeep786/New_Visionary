import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Shared persona-section components — extracted verbatim from the five
 * persona pages (Student/Teacher/Parent/Professional/Organization), whose
 * implementations were byte-identical except for page-specific strings.
 * Page data (slides, journey modals, icon maps, images) is passed in via
 * props; the visual anatomy, motion, and class strings live here once.
 *
 * Canonical colors: the site hairline #dadce0 and the Google app-chip tint
 * #e8f0fe (chip law) apply to every persona page through this module.
 */
const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  blue: "#4285F4",
  chipBg: "#e8f0fe",
  mist: "#dadce0",
  white: "#ffffff",
};

/* The problem chapter on every persona page — one anatomy shared with the
   landing's approved problem chapter (02-problem): centered kicker, one
   balanced statement with the page's rotating accent word, then an unframed
   studio-white subject standing on the page's own white. No circle crop, no
   doodle arrow, no card: the photography dissolves at its edges via mask
   gradients (the hero's floor recipe) and all four subjects stay mounted,
   crossfading in place — a keyed <img> remount flashes an empty frame on
   slow phones. Chapter breath comes from the bridge's compact band
   (02-struggle), never from inner padding. */
const STRUGGLE_MASK = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
  maskComposite: "intersect",
};

/* Apple's scroll reveal — after the hero, sections enter the viewport and
   their type/photography rise in place, one element at a time, on Apple's
   resolve-out curve. Blocks keep their layout while hidden (no collapse),
   the observer fires once, and the global reduced-motion contract snaps the
   transition to instant. This is the "scroll, then the text appears" beat. */
const APPLE_REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function revealStyle(entered, delay) {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(26px)",
    transition: `opacity 0.9s ${APPLE_REVEAL_EASE}, transform 0.9s ${APPLE_REVEAL_EASE}`,
    transitionDelay: `${delay}ms`,
    willChange: "opacity, transform",
  };
}

/* Apple's hero→next scroll-linked reveal (measured on the education-
   initiative page): the chapter that directly follows the full-view hero
   starts pinned invisible, then fades in as a continuous function of how
   far the hero has scrolled — the copy begins entering at 30% of the hero's
   height and completes at 90% (tween `opacity: [0,1]` over
   `css(--hero-scroll-distance) * 0.3 → * 0.9`, disabled when the hero is
   not full-viewport). No observer, no trigger: the reveal tracks the
   scrollbar, so any scroll gesture reads as one motion — the premium beat
   Apple uses between a hero and its story. Reduced motion shows the copy
   instantly, exactly like Apple's `disabledWhen` contract. `active=false`
   keeps the chapter always visible when the section above has no hero. */
function useAppleLinkedReveal(active = true) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ opacity: 0, transform: "translateY(12px)" });
  useEffect(() => {
    const el = ref.current;
    if (!active || !el || typeof window === "undefined") {
      if (!active) setStyle({ opacity: 1, transform: "none" });
      return undefined;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStyle({ opacity: 1, transform: "none" });
      return undefined;
    }
    /* the section top in document coordinates = the height of the hero that
       immediately precedes it, since the persona hero fills the first viewport */
    const heroSpan = () => el.getBoundingClientRect().top + window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const H = heroSpan();
      let p = (window.scrollY - H * 0.3) / (H * 0.6);
      p = Math.min(1, Math.max(0, p));
      setStyle({ opacity: p, transform: `translateY(${(1 - p) * 12}px)` });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active]);
  return { ref, style };
}

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
        <p className="text-center text-[15px] font-normal" style={{ color: COLORS.grey, ...revealStyle(entered, 0) }}>
          {kicker}
        </p>
        <h2
          className="mx-auto mt-[clamp(14px,1.8vw,24px)] max-w-[980px] text-center font-semibold tracking-[-0.009em] leading-[1.05] text-[clamp(40px,5vw,64px)]"
          style={{ color: COLORS.ink, ...revealStyle(entered, 90) }}
        >
          {/* the fixed problem sentence always holds line one; the rotating
              accent word is reserved on line two (a min-h slot) so the chapter
              never reflows and the page never jumps when the word swaps */}
          <span className="block text-balance">{lines.join(" ")}</span>
          <span key={`w-${index}`} className="hero-fade-up block min-h-[1.05em] [animation-duration:0.9s]" style={{ color: COLORS.blue }}>
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
            className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]"
            style={{ color: COLORS.grey, ...revealStyle(entered, 165) }}
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
          style={{ background: "radial-gradient(46% 62% at 50% 100%, rgba(66,133,244,0.05) 0%, rgba(66,133,244,0.02) 46%, rgba(66,133,244,0) 72%)" }}
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
          <p className="flex min-h-[2.9em] items-center justify-center font-normal tracking-[0] leading-[1.45] text-[clamp(17px,1.5vw,21px)]" style={{ color: COLORS.ink }}>
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
          className={`relative h-2 cursor-pointer rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${i === active ? (pill ? "w-12" : "w-10") : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: pill ? "rgba(29,29,31,0.6)" : i === active ? COLORS.ink : `${COLORS.ink}33` }}
        />
      ))}
    </div>
  );
});

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
                transition: `opacity 0.85s ${APPLE_REVEAL_EASE}, transform 0.85s ${APPLE_REVEAL_EASE}`,
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
                style={{ opacity: i === active ? 1 : 0.45, transition: "opacity 1500ms" }}
              >
            <button
              type="button"
              onClick={() => openStage(stage)}
              aria-label={`Open details for ${stage.title}`}
              className="group relative block w-full overflow-hidden rounded-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4"
            >
              <img
                src={stage.image}
                alt={stage.alt}
                loading="eager"
                decoding="async"
                draggable="false"
                className="aspect-[11/16] w-full select-none object-cover transition-transform duration-500 ease-google group-hover:scale-[1.02] min-[735px]:aspect-[692/430] min-[1069px]:aspect-[1.9]"
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
                <span className="mb-3 block text-[13px] font-medium uppercase tracking-[0.14em] text-white/75">{stage.title}</span>
                <span key={stage.statement} className="block max-w-[15ch] font-semibold tracking-[-0.01em] leading-[1.08] text-white text-[28px] min-[735px]:text-[40px] min-[1069px]:text-[48px]">{stage.statement || stage.title}</span>
              </span>
              {/* Apple's story-card affordance — a white 36px circular button
                  carrying the plus cutout, pinned to the card's bottom-right
                  over the smoke and matched to our ink color */}
              <span className="absolute bottom-6 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white sm:bottom-6 sm:right-6">
                <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-[18px] w-[18px]" aria-hidden="true" style={{ color: COLORS.ink }}>
                  <path d="M18 8v20M8 18h20" />
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
          className="flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
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
            className={`flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${active === 0 ? "cursor-default opacity-30" : "hover:opacity-60"}`}
          >
            <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={active === stages.length - 1}
            onClick={() => stepTo(active + 1)}
            className={`flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${active === stages.length - 1 ? "cursor-default opacity-30" : "hover:opacity-60"}`}
          >
            <ChevronIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{`${stages[active].title}. ${stages[active].copy}`}</p>
    </div>
  );
});


/* The stage's story popup — Apple's modal-story anatomy (measured on the
   education-initiative card click-through): a full-screen WHITE blur
   curtain (rgba(255,255,255,0.48) over blur(20px)), the white panel inset
   16px at radius 30px, the media full-bleed at the panel's top edge with
   the stage chip over its own smoke, then the story zone: 48px/600
   heading, 17px body, the canonical black primary pill, and the feature
   blocks. Close is Apple's bare glyph over the media. Escape and the
   backdrop close it; focus is trapped and restored. */
const JourneyModal = React.memo(function JourneyModal({ stage, onClose, modals, stageMeta, fallbackKey, secondaryLabel }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dialog) return;
      const focusables = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const content = modals[stage.title];
  const meta = stageMeta[stage.title] || stageMeta[fallbackKey];
  if (!content) return null;
  const secondary = content.primary.to === "/how-it-works"
    ? { label: secondaryLabel, to: "/register" }
    : { label: "See how it works", to: "/how-it-works" };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[rgba(255,255,255,0.48)] backdrop-blur-[20px] p-4" role="dialog" aria-modal="true" aria-labelledby="journey-modal-title">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default"
      />

      <div
        className="relative mx-auto my-4 max-h-[calc(100vh-32px)] w-full max-w-[1080px] overflow-hidden rounded-[30px] bg-white"
        style={{ animation: "heroFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="max-h-[calc(100vh-32px)] overflow-y-auto">
          {/* the close — Apple's bare modal glyph, top-right over the media */}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center text-white [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.45))] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* media full-bleed to the panel's top/side edges. Apple's story
              modal clips the media by its OWN rounded container (the
              `.modal-contents` overflow:hidden + border-radius:30px), so the
              popup's top border reads cleanly rounded even though the white
              card behind it is separate — we mirror that exactly. */}
          <div className="relative overflow-hidden rounded-[30px]">
            <img src={stage.image} alt={stage.alt} className="aspect-[16/9] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent" aria-hidden="true" />
            <span
              className="absolute bottom-5 left-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium tracking-[0] sm:left-9"
              style={{ color: COLORS.ink }}
            >
              <meta.Icon className="h-3.5 w-3.5" strokeWidth={1.8} style={{ color: COLORS.blue }} />
              Visionary for {stage.title}
            </span>
          </div>

          {/* the story zone — Apple's measured breath, text inset from the
              panel edges; heading at the 48/600 story tier, body 17px */}
          <div className="px-6 pb-12 pt-10 sm:px-12 sm:pb-14 lg:px-16 lg:pb-[72px] lg:pt-14">
            <h3 id="journey-modal-title" className="max-w-[760px] font-semibold tracking-[-0.01em] leading-[1.08] text-[clamp(28px,3.34vw,48px)]" style={{ color: COLORS.ink }}>
              {content.top}
              <br />
              <span style={{ color: COLORS.blue }}>{content.accent}</span>
            </h3>

            <p className="mt-6 max-w-[680px] font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: COLORS.ink }}>
              {content.intro}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={content.primary.to}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#121317] px-6 text-[14px] font-medium text-white transition-all hover:scale-[1.01] hover:bg-[#2c2d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                {content.primary.label}
                <ChevronIcon className="h-4 w-4" />
              </Link>
              <Link
                to={secondary.to}
                className="inline-flex h-11 items-center justify-center rounded-full border px-6 text-[14px] transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ borderColor: COLORS.mist, color: COLORS.ink }}
              >
                {secondary.label}
              </Link>
            </div>

            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {content.blocks.map((b) => (
                <div key={b.t} className="border-t pt-6" style={{ borderColor: COLORS.mist }}>
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                      style={{ borderColor: COLORS.mist, color: COLORS.blue }}
                    >
                      <b.Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-normal tracking-[0] leading-[1.65] text-[14px] sm:text-[15px]" style={{ color: COLORS.grey }}>
                        <strong style={{ color: COLORS.ink }}>{b.t}</strong> {b.c}
                      </p>
                      <Link
                        to={b.to}
                        className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ color: COLORS.blue }}
                      >
                        {b.l}
                        <ChevronIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
const IntelligenceCopy = React.memo(function IntelligenceCopy({ step }) {
  return (
    <div key={step.title} className="hero-fade-up max-w-[460px]">
      <h3 className="whitespace-pre-line font-semibold tracking-[-0.005em] leading-[1.14] text-[28px]" style={{ color: COLORS.ink }}>
        {step.title}
      </h3>
      <p className="mt-4 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
        {step.copy}
      </p>
    </div>
  );
});

/* Designed "intelligence" stage — the homepage's ring-and-V-mark language on
   a flat Google-Store surface. Pure SVG in canonical tokens: no external
   requests, no binary weight. `variant` varies composition so repeated cards
   on one page don't read as copies. Rendered wherever a persona section has
   no local photograph (and as a guard, whenever an http(s) URL is passed). */
const ART_VARIANTS = [
  { rotate: 0, dots: [18, 62, 82], scale: 1 },
  { rotate: 40, dots: [30, 74], scale: 1.06 },
  { rotate: 95, dots: [12, 48, 88], scale: 0.94 },
  { rotate: 150, dots: [24, 66], scale: 1.02 },
];

const isExternalSrc = (src) => typeof src === "string" && /^https?:/i.test(src);

const IntelligenceArt = React.memo(function IntelligenceArt({ label, variant = 0, className = "" }) {
  const v = ART_VARIANTS[variant % ART_VARIANTS.length];
  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden bg-[#f8f9fa] ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="none" stroke="#dadce0" strokeWidth="0.4" strokeDasharray="4 5" transform={`rotate(${v.rotate} 50 50)`} />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#4285F4" strokeOpacity="0.35" strokeWidth="0.45" strokeDasharray="3 6" transform={`rotate(${-v.rotate * 1.6} 50 50)`} />
        <circle cx="50" cy="50" r="24" fill="#ffffff" stroke="#121317" strokeOpacity="0.08" strokeWidth="0.4" />
        {v.dots.map((deg, i) => {
          const rad = ((deg + v.rotate) * Math.PI) / 180;
          return (
            <circle
              key={deg}
              cx={50 + 36 * Math.cos(rad)}
              cy={50 + 36 * Math.sin(rad)}
              r={i === 0 ? 2.1 : 1.4}
              fill="#4285F4"
              fillOpacity={i === 0 ? 1 : 0.55}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="1.5 6 60 44.5" className="w-[26%]" fill="none" aria-hidden="true" style={{ transform: `scale(${v.scale})` }}>
          <g transform="translate(0,64) scale(0.1,-0.1)" fill="#121317" stroke="none">
            <path d="M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z" />
          </g>
        </svg>
      </div>
    </div>
  );
});

/* The product moment on persona pages is photography, matching the landing
   and Organization anatomy. When a step has no photograph (or an http(s)
   placeholder), the light ring-and-V IntelligenceArt stands in — never a
   dark product-window card. */
const IntelligenceVisual = React.memo(function IntelligenceVisual({ step, index, setStepRef, image }) {
  const showArt = !image || isExternalSrc(image);
  return (
    <figure ref={setStepRef(index)} data-step={index} className="m-0">
      {showArt ? (
        <div className="mx-auto flex aspect-[4/3] w-full max-w-[440px] items-center justify-center lg:aspect-[15/16] lg:mx-0 lg:max-w-none">
          <IntelligenceArt label={step.title} variant={index} className="aspect-[4/3] w-full lg:aspect-[15/16]" />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[60px] lg:mx-0 lg:max-w-none">
          <img
            src={image}
            alt={step.title}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]"
          />
        </div>
      )}
    </figure>
  );
});

const LanguageChips = React.memo(function LanguageChips({ active, onSelect, chips }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {chips.map((lang) => (
        <button
          key={lang.code}
          type="button"
          aria-pressed={active === lang.code}
          onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 tracking-[0] leading-[20px] text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${active === lang.code ? "font-medium" : "font-normal border hover:bg-[#121317]/5"}`}
          style={{
            backgroundColor: active === lang.code ? COLORS.chipBg : "transparent",
            color: COLORS.ink,
            borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40`,
          }}
        >
          {lang.label}
        </button>
      ))}
      <span className="ml-1 font-normal tracking-[0] leading-[20px] text-[14px]" style={{ color: COLORS.grey }}>
        +20 languages
      </span>
    </div>
  );
});

const StageDropdown = React.memo(function StageDropdown({ stages, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border px-8 py-3 font-normal tracking-[0] leading-[20px] text-[15px] transition-colors hover:bg-[#121317]/5"
        style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
      >
        {stages[active].name}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Choose a stage" className="elevation-2 absolute left-1/2 z-20 mt-3 w-60 -translate-x-1/2 overflow-hidden rounded-[20px] bg-white py-2">
          {stages.map((s, i) => (
            <li key={s.name}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onClick={() => { onSelect(i); setOpen(false); }}
                className={`block w-full px-5 py-2.5 text-left text-[14px] tracking-[0] transition-colors ${i === active ? "bg-[#D2E3FC] font-medium" : "font-normal hover:bg-[#121317]/5"}`}
                style={{ color: COLORS.ink }}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const ContinuityCard = React.memo(function ContinuityCard({ index, label, caption, text, imgClass = "", className = "", images }) {
  return (
    <div className={className}>
      <p className="mb-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>
        {label}
      </p>
      <div className="relative overflow-hidden rounded-[30px]">
        <img
          src={images[index % images.length]}
          alt={`${label}: ${text}`}
          loading="lazy"
          decoding="async"
          className={`h-[320px] w-full object-cover sm:h-[420px] ${imgClass}`}
        />
  
   <div className="absolute inset-0 bg-gradient-to-t from-[#121317]/55 via-[#121317]/20 to-transparent" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
          <span key={text} className="hero-fade-up text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)]">
            {text}
          </span>
        </div>
      </div>
      <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>
        {caption}
      </p>
    </div>
  );
});

const AchievementAccordion = React.memo(function AchievementAccordion({ tabs, open, onToggle, meta }) {
  return (
    <div>
      {tabs.map((tab, i) => {
        const Meta = meta[i] || meta[0];
        const isOpen = open === i;
        return (
          <div key={tab.black} className="border-b py-10 first:pt-0 lg:py-12" style={{ borderColor: `${COLORS.ink}26` }}>
            
            <button type="button" aria-expanded={isOpen} onClick={() => onToggle(i)} className="flex w-full items-start gap-7 text-left">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors"
                style={{ borderColor: isOpen ? COLORS.blue : `${COLORS.ink}26`, color: isOpen ? COLORS.blue : COLORS.grey }}
              >
                <Meta.Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <h3 className="max-w-[460px] flex-1 font-semibold tracking-[-0.005em] leading-[1.14] text-[28px]" style={{ color: COLORS.ink }}>
                {tab.black} <span style={{ color: COLORS.blue }}>{tab.blue}</span>
              </h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mt-3 h-6 w-6 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} style={{ color: COLORS.grey }}>
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <div className={`grid transition-all duration-500 ease-google ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="max-w-[460px] pt-6 font-normal tracking-[0] leading-[22px] text-[15px] lg:pl-[72px]" style={{ color: COLORS.grey }}>
                  {tab.copy}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const JourneyCategoryCard = React.memo(function JourneyCategoryCard({ index, text, className = "", iconMap, images, onOpen, category, imgAlt }) {
  const Icon = iconMap[text] || Sparkles;
  /* When onOpen is supplied the card behaves like an Apple story card: the
     whole surface is the button that opens the category's story popup. */
  const isInteractive = typeof onOpen === "function";
  const Wrap = isInteractive ? "button" : "div";
  return (
    <Wrap
      type={isInteractive ? "button" : undefined}
      onClick={isInteractive ? () => onOpen(category) : undefined}
      aria-label={isInteractive ? `Open ${text}` : undefined}
      className={`relative block overflow-hidden rounded-[30px] text-left ${isInteractive ? "cursor-pointer border-0 bg-transparent outline-none transition-transform duration-300 ease-google hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4" : ""} ${className}`}
    >
      <img
        src={images[index % images.length]}
        alt={imgAlt || text}
        loading="lazy"
        decoding="async"
        className="aspect-[20/19] w-full object-cover"
      />
      {/* scrim — guarantees white type contrast on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121317]/55 via-[#121317]/20 to-transparent" aria-hidden="true" />
      {/* stage icon pill — consistency with journey cards */}
      <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95" style={{ color: COLORS.blue }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span key={text} className="text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)] animate-[heroFadeUp_0.9s_cubic-bezier(0.22,1,0.36,1)]">
          {text}
        </span>
      </div>
    </Wrap>
  );
});

const TrustCard = React.memo(function TrustCard({ card, image }) {
  const showArt = !image || isExternalSrc(image);
  return (
    <div className="elevation-1 relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
      {showArt ? (
        <IntelligenceArt label={card.title} className="aspect-[8/5] w-full" />
      ) : (
        <img src={image} alt={card.title} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      )}
      {/* white chip guarantees copy contrast on any image */}
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8 sm:max-w-[320px]">
        <div className="rounded-[20px] bg-white/95 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg, color: COLORS.blue }}>
            <card.Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-3 font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
          <Link to={card.to} className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
            {card.link}
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});

const ExploreCard = React.memo(function ExploreCard({ index, category, images }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      className="elevation-1 group block w-[260px] shrink-0 snap-start overflow-hidden rounded-[30px] border bg-white transition-all duration-300 ease-google hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(60,64,67,0.16)] sm:w-[320px]"
      style={{ borderColor: `${COLORS.ink}1A` }}
    >
      <img src={images[index]} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-google group-hover:scale-[1.04]" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-medium tracking-[0] leading-[20px] text-[14px]" style={{ color: COLORS.grey }}>
          {category.chip}
        </p>
        <p className="mt-3 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
          {category.copy}
        </p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>
          Learn more
        </span>
      </div>
    </Link>
  );
});

const ChevronIcon = React.memo(function ChevronIcon({ direction = "right", className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} ${direction === "left" ? "rotate-180" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
});

const VoiceIcon = React.memo(function VoiceIcon({ className = "h-9 w-9", style }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d="M25 7l-5 9 6 4-5 9 3 3-2 7" />
      <path d="M31 19c2.5 2.5 2.5 7.5 0 10" />
      <path d="M35.5 15.5c4.5 4.5 4.5 12 0 16.5" />
    </svg>
  );
});

const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* Apple's scroll-reveal chapter: after the hero, sections enter the viewport
   and their type/photography rise in place, one element at a time, on Apple's
   resolve-out curve (cubic-bezier(0.22,1,0.36,1)). Staggers children via
   :global(.reveal-item > *) so a heading + sub + image each wait their beat —
   the "scroll, then the text appears" cadence. The observer fires once; the
   global reduced-motion contract snaps the transition to instant. */
const SCROLL_REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
function useInViewOnce(threshold = 0.2) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, entered };
}

/* RevealItem wraps one piece of a staggered scroll-reveal chapter so the
   resolve-out stagger targets each element individually. The index drives a
   per-child 60ms delay via the .scroll-reveal.in-view :global(.reveal-item > *)
   rule registered in index.css. Under reduced motion children are visible
   instantly (the CSS rule handles that; this wrapper only annotates). */
let itemCounter = 0;
const RevealItem = React.memo(function RevealItem({ children, className = "", style, idx }) {
  return (
    <div
      className={`reveal-item ${className}`}
      style={{ ["--reveal-idx"]: idx ?? itemCounter, ...style }}
    >
      {children}
    </div>
  );
});
RevealItem.displayName = "RevealItem";

const ScrollReveal = React.memo(function ScrollReveal({ children, className = "", as: Tag = "div", threshold = 0.2, baseDelay = 0 }) {
  const { ref, entered } = useInViewOnce(threshold);
  return (
    <Tag
      ref={ref}
      className={`scroll-reveal ${entered ? "in-view" : ""} ${className}`}
      style={{
        ["--reveal-ease"]: SCROLL_REVEAL_EASE,
        ["--reveal-base-delay"]: `${baseDelay}ms`,
      }}
    >
      {children}
    </Tag>
  );
});

export {
  StruggleChapter,
  CarouselDots,
  JourneyGallery,
  JourneyModal,
  IntelligenceCopy,
  IntelligenceVisual,
  IntelligenceArt,
  LanguageChips,
  StageDropdown,
  ContinuityCard,
  AchievementAccordion,
  JourneyCategoryCard,
  TrustCard,
  ExploreCard,
  ChevronIcon,
  VoiceIcon,
  FadeReveal,
  ScrollReveal,
  RevealItem,
};
