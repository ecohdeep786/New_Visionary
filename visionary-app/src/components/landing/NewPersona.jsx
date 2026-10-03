import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_SRCSETS, HERO_SIZES } from "@/lib/heroVariants";

function useCycle(total, ms) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!ms || ms <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), ms);
    return () => clearInterval(id);
  }, [total, ms]);
  return index;
}

/* The shared CTA pair — one source for every hero, so the pills stay
   identical across the universal and persona pages. */
const HeroCtas = React.memo(function HeroCtas({ ctaTo, ctaLabel, secondaryTo, secondaryLabel }) {
  return (
    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
      <Link
        to={ctaTo}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121317] px-7 text-[16px] font-medium tracking-[0.24px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
      >
        {ctaLabel}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
      <Link
        to={secondaryTo}
        className="inline-flex h-12 items-center justify-center rounded-full border border-[#dadce0] bg-white px-7 text-[16px] font-normal tracking-[0.24px] text-[#121317] transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
});

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
     desktop  P 1.1082 → ml .1200 .3459 .1724 .2029   span 5.17·Hc
     tablet   P 0.9800 → ml −.0082 .2177 .0442 .0747  span 4.66·Hc
     phone    P 0.8800 → ml −.1082 .1177 −.0558 −.0253 span 4.26·Hc
   On tablets and phones the pitch closes below the seam sums, so shoulders
   overlap a few px — a group huddling closer, center figure in front. */
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
   centroid-pitch span. All five figures render on every device. The copy
   block is pulled down to the family (margin-top:auto; the desktop override
   sits it a breath above the heads, smaller screens center it in the space
   above the row). */
const CAST_CSS = `
@keyframes figIn{from{opacity:0;transform:translateY(5%) scale(0.988)}to{opacity:1;transform:none}}
@keyframes appleFadeIn{from{opacity:0}to{opacity:1}}
.cast-stage{--cast-h:min(40svh, clamp(64px, calc((100vw - clamp(32px, 8vw, 240px)) / 4.26), 330px))}
@media (min-width:640px){.cast-stage{--cast-h:min(40svh, clamp(120px, calc((100vw - clamp(64px, 10vw, 400px)) / 4.66), 340px))}}
@media (min-width:1024px){.cast-stage{--cast-h:min(40svh, clamp(170px, calc((100vw - clamp(96px, 12vw, 240px)) / 5.17), 460px))}}
.cast-copy{margin-top:auto;margin-bottom:auto}
@media (min-width:1024px){.cast-copy{margin-bottom:calc(var(--cast-h) + clamp(48px, 8svh, 96px))}}
.cast-slot-0{z-index:10}.cast-slot-2{z-index:30}.cast-slot-4{z-index:10}.cast-slot-1,.cast-slot-3{z-index:20}
@media (min-width:1024px){
.cast-slot-1{margin-left:calc(var(--cast-h)*0.1200)}
.cast-slot-2{margin-left:calc(var(--cast-h)*0.3459)}
.cast-slot-3{margin-left:calc(var(--cast-h)*0.1724)}
.cast-slot-4{margin-left:calc(var(--cast-h)*0.2029)}
}
@media (min-width:640px) and (max-width:1023.9px){
.cast-slot-1{margin-left:calc(var(--cast-h)*-0.0082)}
.cast-slot-2{margin-left:calc(var(--cast-h)*0.2177)}
.cast-slot-3{margin-left:calc(var(--cast-h)*0.0442)}
.cast-slot-4{margin-left:calc(var(--cast-h)*0.0747)}
}
@media (max-width:639.9px){
.cast-slot-1{margin-left:calc(var(--cast-h)*-0.1082)}
.cast-slot-2{margin-left:calc(var(--cast-h)*0.1177)}
.cast-slot-3{margin-left:calc(var(--cast-h)*-0.0558)}
.cast-slot-4{margin-left:calc(var(--cast-h)*-0.0253)}
}
@media (prefers-reduced-motion: reduce){
.apple-anim{animation-name:appleFadeIn !important;animation-duration:0.7s !important;animation-timing-function:ease-out !important;animation-iteration-count:1 !important}
}`;

export default function NewPersona({
  words,
  wordMs = 2800,
  srSentence,
  sub,
  img,
  alt,
  /* Matches the photo's own background (#ffffff, sampled from image edges) so
     the contained photo blends seamlessly into the hero — Apple-style. */
  heroBg = "#ffffff",
  ctaTo = "/register",
  ctaLabel = "Start learning free",
  secondaryTo = "/how-it-works",
  secondaryLabel = "See how it works",
  /* Panorama-cast mode: the five full-resolution hero photographs composed
     as one continuous full-bleed scene — the persona-hero bar applied to the
     whole family. Used by the main landing hero so every hero on the site
     follows one law: full-viewport photography, bottom-pinned words. */
  cast,
  /* The canonical display minimum is 48px; the universal lead fragment is
     longer than any persona lead ("One Intelligence."), so the landing drops
     the floor to keep 390px screens on one line. */
  minDisplay = 48,
}) {
  /* Cast mode speaks once — a static headline, no word cycle. */
  const index = useCycle(cast ? 1 : words.length, cast ? 0 : wordMs);
  /* Canonical Visionary display scale — Apple product-first rhythm */
  const displaySize = `clamp(${minDisplay}px, 5.55vw, 80px)`;
  const display = `block whitespace-nowrap font-medium tracking-[0] leading-[1.02]`;

  if (cast) {
    return (
      <section
        data-section="01-hero"
        className="cast-stage relative isolate flex flex-col overflow-hidden"
        style={{
          backgroundColor: heroBg,
          height: "calc(100svh - 56px)",
          minHeight: 620,
          marginTop: 56,
        }}
      >
        <style>{CAST_CSS}</style>

        {/* the words — static "One Intelligence." pulled down to the family:
            margin-top:auto sinks the stack toward the heads (a breath above
            them on desktop, centered above the row on smaller screens) */}
        <div className="cast-copy public-frame public-frame-wide relative z-10 mx-auto flex w-full flex-col items-center pt-[clamp(48px,11svh,120px)] text-center">
          <div className="max-w-[980px]">
            <h1 className="m-0">
              <span
                aria-hidden="true"
                className={display}
                style={{ color: "#121317", fontSize: displaySize }}
              >
                <span className="accent-gradient inline-block">{words[0]}</span>
              </span>
              <span className="sr-only">{srSentence}</span>
            </h1>
            <p
              className="mx-auto max-w-[620px] font-normal tracking-[0] leading-[1.6] text-[clamp(16px,1.2vw,18px)]"
              style={{ color: "#121317", marginTop: `calc(${displaySize} * 0.167)` }}
            >
              {sub}
            </p>
          </div>
          <HeroCtas ctaTo={ctaTo} ctaLabel={ctaLabel} secondaryTo={secondaryTo} secondaryLabel={secondaryLabel} />
        </div>

        {/* the family — five alpha cutouts on the page's own white, rising
            from the fold on every device. Slots carry the measured subject
            boxes; the per-tier seam margins in CAST_CSS space the optical
            centroids on one even pitch, closing into a gentle huddle on
            small screens with the center figure in front. */}
        <div className="absolute inset-x-0 bottom-0 z-0" aria-hidden="true">
          {/* the One Intelligence breath — a hint of brand blue rising
              behind the family, nothing more */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
            style={{ background: "radial-gradient(46% 88% at 50% 100%, rgba(66,133,244,0.08) 0%, rgba(66,133,244,0.03) 45%, rgba(66,133,244,0) 72%)" }}
          />
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
                    animation: "figIn 1.15s cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${260 + i * 70}ms`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  <img
                    src={p.src}
                    srcSet={p.srcSet}
                    sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 24vw"
                    alt=""
                    loading="eager"
                    fetchPriority="high"
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
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-section="01-hero"
      className="relative isolate flex flex-col overflow-hidden"
      style={{
        backgroundColor: heroBg,
        height: "calc(100svh - 56px)",
        minHeight: 620,
        marginTop: 56,
      }}
    >
      {/* the words — top center, the Vision Pro anatomy: the journey speaks
          first, the CTA pair follows, and the subject stands beneath on the
          white stage — the same system as the landing's family stage */}
      <div className="public-frame public-frame-wide relative z-10 mx-auto flex w-full flex-col items-center pt-[clamp(48px,11svh,120px)] text-center">
        <div className="max-w-[980px]">
          <h1 className="m-0">
            <span
              aria-hidden="true"
              className={display}
              style={{ color: "#121317", fontSize: displaySize }}
            >
              <span
                key={index}
                className="apple-anim accent-gradient inline-block"
                style={{
                  animation:
                    "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                {words[index]}
              </span>
            </span>
            <span className="sr-only">{srSentence}</span>
          </h1>
          <p
            className="mx-auto max-w-[620px] font-normal tracking-[0] leading-[1.6] text-[clamp(16px,1.2vw,18px)]"
            style={{ color: "#121317", marginTop: `calc(${displaySize} * 0.167)` }}
          >
            {sub}
          </p>
        </div>
        <HeroCtas ctaTo={ctaTo} ctaLabel={ctaLabel} secondaryTo={secondaryTo} secondaryLabel={secondaryLabel} />
      </div>

      {/* the subject — the persona photograph contained on the white stage,
          bottom-anchored at the fold the way the family stands on the
          landing; no scrims, the photo blends into the page */}
      <div className="relative mt-5 min-h-0 flex-1">
        <img
          src={img}
          srcSet={HERO_SRCSETS[img]}
          sizes={HERO_SIZES}
          alt={alt}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ objectPosition: "50% 100%" }}
        />
      </div>
    </section>
  );
}
