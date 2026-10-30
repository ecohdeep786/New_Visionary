import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { fontStack } from "@/components/landing/system/tokens";

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
  const core = "#f5f5f7", blue = "#2997ff", hairline = "rgba(255,255,255,0.14)", track = "rgba(255,255,255,0.12)";
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
              : "opacity var(--motion-duration-statement) var(--ease-out-apple), transform var(--motion-duration-statement) var(--ease-out-apple)",
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
  const frostDim = "rgba(245,247,250,0.6)"; /* FAP-31: composited >=4.5:1 on the darkest panel (0.45 was 3.4:1) */
  return (
    <div key={`${index}-${step.title}`} className="hero-fade-up w-full">
      <p className="text-[14px] font-medium tracking-[0.08em] leading-[1.4]">
        <span style={{ color: active ? "#2997ff" : frostDim }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: frostDim }}>{String(total).padStart(2, "0")}</span>
      </p>
      <h3
        data-type="feature-heading"
        className="mt-4 whitespace-pre-line"
        style={{ color: "#f5f5f7", maxWidth: "35ch" }}
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
              data-type="section"
              className="text-balance font-semibold"
              style={{ maxWidth: "22ch", marginInline: "auto" }}
            >
              <span className="accent-gradient-on-dark">One intelligence.</span>
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
            <p data-type="body" className="text-frost text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch]">
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
            data-type="section"
            className="text-balance font-semibold"
            style={{ maxWidth: "22ch", marginInline: "auto" }}
          >
            <span className="accent-gradient-on-dark">One intelligence.</span>
          </h2>
        </RevealItem>
        <RevealItem idx={1}>
          <p data-type="body" className="text-frost text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch]">
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
                  transition: "opacity var(--motion-duration-statement) var(--ease-out-apple)",
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
                  className="relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-[18px] after:-inset-x-[18px] after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997ff] focus-visible:ring-offset-2"
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
export default PremiumIntelligenceSection;
