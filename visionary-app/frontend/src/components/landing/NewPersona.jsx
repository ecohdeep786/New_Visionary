import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Pause, Play } from "lucide-react";
import { useCycleIndex, usePrefersReducedMotion } from "./system/hooks";
import { HERO_SRCSETS, HERO_SIZES, HERO_AVIF_SOURCES } from "@/lib/heroVariants";
import { UNIVERSAL_HERO_SIZES } from "@/lib/universalHero";
import { CtaPair } from "@/components/landing/system/ui";
import "@/components/landing/cast.css";

/* prefers-reduced-motion: reduce — read once per mount (F-31: the persona
   word cycle is motion and must not auto-advance when the visitor asked
   for reduced motion; the same law useCycleStep already follows). */
function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function useCycle(total, ms) {
  const [index, setIndex] = useState(0);
  const [reduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (!ms || ms <= 0 || total <= 1 || reduced) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), ms);
    return () => clearInterval(id);
  }, [total, ms, reduced]);
  return index;
}

/* The original square cutouts have different transparent margins. These
   optical bounds align their feet and keep the central student in front.
   All dimensions are fractions of the student's visible height. */
const CAST_METRICS = {
  Professional: { canvasH: 1.0814, slotH: 0.88, slotW: 0.7814, offX: -0.2419 },
  Teacher: { canvasH: 1.0851, slotH: 0.94, slotW: 0.9776, offX: 0 },
  Student: { canvasH: 1.13, slotH: 1, slotW: 0.729, offX: -0.2301 },
  Parent: { canvasH: 1.0606, slotH: 0.94, slotW: 1.0143, offX: -0.0464 },
  Organization: { canvasH: 1.0554, slotH: 0.88, slotW: 0.8219, offX: -0.1095 },
};
const CAST_FALLBACK = { canvasH: 1, slotH: 1, slotW: 0.8, offX: 0 };

