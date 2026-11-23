import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_SRCSETS, HERO_SIZES, HERO_AVIF_SOURCES } from "@/lib/heroVariants";
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

/* The shared CTA pair lives in system/ui.jsx (CtaPair) — one measured
   anatomy for the universal front door and every persona hero: 44px ink
   pill with the 21px pad, the 17px button voice, and the full-44px text
   link beside it (apple.com/apple-vision-pro hero pair, 2026-10-20). */

/* The family stage — the landing's "product shot". The five personas stand
   together as alpha cutouts on the page's own white: no tiles, no seams, no
   scrims — one studio photograph, on every device. The anatomy is the Apple
   homepage hero: the static headline at the top center, the family rising
   from the fold beneath. The figures are bottom-anchored, so the fold crops
   them the way an Apple keynote stage crops its subjects — nothing floats,
   nothing is boxed, everything stays inside the section. */

/* Sizing is measured, not eyeballed: every value below derives from the
   alpha bounding boxes of the cutout canvases (all 800×800) at a hard
   alpha>128 threshold, probed with scripts-tmp/cutout-probe.mjs. Subject
   boxes (x,y w×h) and alpha-weighted optical centroids (cx, fraction of
   canvas width):
     student      163,2   516×708  cx .5405    teacher 0,17    721×693  cx .5491
     parent       35,1    765×709  cx .5975    pro     179,59  578×651  cx .5834
     organization 83,43   623×667  cx .5570
   All five share a 90px faint shadow tail below the subject (alpha ≤128);
   the fold crops it by pushing each canvas 0.125·canvasH below the baseline.
   The imgs carry maxWidth:none — Tailwind preflight's img{max-width:100%}
   otherwise squishes the square canvases into the narrower slots and every
   figure renders narrow and tall. Values are fractions of the center
   (student) subject height Hc:
     canvasH — rendered canvas box height (subject height ÷ its canvas
               fraction, times its depth scale)
     slotH   — subject height (the depth scale: center 1, mid 0.94, outer 0.88)
     slotW   — subject width (subject aspect × slotH)
     offX    — canvas left edge relative to the slot, so each subject's box
               sits centered in its slot */

/* Spacing is optical, not box-uniform: ragged silhouettes (a teacher's
   extended arm, a student's swept hair) make equal bounding-box gaps read
   as uneven. What the eye tracks is the rhythm of the masses — so the five
   alpha-weighted centroids sit on one even pitch P, and each seam's margin
   is ml = P − (r_prev + l_next), the distances from each centroid to its
   subject-box edges. Per tier (fractions of Hc), with ml for slots 1-4:
     desktop  P 1.1082 → ml .1200 .3459 .1724 .2029   span 5.17·Hc, framed gutters
     tablet   P 0.8400 → ml −.1482 .0777 −.0958 −.0653 span 4.10·Hc, full-bleed
     phone    P 0.7150 → ml −.2732 −.0473 −.2208 −.1903 span 3.60·Hc, full-bleed
   On tablets and phones the pitch closes below the seam sums, so shoulders
   overlap — a group huddling closer, center figure in front — and the row
   runs edge-to-edge, the keynote-stage crop. */
const CAST_METRICS = {
  Professional: { canvasH: 1.0814, slotH: 0.88, slotW: 0.7814, offX: -0.2419 },
  Teacher: { canvasH: 1.0851, slotH: 0.94, slotW: 0.9776, offX: 0 },
  Student: { canvasH: 1.13, slotH: 1, slotW: 0.729, offX: -0.2301 },
  Parent: { canvasH: 1.0606, slotH: 0.94, slotW: 1.0143, offX: -0.0464 },
  Organization: { canvasH: 1.0554, slotH: 0.88, slotW: 0.8219, offX: -0.1095 },
};
const CAST_FALLBACK = { canvasH: 1, slotH: 1, slotW: 0.8, offX: 0 };

/* Stage height: the painted subject row never exceeds the frame at any
   width — the budget divides the gutter-trimmed viewport by each tier's
   centroid-pitch span. On phones and tablets the row runs edge-to-edge (the
   Apple mobile keynote crop — outer figures bleed off the screen edges) and
   the pitch closes so the family earns real presence; desktop keeps its
   framed gutters. The copy block — headline, sub, and the front-door CTA —
   centers in the free stage ABOVE the family, on every device: an in-flow
   spacer reserves the family's tallest visible zone (the student's painted
   head tops out at 0.875·1.13·H ≈ 0.99·H above the fold) plus a breathing
   gap, and the copy's auto margins balance the remaining space around it.
   Dead-centering in the whole hero instead read as a dead void at the top
   with the CTA sitting on the figures' heads on large/tall screens
   (1536×864, 1920×1080). A real box reserves the zone — container padding
   can lose a cascade fight (the bridge pads section[data-section] too). */
