import React from "react";
import { fontStack } from "@/components/landing/system/tokens";

/**
 * CinematicHero — the Apple-privacy hero anatomy, single-sourced (FAP-59
 * phase 3, founder directive 2026-11-01: "convert the hero section to match
 * Apple's privacy hero section and our student hero section design, and use
 * the hero section image on these pages"). Measured from apple.com/in/privacy
 * (2026-11-01/02: centered two-part declarative headline → cinematic media
 * band → statement, generous cadence) and projected onto this product's law:
 * structure converges on the Apple grammar; tones stay ours (light surface,
 * Google Sans, ink + accent-gradient), the same anatomy the student and
 * category persona pages already carry.
 *
 * Anatomy law (one source; pages compose props, never re-declare):
 *   - Section rhythm: paddingTop clamp(4.5rem,7vw,7rem), band gap
 *     clamp(2.5rem,4.5vw,4rem) — the AboutUsHero reference cadence.
 *   - Headline: the page-content display ladder (48 → 64 → 76, font-normal,
 *     1.06, -0.045em), first part in ink, second part in the accent
 *     gradient — the "Privacy. That's Apple." two-part grammar.
 *   - Statement: the 17px/25px sub-copy tier at the 760px cap, centered.
 *   - CTAs ride the shared primitives (CtaPair for the promo pair, QuietLink
 *     for a single gateway action, CTA_LAW.pill for a solo ink action),
 *     passed in as props — never re-styled here. Pages that pass a raw pill
 *     (no CtaPair) own its top margin, since the wrapper itself stays
 *     margin-free to keep the CtaPair cadence exact.
 *   - `trailing` (optional) renders one extra centered node inside the hero
 *     column after the CTA — the accessibility page's on-page anchor chips
 *     use this slot; it stays part of the hero, never a second section.
 *   - The band is full-bleed (spans the viewport, overflow-hidden section),
 *     height clamp(280px, 42vw, 620px); the image renders object-cover,
 *     lazy, with the AVIF source offered first when present.
 *
 * Founder image slots: the band ships as an intentional premium placeholder
 * stage until the founder's assets land. When they do, each page adds two
 * imports and one prop (exact protocol in
 * docs/visionary/design/FAP59_APPLE_CINEMATIC_HERO_HANDOFF.md):
 *
 *   import heroPrivacyWebp from "@/assets/brand/hero-privacy.webp";
 *   import heroPrivacyAvif from "@/assets/brand/hero-privacy.avif";
 *   <CinematicHero … image={{ src: heroPrivacyWebp, avif: heroPrivacyAvif, alt: "…" }} />
 *
 * The placeholder keeps the page composed in audits and on devices before
 * the photography arrives — no broken slots, no dead space.
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
  className = "",
  id,
}) {
  return (
    <section
      id={id}
      data-section="01-hero"
      className={`relative overflow-hidden bg-white ${className}`}
      style={{
        fontFamily: fontStack,
        paddingTop: "clamp(4.5rem, 7vw, 7rem)",
      }}
    >
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1120px] text-center">
          {label ? (
            <p data-type="label" className="text-[#6e6e73]">
              {label}
            </p>
          ) : null}
          <h1 className="mx-auto mt-6 max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] text-[#1d1d1f] sm:text-[64px] lg:text-[76px]">
            {title} <span className="accent-gradient">{accent}</span>
          </h1>
          {statement ? (
            <p className="mx-auto mt-8 max-w-[760px] text-[17px] leading-[25px] text-[#6e6e73]">
              {statement}
            </p>
          ) : null}
          {cta ? (
            <div className="flex justify-center">
              {cta}
            </div>
          ) : null}
          {trailing}
          {quietCta ? (
            <div className="mt-10 flex justify-center">
              {quietCta}
            </div>
          ) : null}
        </div>
      </div>

      {/* The cinematic band — full-bleed edge-to-edge, the Apple media-strip
          position. D3 image law: AVIF source first, WebP raster as the
          fallback; object-cover; lazy below the fold; draggable off. */}
      <div
        className="relative mt-[clamp(2.5rem, 4.5vw, 4rem)] w-full"
        style={{ height: "clamp(280px, 42vw, 620px)" }}
      >
        {image?.src ? (
          <picture>
            {image.avif ? (
              <source type="image/avif" srcSet={image.avif} />
            ) : null}
            <img
              src={image.src}
              alt={image.alt || ""}
              loading="lazy"
              fetchPriority="high"
              decoding="async"
              draggable="false"
              className="absolute inset-0 h-full w-full select-none object-cover"
              style={{ objectPosition: image.position || "50% 50%" }}
            />
          </picture>
        ) : (
          /* The placeholder stage — an intentional quiet band (the page's
             brand-blue presence hint from the persona stage at 8% alpha,
             over the site's white→f5f5f7 surface), not a broken slot.
             Replaced automatically once image.src exists. */
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 88% at 50% 100%, rgba(66,133,244,0.08) 0%, rgba(66,133,244,0.03) 45%, rgba(66,133,244,0) 72%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)",
            }}
          />
        )}
      </div>
    </section>
  );
}