function AudienceHero({ cast, audiences, ctaTo, ctaLabel }) {
  const reduced = usePrefersReducedMotion();
  const [playback, setPlayback] = useState(null);
  const paused = playback === null ? reduced : !playback;
  useEffect(() => { setPlayback(null); }, [reduced]);
  const [hovered, setHovered] = useState(false);
  const { index, goTo } = useCycleIndex(audiences.length, paused || hovered ? 0 : 6500);
  const audience = audiences[index];

  return (
    <section data-section="01-hero" className="home-hero"
      onFocusCapture={(event) => {
        if (!event.target.closest("[data-playback]")) setPlayback(false);
      }}>
      <div className="home-hero-copy">
        <h1 data-type="display">
          <span>From a question</span>
          <span className="role-headlines">
            {audiences.map((role, i) => (
              <span key={role.slug} className={i === index ? "is-current" : undefined}
                aria-hidden={i !== index}>{role.headline}</span>
            ))}
          </span>
        </h1>
        <p>A workspace for students, teachers, parents, professionals and organizations to learn, teach and build.</p>
        <Link className="home-action" to={ctaTo}>{ctaLabel}</Link>
      </div>
      <div className="family-stage" aria-hidden="true">
        <div className="relative flex items-end justify-center">
          {cast.map((p, i) => {
            const m = CAST_METRICS[p.label] || CAST_FALLBACK;
            return (
              <div
                key={p.label}
                data-current={p.label === audience.castLabel}
                className={`cast-slot-${i} cast-person relative flex-none`}
                style={{
                  width: `calc(var(--cast-h) * ${m.slotW})`,
                  height: `calc(var(--cast-h) * ${m.slotH})`,
                }}
              >
                {/* D3 image law: cast cutout prefers the AVIF sibling at the
                    same pixel grid; the WebP sizeset stays the fallback. */}
                <picture>
                  <source type="image/avif" srcSet={p.avifSrcSet || p.srcSet} sizes={UNIVERSAL_HERO_SIZES} />
                  <img
                    src={p.src}
                    srcSet={p.srcSet}
                    sizes={UNIVERSAL_HERO_SIZES}
                    alt=""
                    loading="eager"
                    {...{ fetchpriority: "high" }}
                    decoding="async"
                    draggable="false"
                    className="absolute select-none"
                    style={{
                      left: `calc(var(--cast-h) * ${m.offX})`,
                      // Crop the transparent tail below the subject at the common baseline.
                      bottom: `calc(var(--cast-h) * ${-0.125 * m.canvasH})`,
                      width: `calc(var(--cast-h) * ${m.canvasH})`,
                      height: `calc(var(--cast-h) * ${m.canvasH})`,
                      maxWidth: "none",
                    }}
                  />
                </picture>
              </div>
            );
          })}
        </div>
      </div>
      <div className="cast-caption" role="group" aria-label="Audience stories"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <span className="cast-active" aria-live={paused ? "polite" : "off"}>For {audience.label.toLowerCase()}</span>
        <button type="button" aria-label="Next audience"
          onClick={() => { setPlayback(false); goTo(index + 1); }}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button type="button" data-playback className="cast-playback"
          aria-label={paused ? "Play audience rotation" : "Pause audience rotation"}
          onClick={() => setPlayback(paused)}>
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}

export default function NewPersona({
  words,
  wordMs = 2800,
  srSentence,
  sub,
  img,
  alt,
  /* Matches the photo's own background (#ffffff, sampled from image edges) so
     the stage blends seamlessly into the page — Apple-style. */
  heroBg = "#ffffff",
  ctaTo = "/register",
  ctaLabel = "Start learning free",
  secondaryTo = "/how-it-works",
  secondaryLabel = "See how it works",
  /* Panorama-cast mode: the five alpha cutouts composed as one continuous
     family stage on the landing page. */
  cast,
  audiences,
}) {
  const index = useCycle(words?.length ?? 0, wordMs);

  if (cast) return <AudienceHero cast={cast} audiences={audiences} ctaTo={ctaTo} ctaLabel={ctaLabel} />;

  /* The persona product-page stage — the Vision Pro anatomy with the site's
     signature heading. The studio photograph fits the stage centered,
     bottom-anchored at the fold (the family-stage law), and the cycling
     accent-gradient headline — the landing heading's color and fade-up
     animation — pins to the bottom left, the CTA pair on the baseline
     right. No scrims, no frames. */
  return (
    <section
      data-section="01-hero"
      className="relative isolate flex flex-col overflow-hidden"
      style={{
        backgroundColor: heroBg,
        height: "calc(100svh - 56px)",
        minHeight: 640,
        marginTop: 56,
      }}
    >
      {/* the subject — the whole photograph, always. Phones and tablets:
              the full image in flow at the section's bottom, feet on the
              fold, nothing cropped. Desktop: the same contain fit as a
              full-bleed stage behind the bottom-left words.
              D3 image law: the <picture> offers the AVIF sizeset first
              (42% smaller wire at identical pixels); AVIF-capable browsers
              take it, the WebP sizeset below stays the fallback so the
              07-perf srcSet/density law keeps working everywhere. */}
      <div className="relative order-last min-h-0 flex-1 lg:absolute lg:inset-0 lg:z-0">
        <picture>
          <source
            type="image/avif"
            srcSet={HERO_AVIF_SOURCES[img].srcSet}
            sizes={HERO_SIZES}
          />
          <img
            src={img}
            srcSet={HERO_SRCSETS[img]}
            sizes={HERO_SIZES}
            alt={alt}
            loading="eager"
            {...{ fetchpriority: "high" }}
            decoding="async"
            draggable="false"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{ objectPosition: "50% 100%" }}
          />
        </picture>
      </div>

      {/* the studio floor — desktop only; with the whole image in flow below
          the copy on phones and tablets, nothing overlaps there */}
      <div aria-hidden="true" className="persona-floor hidden lg:block" />

      {/* the words — the persona grammar: one fragment at a time. "Learning,"
              alone, then "to master.", then "to build." — each in the landing
              gradient, fading up on every change. Content sits above the
              stage on phones and tablets; pinned bottom left on the desktop
              stage with the CTA pair on the baseline right. */}
      <div className="relative z-10 order-first flex w-full flex-col items-center gap-8 px-6 pt-[clamp(12px,2.5svh,40px)] pb-[clamp(28px,5svh,64px)] text-center lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-auto lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:px-[max(1.5rem,var(--frame-x))] lg:pb-[clamp(40px,7svh,88px)] lg:pt-0 lg:text-left">
        <div className="max-w-[860px]">
            {/* FAP-34: category heroes wear the Vision Pro type — the
                foundation statement 28/40/48 and the tagline 17/24/28, both
                600; steps live in rhythm.css. The landing's cast hero keeps
                the education ladder (var(--fs-hero-headline)). */}
            <h1 data-type="product-section" className="category-hero-statement m-0">
              <span
                key={index}
                className="apple-anim accent-gradient inline-block"
                style={{ animation: "heroFadeUp var(--motion-duration-slow) var(--ease-out-apple) both" }}
              >
                {words[index]}
              </span>
              <span className="sr-only">{srSentence}</span>
            </h1>
            <p className="category-hero-tagline text-balance mt-4 max-w-[560px] lg:mx-0" style={{ color: "#1d1d1f" }}>
              {sub}
            </p>
          </div>
          <CtaPair align="baseline" ctaTo={ctaTo} ctaLabel={ctaLabel} secondaryTo={secondaryTo} secondaryLabel={secondaryLabel} />
      </div>
    </section>
  );
}
