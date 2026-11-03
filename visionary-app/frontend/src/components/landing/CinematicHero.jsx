import React from "react";
import { fontStack } from "@/components/landing/system/tokens";

/**
 * CinematicHero — the student/persona stage carrying Apple-privacy's centered
 * voice (FAP-59 phase 4, founder directive 2026-11-02: "use the student hero
 * image, the font shows centered and the image shows behind the font").
 *
 * Measured composition (StudentPage → PersonaHero stage + apple.com/in/privacy
 * hero, 2026-11-02): one full-viewport studio stage — white set, the whole
 * photograph bottom-anchored rising from the fold (object-contain, feet on
 * the fold, nothing cropped), the copy centered on BOTH axes (the Apple
 * privacy position, founder directive 2026-11-03): with the photograph the
 * copy centers in the free region above it; without it, the copy centers in
 * the whole stage.
 *
 * Anatomy law (one source; pages compose props, never re-declare):
 *   - Stage: height calc(100svh - 56px - inFlow), min 640px, marginTop 56
 *     (LandingNav is fixed 56px). `inFlow` = the local-nav bar / breadcrumb
 *     the page keeps above the hero, so the photograph still lands on the
 *     fold (policy pages 112, research page keeps its breadcrumb).
 *   - Image layer: in flow below the copy at EVERY width (flex-1,
 *     bottom-anchored contain fit) — the photograph rises from the fold
 *     under the centered copy; the subject never collides with the type.
 *     D3 image law: <picture> offers the AVIF sizeset first when the page
 *     wires it, WebP raster fallback, eager + fetchPriority high (it is
 *     the stage), draggable off, maxWidth:none so the contain fit can
 *     window.
 *   - Copy column: centered on every width and both axes (the Apple
 *     privacy position): optional label, the two-part display
 *     (44 → 64 → 80, font-semibold, 1.05, -0.015em — Apple's measured
 *     overview-hero profile; part 2 in the accent gradient), the 17px/25px
 *     statement at the 760px cap, then the CTA pair / pill slots and the
 *     `trailing` slot (the accessibility anchor chips); pages compose,
 *     never re-style. The 44px base intentionally sits outside the
 *     h1.text-[48px] page-title bridge so the hero ladder renders.
 *   - The stage ends at the fold: body content follows as normal scroll.
 *
 * Founder image slots: pages wire the hero stage image via the `image`
 * prop. The shipped wiring reuses the student studio photograph (founder
 * directive) through the 07-perf heroVariants srcset/AVIF wires; when the
 * founder's own photography lands, each page swaps two imports and the one
 * prop value (protocol in docs/visionary/design/FAP59_APPLE_CINEMATIC_HERO_HANDOFF.md).
 * With image={null} the stage renders the intentional quiet placeholder
 * (brand-blue presence hint over the site's white surface, law hexes only).
 */
export default function CinematicHero({
  label,
  title,
  accent,
  statement,
  cta = null,
  quietCta = null,
  trailing = null,
  image = null,
  /* In-flow chrome above the stage inside main (LocalNav 56 / breadcrumb
     ~60). Keeps the photograph landing exactly on the fold. */
  inFlow = 0,
  className = "",
  id,
}) {
  return (
    <section
      id={id}
      data-section="01-hero"
      className={`relative isolate flex flex-col overflow-hidden bg-white ${className}`}
      style={{
        fontFamily: fontStack,
        height: `calc(100svh - ${56 + inFlow}px)`,
        minHeight: 640,
        marginTop: 56,
      }}
    >
      {/* The copy — centered on both axes in the free stage (the Apple
          privacy hero position, founder directive 2026-11-03: match the
          apple.com/in/privacy hero — measured 2026-11-02: 80px/600, -0.015em,
          1.05, dead-center of the first viewport). With the photograph the
          copy centers in the free region above it (flex 1:1 with the image
          layer); without it, the copy owns the whole stage. CTAs ride the
          shared primitives (CtaPair for the promo pair, CTA_LAW.pill for a
          solo ink action), passed as props; pages that pass a raw pill own
          its top margin, since the wrapper stays margin-free to keep the
          CtaPair cadence exact. The 44px base deliberately steps outside the
          h1.text-[48px] page-title bridge (public-bridge.css) so the hero
          renders its own Apple-measured ladder, per that file's own hero law
          ("hero 80px ls-0.015em lh1.05"). */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center px-6 pt-[clamp(16px,3svh,40px)] pb-[clamp(12px,2svh,24px)] text-center sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          {label ? (
            <p data-type="label" className="text-[#6e6e73]">
              {label}
            </p>
          ) : null}
          <h1 className="mx-auto mt-6 max-w-[960px] text-[44px] font-semibold leading-[1.05] tracking-[-0.015em] text-[#1d1d1f] sm:text-[64px] lg:text-[80px]">
            {title} <span className="accent-gradient">{accent}</span>
          </h1>
          {statement ? (
            <p className="mx-auto mt-8 max-w-[760px] text-[17px] leading-[25px] text-[#6e6e73]">
              {statement}
            </p>
          ) : null}
          {cta ? <div className="flex justify-center">{cta}</div> : null}
          {trailing}
          {quietCta ? <div className="mt-10 flex justify-center">{quietCta}</div> : null}
        </div>
      </div>

      {/* The image layer — the photograph rises from the fold BELOW the
          centered copy at every width (the student stage's collision-free
          anatomy; the subject stays clear of the centered type, feet on the
          fold). Shares the free stage 1:1 with the copy region. */}
      {image?.src ? (
        <div className="relative flex min-h-[220px] flex-1">
          <picture>
            {image.avifSrcSet ? (
              <source type="image/avif" srcSet={image.avifSrcSet} sizes={image.sizes} />
            ) : null}
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              alt={image.alt || ""}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable="false"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
              style={{
                objectPosition: image.position || "50% 100%",
                maxWidth: "none",
              }}
            />
          </picture>
        </div>
      ) : (
        /* The placeholder stage — an intentional quiet set behind the
           centered copy (the brand-blue presence hint anchored where the
           photograph's subject zone sits, over the site's white surface),
           not a broken slot. Replaced automatically once image.src exists. */
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(46% 74% at 50% 96%, rgba(66,133,244,0.08) 0%, rgba(66,133,244,0.03) 45%, rgba(66,133,244,0) 70%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)",
          }}
        />
      )}

      {/* the studio floor — desktop grounding veil from the persona stage
          (cast.css), desktop only */}
      {image?.src ? <div aria-hidden="true" className="persona-floor hidden lg:block" /> : null}
    </section>
  );
}