export default function NewPersona({
  words,
  wordMs = 2800,
  staticHeadline,
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
  /* Landing-only audience rail under the hero actions — one door per
     persona (label + route), in the cycling line's order. Absent on every
     persona page, so those heroes render exactly as before. */
  audienceLinks,
}) {
  const index = useCycle(words.length, wordMs);

  if (cast) {
    return (
      <section
        data-section="01-hero"
        /* Pinned stage — the landing-only cast hero sticks to the viewport
           and the story glides over it on frosted glass (the Vision Pro page
           anatomy; founder directive 2026-11-21: the hero stays fixed, the
           sections scroll). The stage height lives in cast.css so short
           windows can trade the pin for a readable story. Default persona
           heroes scroll away naturally. */
        className="cast-stage sticky top-0 z-0 isolate flex flex-col overflow-hidden"
        style={{
          backgroundColor: heroBg,
          marginTop: 56,
        }}
      >
        <div className="cast-copy public-frame relative z-10 mx-auto flex flex-col items-center text-center">
          <h1 data-type="display" className="m-0 font-semibold">
            <span className="block">{words[0]}</span>
            <span className="accent-gradient block">{staticHeadline}</span>
          </h1>
          <p className="cast-intro">{sub}</p>
          <CtaPair ctaTo={ctaTo} ctaLabel={ctaLabel} secondaryTo={secondaryTo} secondaryLabel={secondaryLabel} />
          <nav aria-label="Audiences" className="audience-rail mt-3 gap-x-1">
            {audienceLinks.map((audience) => (
              <Link key={audience.to} to={audience.to}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-[#1d1d1f]/75 hover:text-[#0066cc] hover:underline focus-visible:ring-2 focus-visible:ring-[#0066cc]">
                {audience.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* the family's floor reserve, in flow — the copy's auto margins
            balance the free stage above it, so the title card centers
            between the nav and the figures and never lands on their heads
            (the student's painted head tops out at ≈0.99·H above the fold;
            the clamp is the guaranteed breath on the shortest stages). */}
        <div aria-hidden="true" className="shrink-0" style={{ height: "calc(var(--cast-h) * 0.99 + clamp(20px, 3svh, 48px))" }} />

        {/* the family — five alpha cutouts on the page's own white, rising
            from the fold on every device. Slots carry the measured subject
            boxes; the per-tier seam margins in CAST_CSS space the optical
            centroids on one even pitch, closing into a gentle huddle on
            small screens with the center figure in front. */}
        <div className="absolute inset-x-0 bottom-0 z-0" aria-hidden="true">
          {/* the family stands on the page's own clean white — no color wash
              behind it (Apple's light stages are pure white; measured
              2026-11-21 on /education + /iphone) */}
          <div className="relative flex items-end justify-center">
            {cast.map((p, i) => {
              const m = CAST_METRICS[p.label] || CAST_FALLBACK;
              return (
                <div
                  key={p.label}
                  className={`cast-slot-${i} apple-anim relative flex-none`}
                  style={{
                    width: `calc(var(--cast-h) * ${m.slotW})`,
                    height: `calc(var(--cast-h) * ${m.slotH})`,
                    animation: "figIn var(--motion-duration-cinematic) var(--ease-out-apple) both",
                    animationDelay: `${260 + i * 70}ms`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  {/* D3 image law: cast cutout prefers the AVIF sibling at the
                      same pixel grid; the WebP sizeset stays the fallback. */}
                  <picture>
                    <source type="image/avif" srcSet={p.avifSrcSet || p.srcSet} sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 24vw" />
                    <img
                      src={p.src}
                      srcSet={p.srcSet}
                      sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 24vw"
                      alt=""
                      loading="eager"
                      {...{ fetchpriority: "high" }}
                      decoding="async"
                      draggable="false"
                      className="absolute select-none"
                      style={{
                        left: `calc(var(--cast-h) * ${m.offX})`,
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
      </section>
    );
  }

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
