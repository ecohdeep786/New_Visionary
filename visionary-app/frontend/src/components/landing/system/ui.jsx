import React from "react";
import { Link } from "react-router-dom";
import { color, type, BUTTONS } from "./tokens";

/**
 * Shared UI primitives for the public landing pages. Every page composes these
 * instead of re-declaring its own — identical anatomy everywhere, exactly the
 * way Google reuses its card and heading components.
 */

/** Consistent vertical rhythm + content container for a page section. */
export function SectionShell({
  id,
  wide = false,
  className = "",
  containerClassName = "",
  children,
  style,
}) {
  return (
    <section
      data-section={id}
      className={`public-section public-section-white relative ${className}`}
      style={style}
    >
      <div
        className={`mx-auto w-full px-6 sm:px-8 lg:px-10 ${
          wide ? "max-w-[1400px]" : "max-w-[1240px]"
        } ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

/** Quiet section opener, styled centrally with the caption role. */
export function Eyebrow({ children, center = false, className = "" }) {
  return (
    <p
      className={`public-eyebrow ${
        center ? "text-center" : ""
      } ${className}`}
      style={{ color: color.slate }}
    >
      {children}
    </p>
  );
}

/** Section heading. `display` selects the editorial chapter role. */
export function SectionHeading({
  children,
  display = false,
  center = false,
  className = "",
  as: Tag = "h2",
}) {
  return (
    <Tag
      className={`${display ? "public-display" : "public-section-heading"} ${center ? "text-center" : ""} ${className}`}
      style={{ color: color.ink, fontSize: display ? type.display : type.sectionHeading }}
    >
      {children}
    </Tag>
  );
}

/** One-line supporting sentence, Google grey, capped for readability. */
export function SectionSub({ children, center = true, className = "" }) {
  return (
    <p
      className={`public-lead mx-auto mt-6 max-w-[760px] ${
        center ? "text-center" : ""
      } ${className}`}
      style={{ color: color.slate }}
    >
      {children}
    </p>
  );
}

/** Borderless elevated surface — the g-card anatomy from index.css. */
export function GCard({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`g-card rounded-[var(--radius-card,12px)] bg-white ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * The CTA law as a component. `variant` selects the measured tone:
 * "dark" (neutral ink — the site's default), "alpha" (quiet secondary,
 * hover 0.13), "outline" (hairline card pair), "commerce" (billing surfaces
 * only). `as` supports Link (default), button and a; `<ArrowIcon/>` is the
 * measured 16px-arrow glyph. Focus ring and reduce-motion behaviour ride
 * BUTTONS.geo.
 */
const ARROW_ICON = (
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
);

const TONE_MAP = {
  dark: BUTTONS.neutral,
  alpha: BUTTONS.alpha,
  outline: BUTTONS.outline,
  commerce: BUTTONS.commerce,
};

export function PillButton({
  as: Tag = Link,
  to,
  children,
  variant = "dark",
  withIcon = false,
  className = "",
  ...rest
}) {
  const tone = TONE_MAP[variant] || TONE_MAP.dark;
  return (
    <Tag
      to={Tag === Link ? to : undefined}
      className={`${BUTTONS.geo} ${tone} ${className}`}
      {...rest}
    >
      {children}
      {withIcon && ARROW_ICON}
    </Tag>
  );
}

/**
 * The measured hero CTA pair — one ink pill + one 17px text link (400), the
 * anatomy the front door and every persona hero share (Apple Vision Pro
 * product-page pair). `align="baseline"` right-aligns on the wordmark's
 * baseline; the default centers under the copy. Lifted verbatim from
 * NewPersona's HeroCtas at A5 activation so every hero renders from one
 * primitive instead of five copies.
 */
export function CtaPair({
  ctaTo,
  ctaLabel,
  secondaryTo,
  secondaryLabel,
  align = "center",
}) {
  const alignment =
    align === "baseline"
      ? "flex flex-wrap items-center justify-center gap-3 lg:justify-end"
      : "mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-5";
  return (
    <div className={alignment}>
      <Link
        to={ctaTo}
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1f] px-[21px] text-[17px] font-medium tracking-[-0.011em] text-white transition-all duration-200 hover:bg-[#272729] hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
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
      {secondaryLabel && (
        <Link
          to={secondaryTo}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 text-[17px] font-normal tracking-[-0.011em] leading-[1.2] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
        >
          {secondaryLabel}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  );
}

/** Inline text link, lawed by the css family (color, size, underline hover).
 *  No inline color: the stylesheet owns the ink so dark scenes can retune it. */
export function TextLink({ to, children, className = "", onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`public-text-link inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${className}`}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="public-icon public-icon-chevron"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

/** 12px media frame for photography — the single media treatment. */
export function MediaFrame({ src, alt, className = "", eager = false, rounded = true }) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`w-full object-cover ${rounded ? "rounded-[var(--radius-media,12px)]" : ""} ${className}`}
    />
  );
}

/** Chip on the canonical accent wash for the active state; 14px floor. */
export function Chip({ children, active = false, onSelect, className = "" }) {
  const style = active
    ? { backgroundColor: color.wash, color: color.link, fontWeight: 500 }
    : { backgroundColor: color.white, color: color.slate, border: `1px solid ${color.mist}` };
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`inline-flex items-center justify-center gap-1 rounded-full px-4 py-1.5 text-[14px] leading-[20px] transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/** Grey-track pill tab bar; scrolls horizontally on narrow screens. */
export function TabBar({ tabs, active, onSelect, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mx-auto flex max-w-[900px] items-stretch gap-1 overflow-x-auto rounded-full p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ backgroundColor: color.track }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === i}
          onClick={() => onSelect(i)}
          className={`h-[44px] shrink-0 whitespace-nowrap rounded-full px-6 text-[14px] tracking-[0.24px] transition-all duration-200 ${
            active === i
              ? "bg-white font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(29,29,31,0.16),0_2px_8px_rgba(29,29,31,0.12)]"
              : "font-normal text-[#6e6e73] hover:text-[#1d1d1f]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** Carousel progress dots; the active dot stretches into a pill.
 *  `pill` tone renders the AirPods-style uniform dots inside the light pill
 *  with a taller active bar (the landing's story pager anatomy). */
export function ProgressDots({ total, active, onSelect, label = "Carousel slides", pill = false }) {
  return (
    <div className={`flex items-center ${pill ? "gap-4" : "gap-2"}`} role="group" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          aria-pressed={i === active}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-[18px] after:-inset-x-[18px] after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
            i === active ? (pill ? "w-12" : "w-10") : "w-2 hover:opacity-70"
          }`}
          style={{
            backgroundColor:
              pill ? "rgba(29,29,31,0.6)" : i === active ? color.ink : `${color.ink}33`,
          }}
        />
      ))}
    </div>
  );
}

/** Circular arrow control for carousels; disabled state dims it. */
export function ArrowButton({
  direction = "right",
  onClick,
  disabled = false,
  label,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`public-icon-control flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#1d1d1f]/5 ${
        disabled ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
      style={{ borderColor: color.mist, color: color.ink }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`public-icon public-icon-chevron ${direction === "left" ? "rotate-180" : ""}`}
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

/**
 * Standing-figure card for the cutout portraits: soft grey stage, figure
 * anchored to the card floor, mist fade blending into the stage.
 */
export function FigureCard({ src, alt, className = "", eager = false }) {
  return (
    <div className={`overflow-hidden rounded-[var(--radius-card)] bg-[#f5f5f7] ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable="false"
        className="mx-auto aspect-[4/5] w-full select-none object-contain object-bottom"
      />
    </div>
  );
}

/** Circular arrow icon used by legacy carousels (kept for API parity). */
export function ChevronIcon({ direction = "right", className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`public-icon public-icon-chevron ${className} ${direction === "left" ? "rotate-180" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Reveal wrapper: rise + fade when `visible` flips true — on Apple's law
 *  resolve curve (--ease-out-apple), not the earlier google curve. It is the
 *  memoized anatomy the landing's section choreography wraps every chapter in. */
export const Reveal = React.memo(function Reveal({ visible, children, className = "" }) {
  return (
    <div
      className={`transition-all duration-700 ease-apple ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
});
