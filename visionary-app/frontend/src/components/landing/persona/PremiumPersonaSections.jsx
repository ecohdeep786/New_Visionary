import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useRevealOnce,
  useHorizontalTrack as useScrollTrack,
} from "@/components/landing/system/hooks";
import { ScrollReveal, RevealItem, ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══════════════════════════════════════════════════════════════════════
 * PREMIUM PARITY SECTIONS — the student page's FINAL section anatomy, shared
 * by every persona page so all five pages share one exact Apple-premium
 * section-for-section match. Each component mirrors the student page's inline
 * sections exactly; only the data differs.
 *
 * 05 · INTELLIGENCE — the dark technology chapter: one sticky product stage,
 * four beats swap it as their copy crosses the viewport centre. */

const COLORS = {
  /* one source insight: match system/tokens.js (the measured system) so this
     module renders from the same values as the rest of the landing. */
  ink: "#1d1d1f",
  blue: "#0066cc",
  grey: "#6e6e73",
  lightGrey: "#86868b",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useCentredStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      nodes.current.slice(0, total).forEach((n, i) => {
        if (!n) return;
        const r = n.getBoundingClientRect();
        const dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [total]);
  const setStepRef = useCallback((i) => (node) => { nodes.current[i] = node; }, []);
  return { active, setStepRef, nodes };
}

const INTELLIGENCE_CLIPS = [null, null, null, null];

/* Four scenes of ONE intelligence — the same mark evolving, on Apple's dark
   technology-chapter stage: near-black field, blue glow breathing behind,
   hairline white rings, frost core, glowing blue satellites. */
function IntelligenceBeats({ index, label }) {
  const core = "#f5f7fa", blue = "#2997ff", hairline = "rgba(255,255,255,0.14)", track = "rgba(255,255,255,0.12)";
  const stage = { background: "radial-gradient(58% 52% at 50% 44%, rgba(0,102,204,0.2) 0%, rgba(0,102,204,0.06) 46%, rgba(13,16,23,0) 74%)" };
  if (index === 0) {
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          <circle cx="50" cy="50" r="34" fill="none" stroke={blue} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="2 6" />
          <circle cx="50" cy="50" r="22" fill="rgba(255,255,255,0.03)" stroke={core} strokeOpacity="0.12" strokeWidth="0.4" />
          {[[50,6],[81,30],[81,70],[50,94],[19,70],[19,30]].map(([cx,cy],i)=>(
            <g key={i}>
              <line x1="50" y1="50" x2={cx} y2={cy} stroke={blue} strokeOpacity="0.45" strokeWidth="0.4" strokeDasharray="2 3" />
              <circle cx={cx} cy={cy} r={i===0?2.1:1.5} fill={blue} fillOpacity={i===0?1:0.5} />
            </g>
          ))}
          <circle cx="50" cy="50" r="6.5" fill={blue} fillOpacity="0.22" />
          <circle cx="50" cy="50" r="3.4" fill={core} />
        </svg>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          <circle cx="50" cy="50" r="16" fill="rgba(255,255,255,0.04)" stroke={blue} strokeOpacity="0.55" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="6" fill={blue} fillOpacity="0.2" />
          <circle cx="50" cy="50" r="3" fill={core} />
          {/* three arcs at 120° */}
          {[0,120,240].map((deg,i)=>{
            const rad = (deg-90)*Math.PI/180;
            const r=27, w=11;
            return <path key={i} d={`M ${50+(r)*Math.cos(rad)} ${50+(r)*Math.sin(rad)} L ${50+(r+w)*Math.cos(rad)} ${50+(r+w)*Math.sin(rad)}`} stroke={i===1?blue:core} strokeWidth="2" strokeLinecap="round" strokeOpacity={i===1?0.95:0.5} />;
          })}
          {[0,120,240].map((deg,i)=>{
            const rad = (deg-90+20)*Math.PI/180;
            return <circle key={i} cx={50+43*Math.cos(rad)} cy={50+43*Math.sin(rad)} r={i===0?2.2:1.4} fill={i===0?blue:core} fillOpacity={i===0?1:0.4} />;
          })}
        </svg>
      </div>
    );
  }
  if (index === 2) {
    // Practice — a progress arc building with dots marching
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          {/* ~300° progress arc */}
          <path d="M 50 12 A 38 38 0 1 1 21 73" fill="none" stroke={track} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 50 8 A 42 42 0 1 1 18 76" fill="none" stroke={blue} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
          {/* marching dots along the arc */}
          {[0,40,80,120,160,200,240,280].map((deg,i)=>{
            const rad = (deg-90)*Math.PI/180;
            return <circle key={i} cx={50+40*Math.cos(rad)} cy={50+40*Math.sin(rad)} r={i===7?2.2:1.4} fill={i===7?core:blue} fillOpacity={i===7?1:0.5} />;
          })}
          <circle cx="50" cy="50" r="2.6" fill={core} />
          {/* a check spark near the end of the arc */}
          <path d="M 78 20 l 3 4 7 -8" fill="none" stroke={blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  // Build — the artifact radiates out into the work
  return (
    <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
        <circle cx="50" cy="50" r="32" fill="none" stroke={blue} strokeOpacity="0.3" strokeWidth="0.5" />
        {[0,45,90,135,180,225,270,315].map((deg,i)=>{
          const rad = (deg-90)*Math.PI/180;
          const hyp = 32 + (i%3===0?6:0);
          const hex = 50 + hyp*Math.cos(rad), hey = 50 + hyp*Math.sin(rad);
          const tex = 50 + 43*Math.cos(rad), tey = 50 + 43*Math.sin(rad);
          const isHub = i===2;
          return (
            <g key={i}>
              <line x1={hex} y1={hey} x2={tex} y2={tey} stroke={isHub?core:blue} strokeWidth={isHub?0.9:0.5} strokeOpacity={isHub?1:0.45} />
              <circle cx={hex} cy={hey} r={isHub?1.8:1.2} fill={isHub?core:blue} fillOpacity={isHub?1:0.55} />
              <circle cx={tex} cy={tey} r={isHub?2.4:1.5} fill={isHub?core:blue} fillOpacity={isHub?1:0.5} />
            </g>
          );
        })}
        <circle cx="50" cy="50" r="6" fill={blue} fillOpacity="0.18" />
        <circle cx="50" cy="50" r="3" fill={core} />
      </svg>
    </div>
  );
}

/* One sticky product stage — the chapter's video rectangle. Hairline chrome on a
   raised ink field; every beat is stacked and cross-faded by `active` with a
   settle-scale, a clip plays only while its beat is active, and reduced
   motion snaps everything to instant. The 30px radius matches the journey
   story cards exactly. */
const IntelligenceFrame = React.memo(function IntelligenceFrame({ steps, active, autoplay = true, plain = false }) {
  const reduced = usePrefersReducedMotion();
  const videos = useRef([]);
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (autoplay && i === active && !reduced) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, autoplay, reduced]);
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[30px] border"
      style={{ backgroundColor: "#0d1017", borderColor: plain ? "transparent" : "rgba(255,255,255,0.1)" }}
    >
      {steps.map((s, i) => (
        <div
          key={s.title}
          aria-hidden={i !== active}
          className="absolute inset-0"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "none" : "scale(0.97)",
            transition: reduced
              ? "none"
              : "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {INTELLIGENCE_CLIPS[i] ? (
            <video
              ref={(el) => (videos.current[i] = el)}
              src={INTELLIGENCE_CLIPS[i]}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={s.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <IntelligenceBeats index={i} label={s.title} />
          )}
        </div>
      ))}
    </div>
  );
});

