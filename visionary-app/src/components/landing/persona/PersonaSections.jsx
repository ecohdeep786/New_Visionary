import React, { useEffect, useRef, useState } from "react";
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

/** Struggle-circle crop positions and keyframes, identical on every page. */
const STRUGGLE_MAIN_POSITIONS = ["center 30%"];

const STRUGGLE_WORD_STYLE = `
@keyframes struggleWordIn {
  from {
    opacity: 0;
    transform: translate3d(-18px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
`;
const STRUGGLE_IMAGE_STYLE = `
@keyframes struggleImageIn {
  from {
    opacity: 0;
    transform: scale(1.015);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

const StruggleHeading = React.memo(function StruggleHeading({ word, slideKey, lines }) {
  return (
    <h2
      className="font-medium tracking-[0] leading-[1.15] text-[clamp(28px,2.78vw,40px)] lg:leading-[1.08]"
      style={{ color: COLORS.ink }}
    >
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
      <span className="block overflow-hidden whitespace-nowrap">
        <span
          key={slideKey}
          className="inline-block animate-[struggleWordIn_0.65s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ color: COLORS.blue }}
        >
          {word}
        </span>
      </span>
    </h2>
  );
});

const StruggleCluster = React.memo(function StruggleCluster({ slide, slideKey }) {
  return (
    <figure className="m-0 w-full">
      <style>
        {STRUGGLE_WORD_STYLE}
        {STRUGGLE_IMAGE_STYLE}
      </style>

      <div className="relative mx-auto w-full max-w-[520px]">
        {/* circle wrapper — exactly circle-sized, centered in the column */}
        <div className="relative mx-auto w-[86%] max-w-[400px]">
          {/* hand-drawn arrow — lives in the gap BETWEEN heading and circle */}
          <svg
            viewBox="0 0 220 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute -left-[136px] top-1/2 z-10 hidden h-[72px] w-[120px] -translate-y-1/2 lg:block"
            style={{ color: COLORS.ink }}
          >
            <path d="M6 66 C 60 86, 140 84, 198 52" />
            <path d="M198 52 l-16 2" />
            <path d="M198 52 l-6 14" />
          </svg>

          <div className="aspect-square w-full overflow-hidden rounded-full">
            <img
              key={`main-${slideKey}`}
              src={slide.image}
              alt={slide.alt}
              loading="eager"
              decoding="async"
              className="block h-full w-full object-cover animate-[struggleImageIn_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
              style={{ objectPosition: STRUGGLE_MAIN_POSITIONS[slideKey % STRUGGLE_MAIN_POSITIONS.length] }}
            />
          </div>
        </div>

        {/* quote — centered under the circle */}
        <figcaption
          key={`quote-${slideKey}`}
          aria-live="polite"
          className="hero-fade-up mx-auto mt-8 max-w-[520px] px-4 text-center font-normal tracking-[0] leading-[1.4] text-[clamp(16px,1.39vw,20px)] [animation-delay:120ms] [animation-fill-mode:both] sm:px-0"
          style={{ color: COLORS.ink }}
        >
          {slide.quote}
        </figcaption>
      </div>
    </figure>
  );
});

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect, label }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="aria-label={label}">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to challenge ${i + 1}`}
          aria-pressed={i === active}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] ${i === active ? "w-10" : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: i === active ? COLORS.ink : `${COLORS.ink}33` }}
        />
      ))}
    </div>
  );
});