const IntelligenceDrawer = React.memo(function IntelligenceDrawer({ step, index, total, active = false }) {
  const frost = "rgba(245,247,250,0.72)";
  const frostDim = "rgba(245,247,250,0.45)";
  return (
    <div key={`${index}-${step.title}`} className="hero-fade-up w-full">
      <p className="text-[13px] font-medium tracking-[0.08em] leading-[1.4]">
        <span style={{ color: active ? "#2997ff" : frostDim }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: frostDim }}>{String(total).padStart(2, "0")}</span>
      </p>
      <h3
        className="mt-4 whitespace-pre-line font-semibold tracking-[-0.005em] leading-[1.14] text-[clamp(26px,2.4vw,32px)]"
        style={{ color: "#f5f7fa", maxWidth: "35ch" }}
      >
        {step.title}
      </h3>
      <p
        className="mt-4 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
        style={{ color: frost, maxWidth: "35ch" }}
      >
        {step.copy}
      </p>
    </div>
  );
});

function PremiumIntelligenceSection({ steps, sub, promo = false, ctaLabel, ctaTo }) {
  const { ref: headRef } = useRevealOnce();
  const { active, setStepRef, nodes } = useCentredStep(steps.length);
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = useState(0);

  /* promo mode — the front door's product band: the chapter's statement over
     one slowly morphing stage (the mark walks its four scenes), one door
     out to the full mechanism. No beats, no drawers, no dots — the door is
     the dark-band white pill (Apple's dark chapters never carry a filled
     accent button; the accent lives in the statement and the light) and the
     mark floats bare, no card border. The default renders the full chapter
     every category page carries. */
  useEffect(() => {
    if (!promo || reduced) return undefined;
    const id = setInterval(() => setBeat((b) => (b + 1) % steps.length), 4200);
    return () => clearInterval(id);
  }, [promo, reduced, steps.length]);

  const scrollToBeat = useCallback((i) => {
    const node = nodes.current?.[i];
    if (!node) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }, [nodes]);

  if (promo) {
    return (
      <section ref={headRef} data-section="05-intelligence" className="scene-dark relative [overflow-x:clip]" style={{ fontFamily: fontStack }}>
        {/* the chapter's one breath of light — kept in promo scale */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
          style={{ background: "radial-gradient(52% 74% at 50% 0%, rgba(0,102,204,0.13) 0%, rgba(0,102,204,0.04) 46%, rgba(10,13,20,0) 74%)" }}
        />
        <ScrollReveal className="relative mx-auto flex w-full max-w-[980px] flex-col items-center px-6 text-center">
          <RevealItem idx={0}>
            <h2
              className="text-balance font-semibold tracking-[-0.015em] leading-[1.05] text-[clamp(40px,5.55vw,80px)]"
              style={{ maxWidth: "22ch", marginInline: "auto" }}
            >
              <span className="accent-gradient-on-dark">One intelligence.</span>
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
            <p className="text-frost text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]">
              {sub}
            </p>
          </RevealItem>
          {ctaLabel ? (
            <RevealItem idx={2}>
              <Link
                to={ctaTo}
                className={`mt-9 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-[21px] text-[17px] leading-[1.176] tracking-[-0.011em] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
                  promo
                    ? "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] focus-visible:ring-offset-[#0a0d14]"
                    : "bg-[#1d1d1f] text-white hover:bg-[#272729]"
                }`}
              >
                {ctaLabel}
                <ChevronIcon className="h-4 w-4" />
              </Link>
            </RevealItem>
          ) : null}
        </ScrollReveal>
        <div aria-hidden="true" className="relative mx-auto mt-16 w-full px-6">
          <div className="mx-auto aspect-square w-full max-w-[560px]">
            <IntelligenceFrame steps={steps} active={beat} autoplay={false} plain />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={headRef} data-section="05-intelligence" className="scene-dark relative [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      {/* the chapter's one breath of light — blue rising from above the
          statement, so all color lives in the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{ background: "radial-gradient(52% 74% at 50% 0%, rgba(0,102,204,0.13) 0%, rgba(0,102,204,0.04) 46%, rgba(10,13,20,0) 74%)" }}
      />
      {/* statement opening — one gradient wordmark, one subhead capped at
          two lines. Apple's dark technology chapter: centered headline
          constrained to 22ch, supporting line at 40ch with balanced
          measure. */}
      <ScrollReveal className="relative mx-auto flex w-full max-w-[980px] flex-col items-center px-6 text-center">
        <RevealItem idx={0}>
          <h2
            className="text-balance font-semibold tracking-[-0.015em] leading-[1.05] text-[clamp(40px,5.55vw,80px)]"
            style={{ maxWidth: "22ch", marginInline: "auto" }}
          >
            <span className="accent-gradient-on-dark">One intelligence.</span>
          </h2>
        </RevealItem>
        <RevealItem idx={1}>
          <p className="text-frost text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]">
            {sub}
          </p>
        </RevealItem>
      </ScrollReveal>

      {/* the product flow — four beats scroll past one video-ready stage;
          inactive beats dim like Apple's non-active cards. */}
      <div className="relative mx-auto grid w-full grid-cols-1 gap-16 px-6 pt-24 min-[1069px]:max-w-[980px] lg:grid-cols-[5fr_6fr] lg:gap-32 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          {steps.map((s, i) => (
            <div
              key={s.title}
              ref={setStepRef(i)}
              data-step={i}
              className="flex min-h-[64vh] items-center py-[8vh]"
            >
              <div
                className="w-full"
                style={{
                  opacity: active === i ? 1 : 0.4,
                  transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <IntelligenceDrawer step={s} index={i} total={steps.length} active={active === i} />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-14 flex h-[calc(100vh-2rem)] flex-col items-center justify-center">
            <div className="aspect-[15/16] w-full">
              <IntelligenceFrame steps={steps} active={active} />
            </div>
            <div className="mt-7 flex items-center gap-2.5" role="group" aria-label="Intelligence steps">
              {steps.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  aria-pressed={i === active}
                  onClick={() => scrollToBeat(i)}
                  className="relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-4 after:-inset-x-3 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997ff] focus-visible:ring-offset-2"
                  style={{ width: i === active ? 40 : 8, backgroundColor: i === active ? "#2997ff" : "rgba(245,247,250,0.3)" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* mobile: each beat stacks its stage above its copy */}
        <div className="flex flex-col gap-24 lg:hidden">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div className="mx-auto aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-[30px]">
                <IntelligenceFrame steps={steps} active={i} autoplay={false} />
              </div>
              <div className="mt-10">
                <IntelligenceDrawer step={s} index={i} total={steps.length} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PremiumIntelligenceSection };

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
        <circle cx="50" cy="50" r="49.75" fill="none" stroke={COLORS.ink} strokeOpacity="0.12" strokeWidth="0.25" />
      </svg>
      {/* the rotating dot ring */}
      <div className="absolute inset-0 transition-transform ease-google" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reduced ? "0ms" : "700ms" }}>
        {chips.map((c, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={c.code} className="absolute inset-0" style={{ transform: `rotate(${-i * stepDeg}deg)` }}>
              <button type="button" aria-pressed={isActive} aria-label={`Show ${c.label}`}
                onClick={() => onSelect(i)}
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full after:absolute after:-inset-y-4 after:-inset-x-4 after:rounded-full after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ boxShadow: isActive ? "0 0 0 5px rgba(18,19,23,0.05)" : "none" }}>
                <span className="block rounded-full transition-all duration-500 ease-apple"
                  style={{ width: isActive ? 12 : 7, height: isActive ? 12 : 7, backgroundColor: isActive ? COLORS.ink : `${COLORS.ink}3D` }} />
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
      className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
          <p className="text-center text-[18px] font-medium" style={{ color: COLORS.grey }}>{eyebrow}</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2
            className="text-balance mt-[var(--gap-eyebrow-title-display)] text-center font-semibold tracking-[-0.009em] leading-[1.08] text-[clamp(40px,5vw,64px)]"
            style={{ color: COLORS.ink, maxWidth: "24ch", marginInline: "auto" }}
          >
            {line1}<br className="hidden sm:block" /><span className="accent-gradient">{accent}</span>{tail}
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p
            className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] text-center font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: COLORS.grey }}
          >
            {sub}
          </p>
        </RevealItem>
        {/* the chapter's one quiet link — Apple's feature-chapter affordance */}
        <RevealItem idx={3}>
          <div className="mt-5 flex justify-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              Learn more
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
                <span key={`name-${index}`} className="hero-fade-up text-[14px] font-medium tracking-[0] leading-[1.5]" style={{ color: COLORS.grey }}>{active.label}</span>
                <p aria-live="polite" lang={active.code} className="mt-3 flex items-center justify-center text-center font-semibold tracking-[-0.01em] leading-[1.15] text-[clamp(22px,2.2vw,32px)]" style={{ color: COLORS.ink, maxWidth: "80%" }}>
                  <span key={index} className="hero-fade-up text-balance">{question}</span>
                </p>
                <div className="mt-5 flex items-end justify-center gap-1.5" aria-hidden="true">
                  {["#1d1d1f", "#0066cc", "#1d1d1f", "#1d1d1f"].map((c, i) => (
                    <span key={i} className="h-6 w-1.5 rounded-full" style={{ backgroundColor: c, opacity: i === 1 ? 1 : 0.22, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
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
                  className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next language"
                  onClick={() => step(1)}
                  className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
            <p className="text-center font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.lightGrey }}>
              Listening in {active.label} · understood in every language
            </p>
            <p className="mt-1 text-center font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.lightGrey }}>
              Use voice or text in the way you're comfortable.
            </p>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}

export { PremiumLanguageSection };


/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════
   Apple's Watch-page closing module ("Made for each other."), measured live
   Oct 2026: the statement IS the chapter opener (no eyebrow, no subhead — type
   is the hero), set on the same left spine as the one module below it. One
   rounded container on the flat white ground holds the whole chapter: an
   accordion column left (statement-size titles, hairline separators, compact
   dark chevrons, 18px body) beside the visual where all color lives. No links
   — the page's CTAs live in their own chapters. */
function PremiumAchievementSection({ heading, tabs, images }) {
  const { ref } = useRevealOnce();
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} data-section="09-achievement" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip]">
      <ScrollReveal>
        <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
          <RevealItem idx={0}>
            <h2
              className="text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]"
              style={{ color: COLORS.ink, maxWidth: "24ch" }}
            >
              {heading}
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
          <div className="mt-14 overflow-hidden rounded-[30px] bg-[#f5f5f7] lg:mt-24 lg:h-[760px]">
            <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-stretch">
              <ul className="flex flex-col justify-center px-6 py-6 lg:px-0 lg:py-10 lg:pl-[80px] lg:pr-[44px]">
                {tabs.map((tab, i) => {
                  const isOpen = active === i;
                  return (
                    <li key={tab.title} className="border-t first:border-t-0 lg:first:border-t-0" style={{ borderColor: `${COLORS.ink}29` }}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setActive(i)}
                        className="flex w-full items-start justify-between gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4 lg:py-8"
                      >
                        <span
                          className="font-semibold tracking-[0.007em] leading-[1.14] text-[clamp(24px,2.2vw,30px)]"
                          style={{ color: COLORS.ink, maxWidth: "28ch" }}
                        >
                          {tab.title}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`mt-2 h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "#6e6e73" }}
                          strokeWidth={2.5}
                        />
                      </button>
                      <div className={`grid transition-all duration-500 ease-google ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <p
                            className="pb-9 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
                            style={{ color: COLORS.ink, maxWidth: "35ch" }}
                          >
                            {tab.copy}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="relative min-h-[420px] lg:min-h-0">
                {/* the visual — a white media card inset on the grey ground
                    (Apple's card-in-module treatment): the full photo shows,
                    nothing cropped, its own white studio field merging into
                    the card so no frame edge ever reads */}
                <div key={active} className="hero-fade-up absolute inset-4 overflow-hidden rounded-[20px] bg-white sm:inset-6 lg:inset-10">
                  <img
                    src={images[active]}
                    alt={tabs[active].title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}

export { PremiumAchievementSection };


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
        <h3 className="max-w-[18ch] text-balance text-[17px] font-semibold leading-[1.4] tracking-[0]" style={{ color: COLORS.ink }}>
          {stage.title}
        </h3>
        <p
          className="mt-2 text-balance text-[28px] font-semibold leading-[1.14] tracking-[0.007em]"
          style={{ color: COLORS.ink, maxWidth: "22ch" }}
        >
          {stage.statement}
        </p>
      </figcaption>
      <div className="media-settle relative mt-7 min-h-0 flex-1">
        <img
          key={stage.statement}
          src={stage.image}
          alt={stage.alt}
          loading="lazy"
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
      className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
          <p className="px-6 text-center text-[17px] font-medium" style={{ color: COLORS.grey }}>{eyebrow}</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2
            className="px-6 text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]"
            style={{ color: COLORS.ink, maxWidth: "24ch", marginInline: "auto", marginTop: "var(--gap-eyebrow-title-display)" }}
          >
            {heading}
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p
            className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] px-6 text-center font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: COLORS.grey }}
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
                style={{ color: COLORS.ink }}
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
                style={{ color: COLORS.ink }}
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
                  className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                >
                  <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next stages"
                  onClick={() => step(1)}
                  className="flex h-9 w-9 items-center justify-center text-[#1d1d1f]/60 transition-[color,transform] duration-150 hover:text-[#1d1d1f] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
              className="inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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

export { PremiumJourneyFlowSection };


/* ═══════════════════════ 11 · TRUST ═══════════════════════
   Apple's education-page values anatomy ("Our values lead the way."): the
   statement opens left on the spine with no eyebrow, then the values stand
   directly on the white ground as typographic columns — noun title, one
   supporting sentence in Apple's first-person voice, one quiet link —
   separated by hairline rules. No icons and no cards: the type carries the
   trust. (Icons keep the student page's quiet 20px line, nothing more.) */
function PremiumTrustSection({ heading, sub, values, variant }) {
  const { ref } = useRevealOnce();
  const feature = variant === "feature";

  const headingBlock = (
    <RevealItem idx={0}>
      <h2
        className="text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]"
        style={{ color: COLORS.ink, maxWidth: "24ch" }}
      >
        {heading}
      </h2>
    </RevealItem>
  );

  const subBlock = (
    <RevealItem idx={1}>
      <p
        className={`text-balance mt-[var(--gap-title-sub-display)] font-normal tracking-[0] leading-[1.4] text-[18px] ${feature ? "max-w-[52ch]" : "max-w-[40ch]"}`}
        style={{ color: COLORS.grey }}
      >
        {sub}
      </p>
    </RevealItem>
  );

  /* The feature card's supporting line is body copy, not the page's semibold
     lead — the extra wrapper keeps it out of the h2-lead role so the panel's
     statement stays the only loud voice in the card. */
  const featureSubBlock = (
    <RevealItem idx={1}>
      <div>
        <p
          className="text-balance mt-[var(--gap-title-sub-display)] max-w-[34ch] font-normal tracking-[0] leading-[1.5] text-[19px]"
          style={{ color: COLORS.grey }}
        >
          {sub}
        </p>
      </div>
    </RevealItem>
  );

  return (
    <section ref={ref} data-section="11-trust" className="public-values relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        {feature ? (
          /* The landing's feature-card variant — Apple Watch's close-card
             anatomy: the values stop being four columns on the page and become
             one designed panel on the white ground. The statement heads the
             card, then the four marks stand in a 2×2 Why-grid, each in the
             public pages' own icon vocabulary. The persona pages keep the
             typographic anatomy below. */
          <div className="public-editorial-frame mx-auto">
            <div className="rounded-[1.75rem] bg-[#f5f5f7] px-5 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
              <div className="grid gap-y-0 min-[1069px]:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] min-[1069px]:items-end min-[1069px]:gap-x-14">
                {headingBlock}
                {featureSubBlock}
              </div>
              <RevealItem idx={2} className="stagger-group">
                <div
                  className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 border-t pt-9 sm:grid-cols-2 lg:mt-12 lg:gap-x-14 lg:gap-y-10 lg:pt-11"
                  style={{ borderColor: "rgba(18,19,23,0.08)" }}
                >
                  {values.map((value) => (
                    <article key={value.title} className="stagger-child flex items-start gap-4 sm:block">
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white sm:h-12 sm:w-12"
                        style={{ border: "1px solid rgba(18,19,23,0.05)", boxShadow: "0 1px 2px rgba(18,19,23,0.05)" }}
                      >
                        {value.Icon ? <value.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.55} style={{ color: COLORS.ink }} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 data-type="value-title" className="mt-0 sm:mt-5" style={{ color: COLORS.ink }}>
                          {value.title}
                        </h3>
                        <p data-type="value-body" className="mt-2 max-w-[36ch] text-balance" style={{ color: COLORS.grey }}>
                          {value.copy}
                        </p>
                        <Link
                          to={value.to}
                          aria-label={`Learn more about ${value.title.toLowerCase()}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                        >
                          Learn more
                          <ChevronIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </RevealItem>
            </div>
          </div>
        ) : (
          <div className="public-editorial-frame mx-auto">
            {headingBlock}
            {subBlock}

            {/* the values — typographic columns on the ground, hairline rules.
                Four values (the landing's trust doors) open a fourth column;
                the three-value pages keep their accepted three-up rhythm. */}
            <RevealItem idx={2} className="stagger-group">
              <div className={`mt-14 grid grid-cols-1 lg:mt-20 ${values.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {values.map((value, i) => (
                  <article
                    key={value.title}
                    className={`stagger-child py-10 first:pt-0 lg:py-0 lg:px-10 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "border-t lg:border-t-0 lg:border-l" : ""}`}
                    style={{ borderColor: `${COLORS.ink}1A` }}
                  >
                    {value.Icon && <value.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} style={{ color: COLORS.ink }} />}
                    <h3 data-type="value-title" className={value.Icon ? "mt-4" : "mt-0"} style={{ color: COLORS.ink }}>
                      {value.title}
                    </h3>
                    <p data-type="value-body" className="mt-2 max-w-[35ch] text-balance" style={{ color: COLORS.grey }}>
                      {value.copy}
                    </p>
                    <Link
                      to={value.to}
                      aria-label={`Learn more about ${value.title.toLowerCase()}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                    >
                      Learn more
                      <ChevronIcon className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            </RevealItem>
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}

export { PremiumTrustSection };

/* ═══════════════════════ 12 · CTA ═══════════════════════
   The closer bookends the hero on Apple's product-hero anatomy: the statement
   opens the chapter (no eyebrow), one text-only primary pill with one quiet
   path beside it, and the small print beneath — the way Apple's product
   heroes pair "Learn more" with a quiet "Buy". An optional routeLinks row re-offers the page's forks under the actions — Apple's tail mini-router. */
function PremiumCTASection({ heading, sub, routeLinks, variant }) {
  const { ref } = useRevealOnce();
  const closing = variant === "closing";
  return (
    <section
      ref={ref}
      data-section="12-cta"
      className={
        closing
          ? "scene-dark relative isolate overflow-hidden px-6 py-24 lg:py-32"
          : "relative isolate bg-[#f5f5f7] px-6 py-24 lg:py-32 rounded-t-[32px]"
      }
    >
      {/* The landing's ceremonial close — Beats'/Apple's black closing band:
          one line, one pair of actions, the product's own breath of light
          beneath, and the orbit's two faint rings crossing the lower third.
          No grid, no columns: the page ends on a moment, not another reading
          task. */}
      {closing ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-[-16%] -translate-x-1/2 rounded-full"
            style={{
              width: "min(115vw, 820px)",
              height: "min(115vw, 820px)",
              background: "radial-gradient(circle at 50% 48%, rgba(0,102,204,0.20) 0%, rgba(0,102,204,0.06) 44%, rgba(10,13,20,0) 72%)",
            }}
          />
          <div
            className="absolute left-1/2 top-[64%] -translate-x-1/2 rounded-full border"
            style={{
              width: "min(140vw, 1240px)",
              height: "min(140vw, 1240px)",
              borderColor: "rgba(138,180,248,0.12)",
            }}
          />
          <div
            className="absolute left-1/2 top-[64%] -translate-x-1/2 rounded-full border"
            style={{
              width: "min(104vw, 900px)",
              height: "min(104vw, 900px)",
              borderColor: "rgba(138,180,248,0.07)",
            }}
          />
        </div>
      ) : null}
      <ScrollReveal>
        <div
          className={`mx-auto max-w-[1500px] text-center ${
            closing ? "relative flex min-h-[clamp(280px,36svh,420px)] flex-col justify-center" : ""
          }`}
        >
          <RevealItem idx={0}>
            <h2
              className={`text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)] ${closing ? "text-white" : ""}`}
              style={{ color: closing ? "#f5f5f7" : COLORS.ink, maxWidth: "24ch", marginInline: "auto" }}
            >
              {heading}
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
          {closing ? (
            /* body copy, not the page lead — the close keeps one loud voice */
            <div>
              <p className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[46ch] font-normal tracking-[0] leading-[1.5] text-[19px] text-white/70">
                {sub}
              </p>
            </div>
          ) : (
            <p
              className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]"
              style={{ color: COLORS.grey }}
            >
              {sub}
            </p>
          )}
          </RevealItem>
          <RevealItem idx={2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-[21px] font-medium text-[17px] leading-[1.176] tracking-[-0.011em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px] ${
                closing ? "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]" : "bg-[#1d1d1f] text-white hover:bg-[#272729]"
              }`}
            >
              Get started
            </Link>
            <Link
              to="/contact"
              className={`inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[18px] font-medium tracking-[0] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px] ${
                closing ? "text-[#2997ff] hover:text-[#6bb6ff]" : "text-[#0066cc] hover:text-[#0071e3]"
              }`}
            >
              Talk to our team
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
          </RevealItem>
          <RevealItem idx={3}>
          {routeLinks?.length ? (
            <p
              className={`mt-8 text-center font-normal tracking-[0] text-[15px] leading-[1.5] ${closing ? "text-white/50" : ""}`}
              style={closing ? undefined : { color: COLORS.grey }}
            >
              See how it works for{" "}
              {routeLinks.map((route, i) => (
                <React.Fragment key={route.to}>
                  <Link
                    to={route.to}
                    className={`rounded font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
                      closing ? "text-[#2997ff] hover:text-[#6bb6ff]" : "text-[#0066cc] hover:text-[#0071e3]"
                    }`}
                  >
                    {route.label}
                  </Link>
                  {i < routeLinks.length - 1 ? <span aria-hidden="true">{"\u00A0· "}</span> : null}
                </React.Fragment>
              ))}
            </p>
          ) : null}
          <p
            className={`mt-8 text-center font-normal tracking-[0] text-[14px] leading-[1.5] ${closing ? "text-white/45" : ""}`}
            style={closing ? undefined : { color: COLORS.grey }}
          >
            Free to start. Private by design.
          </p>
          </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}

export { PremiumCTASection };

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════
   The page's closing chapter — Apple's line-up gallery ("Explore the
   line-up."): white line-up cards run in one sliding row on the #f5f5f7
   ground — 372px cards at a 24px pitch, the first card opening on the
   statement's spine with the rest peeking past the right edge as the scroll
   affordance, snap points for the swipe, and centred round chevrons beneath. */

/* Apple's line-up card, measured on the Watch "Explore the line-up." module:
   a white card on the #f5f5f7 ground with the photograph full-bleed on top
   and the text band beneath — 24px/600 name, 17px grey line, quiet blue
   "Learn more" link with a trailing chevron. */
const PremiumExploreCard = React.memo(function PremiumExploreCard({ category, image }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      aria-label={`Learn more about ${category.chip}`}
      className="stagger-child group block w-[82vw] max-w-[372px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-white transition-transform duration-300 ease-google hover:-translate-y-1 sm:w-[372px]"
    >
      <div className="media-settle relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={category.alt}
          loading="lazy"
          decoding="async"
          draggable="false"
          className="h-full w-full select-none object-cover transition-transform duration-500 ease-google group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-7 lg:p-8">
        <h3
          className="text-balance text-[24px] font-semibold leading-[1.12] tracking-[0.009em]"
          style={{ color: COLORS.ink, maxWidth: "18ch" }}
        >
          {category.chip}
        </h3>
        <p
          className="mt-2 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
          style={{ color: COLORS.grey, maxWidth: "38ch" }}
        >
          {category.copy}
        </p>
        <span
          className="public-text-link mt-4 inline-flex items-center transition-colors duration-200 group-hover:underline"
        >
          Learn more
          <ChevronIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
});

/* Props: heading (node), categories, images. Optional eyebrow + sub render
   the same left-spined chapter header the site's other chapters carry — the
   landing's router uses them; persona pages pass neither, so their line-up
   header stays exactly the measured "Explore the line-up." anatomy.
   headingRole/subRole let a page bind the header to a measured public type
   role (the landing's router opens at Education's card-chapter tier and reads
   its intro at the editorial-body tier); omitted, nothing changes. */
function PremiumExploreSection({ heading, categories, images, eyebrow, sub, headingRole, subRole }) {
  const { ref } = useRevealOnce();
  const { trackRef, canPrev, canNext, scrollByCard, update } = useScrollTrack();

  /* mouse drag-to-slide — the cursor affordance Apple's galleries assume
     from a trackpad: press and slide, the row follows, links swallow the
     click when a drag actually happened */
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const onTrackPointerDown = useCallback((e) => {
    if (e.pointerType !== "mouse") return;
    drag.current = { active: true, startX: e.clientX, startLeft: trackRef.current.scrollLeft, moved: false };
  }, [trackRef]);
  const onTrackPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    trackRef.current.scrollLeft = d.startLeft - dx;
  }, [trackRef]);
  const onTrackPointerEnd = useCallback(() => { drag.current.active = false; }, []);
  const onTrackClickCapture = useCallback((e) => {
    if (drag.current.moved && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  return (
    <section ref={ref} data-section="13-explore" className="relative isolate bg-[#f5f5f7] py-16 lg:py-24 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
            {eyebrow && (
              <p className="text-[17px] font-medium" style={{ color: COLORS.grey }}>
                {eyebrow}
              </p>
            )}
            <h2
              data-type={headingRole}
              className="text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]"
              style={{ color: COLORS.ink, maxWidth: "20ch", marginTop: eyebrow ? "var(--gap-eyebrow-title-display)" : undefined }}
            >
              {heading}
            </h2>
            {sub && (subRole ? (
              /* a bound role (Education's card-chapter intro) is not the
                 h2's semibold lead — the wrapper keeps it out of that role */
              <div className="mt-[var(--gap-title-sub-display)]">
                <p data-type={subRole} className="text-balance max-w-[60ch]" style={{ color: COLORS.grey }}>
                  {sub}
                </p>
              </div>
            ) : (
              <p
                className="text-balance mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]"
                style={{ color: COLORS.grey }}
              >
                {sub}
              </p>
            ))}
          </div>
        </RevealItem>
        <RevealItem idx={1} className="stagger-group">
          <div className="relative mt-12 lg:mt-16">
            <div
              ref={trackRef}
              onScroll={update}
              onPointerDown={onTrackPointerDown}
              onPointerMove={onTrackPointerMove}
              onPointerUp={onTrackPointerEnd}
              onPointerCancel={onTrackPointerEnd}
              onClickCapture={onTrackClickCapture}
              onDragStart={(e) => e.preventDefault()}
              className="flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pl-6 pr-6 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden lg:gap-6 lg:scroll-pl-[max(24px,calc((100vw-1265px)/2+80px))] lg:pl-[max(24px,calc((100vw-1265px)/2+80px))]"
            >
              {categories.map((c, index) => (
                <PremiumExploreCard key={c.slug} category={c} image={images[index]} />
              ))}
            </div>

            {/* the gallery controls — centred round chevrons under the row */}
            <div className="mt-9 flex items-center justify-center gap-5">
              <button
                type="button"
                aria-label="Previous destinations"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${COLORS.ink}33`, color: `${COLORS.ink}99` }}
              >
                <ChevronIcon direction="left" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next destinations"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${COLORS.ink}33`, color: `${COLORS.ink}99` }}
              >
                <ChevronIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}

export { PremiumExploreSection };