const JourneyCarousel = React.memo(function JourneyCarousel({ stages, onOpen, trackRef, onScroll, canPrev, canNext, scrollByCard, iconMap }) {
  const ALIGN = "max(1.5rem, calc(50% - 40rem))";

  return (
    <div className="mt-16 lg:mt-20">
      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{ paddingLeft: ALIGN, paddingRight: "max(1.5rem, 6%)", scrollPaddingLeft: ALIGN }}
        className="flex snap-x snap-mandatory gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stages.map((stage) => {
          const Icon = iconMap[stage.title] || Sparkles;
          return (
            <article key={stage.title} id={stage.id} data-card className="w-[85%] shrink-0 snap-start scroll-mt-24 sm:w-[440px] lg:w-[700px] xl:w-[780px]">
              <button
                type="button"
                onClick={() => onOpen(stage)}
                aria-label={`Open details for ${stage.title}`}
                className="group relative block w-full overflow-hidden rounded-[50px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4"
              >
                <img
                  src={stage.image}
                  alt={stage.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full rounded-[50px] object-cover transition-transform duration-500 ease-google group-hover:scale-[1.02]"
                />
                {/* stage icon pill — the missing icon layer */}
                <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95" style={{ color: COLORS.blue }}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="elevation-2 absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:scale-110" style={{ color: COLORS.ink }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <h3 className="mt-[calc(clamp(28px,2.9vw,40px)*1.714)] text-center font-normal tracking-[0] leading-[1.02] text-[clamp(28px,2.9vw,40px)]" style={{ color: COLORS.ink }}>{stage.title}</h3>
              <p className="mx-auto mt-[calc(clamp(28px,2.9vw,40px)*0.714)] max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{stage.copy}</p>
            </article>
          );
        })}
      </div>
      <div className="mt-12 flex justify-end px-6 lg:mt-16 lg:pr-[9%]">
        <div className="inline-flex items-center gap-10 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.cardSurface }}>
          <button type="button" aria-label="Previous stages" disabled={!canPrev} onClick={() => scrollByCard(-1)} className={`transition-colors ${canPrev ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canPrev ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="left" />
          </button>
          <button type="button" aria-label="Next stages" disabled={!canNext} onClick={() => scrollByCard(1)} className={`transition-colors ${canNext ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canNext ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
});

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-6" role="dialog" aria-modal="true" aria-labelledby="journey-modal-title">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[#121317]/60"
      />

      <div
        className="relative max-h-[88vh] w-full max-w-[1080px] overflow-y-auto rounded-[28px] bg-white p-6 sm:p-10 lg:p-14"
        style={{ animation: "heroFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#121317] text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
          {stage.title}
        </p>

        <h3 id="journey-modal-title" className="mt-[calc(clamp(30px,3.8vw,56px)*0.4)] max-w-[860px] font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(30px,3.8vw,56px)]" style={{ color: COLORS.ink }}>
          {content.top}
          <br />
          <span style={{ color: COLORS.blue }}>{content.accent}</span>
        </h3>

        <div className="relative mt-8 overflow-hidden rounded-[24px]">
          <img src={stage.image} alt={stage.alt} className="aspect-[21/9] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121317]/60 via-[#121317]/20 to-transparent p-5">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em]"
              style={{ color: COLORS.ink }}
            >
              <meta.Icon className="h-3.5 w-3.5" strokeWidth={1.8} style={{ color: COLORS.blue }} />
              Visionary for {stage.title}
            </span>
          </div>
        </div>

        <p className="mt-7 max-w-[680px] font-normal tracking-[0] leading-[1.65] text-[15px] sm:text-[16px]" style={{ color: COLORS.grey }}>
          {content.intro}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={content.primary.to}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
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
  );
});

const IntelligenceCopy = React.memo(function IntelligenceCopy({ step }) {
  return (
    <div key={step.title} className="hero-fade-up max-w-[460px]">
      <h3 className="whitespace-pre-line font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
        {step.title}
      </h3>
      <p className="mt-[calc(clamp(28px,2.78vw,40px)*1.429)] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
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

const IntelligenceVisual = React.memo(function IntelligenceVisual({ step, index, setStepRef, image }) {
  const showArt = !image || isExternalSrc(image);
  return (
    <figure ref={setStepRef(index)} data-step={index} className="m-0">
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[60px] lg:mx-0 lg:max-w-none">
        {showArt ? (
          <IntelligenceArt label={step.title} variant={index} className="aspect-[4/3] w-full lg:aspect-[15/16]" />
        ) : (
          <img
            src={image}
            alt={step.title}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]"
          />
        )}
      </div>
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
          className={`rounded-full px-5 py-2 uppercase tracking-[0] leading-[14px] text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${active === lang.code ? "font-medium" : "font-normal border hover:bg-[#121317]/5"}`}
          style={{
            backgroundColor: active === lang.code ? COLORS.chipBg : "transparent",
            color: COLORS.ink,
            borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40`,
          }}
        >
          {lang.label}
        </button>
      ))}
      <span className="ml-1 font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
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
      <div className="relative overflow-hidden rounded-[48px]">
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
              <h3 className="max-w-[460px] flex-1 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
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

const JourneyCategoryCard = React.memo(function JourneyCategoryCard({ index, text, className = "", iconMap, images }) {
  const Icon = iconMap[text] || Sparkles;
  return (
    <div className={`relative overflow-hidden rounded-[48px] ${className}`}>
      <img
        src={images[index % images.length]}
        alt={text}
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
    </div>
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
      className="elevation-1 block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white sm:w-[320px]"
      style={{ borderColor: `${COLORS.ink}1A` }}
    >
      <img src={images[index]} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
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

export {
  StruggleHeading,
  StruggleCluster,
  CarouselDots,
  JourneyCarousel,
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
};
