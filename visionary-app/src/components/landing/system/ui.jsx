import React from "react";
import { Link } from "react-router-dom";
import { color, type } from "./tokens";

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

/** 12px uppercase section opener — the same on every page. */
export function Eyebrow({ children, center = false, className = "" }) {
  return (
    <p
      className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${
        center ? "text-center" : ""
      } ${className}`}
      style={{ color: color.slate }}
    >
      {children}
    </p>
  );
}

/** Section heading. `display` switches to the 36-72px statement scale. */
export function SectionHeading({
  children,
  display = false,
  center = false,
  className = "",
  as: Tag = "h2",
}) {
  return (
    <Tag
      className={`font-medium tracking-[0] ${
        display ? "leading-[1.03]" : "leading-[1.08]"
      } ${center ? "text-center" : ""} ${className}`}
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
      className={`mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[1.55] text-[17.5px] ${
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

/** Primary/secondary pill button rendered as a router Link. */
export function PillButton({
  to,
  children,
  variant = "dark",
  withIcon = false,
  className = "",
}) {
  const base =
    "public-action inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[16px] font-medium tracking-[0.24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2";
  const styles = {
    dark: "bg-[#121317] text-white hover:bg-black",
    blue: "bg-[#0b57d0] text-white hover:bg-[#1765cc]",
    outline:
      "border border-[#dadce0] bg-white text-[#121317] hover:bg-[#F8F9FA]",
  };
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`}>
      {children}
      {withIcon && (
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
      )}
    </Link>
  );
}

/** Inline text link with trailing chevron — Google's "Learn more" pattern. */
export function TextLink({ to, children, className = "", onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[15px] font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${className}`}
      style={{ color: color.blue }}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
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
      className={`w-full object-cover ${rounded ? "rounded-[var(--radius-media,8px)]" : ""} ${className}`}
    />
  );
}

/** Chip using the canonical surface tint for the active state. */
export function Chip({ children, active = false, onSelect, className = "" }) {
  const style = active
    ? { backgroundColor: color.surfaceBlue, color: color.deepBlue, fontWeight: 500 }
    : { backgroundColor: color.white, color: color.slate, border: `1px solid ${color.mist}` };
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`rounded-full px-4 py-1.5 text-[13px] leading-[20px] transition-colors hover:bg-[#f8f9fa] ${className}`}
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
              ? "bg-white font-medium text-[#121317] shadow-[0_1px_2px_rgba(60,64,67,0.16),0_2px_8px_rgba(60,64,67,0.12)]"
              : "font-normal text-[#5f6368] hover:text-[#121317]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** Carousel progress dots; the active dot stretches into a pill. */
export function ProgressDots({ total, active, onSelect, label = "Carousel slides" }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-label={`Go to slide ${i + 1}`}
          aria-selected={i === active}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] ${
            i === active ? "w-10" : "w-2 hover:opacity-70"
          }`}
          style={{
            backgroundColor:
              i === active ? color.ink : `${color.ink}33`,
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
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#121317]/5 ${
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
        className={`h-5 w-5 ${direction === "left" ? "rotate-180" : ""}`}
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
    <div className={`overflow-hidden rounded-[28px] bg-[#f8f9fa] ${className}`}>
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
      className={`${className} ${direction === "left" ? "rotate-180" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Reveal wrapper: rise + fade when `visible` flips true. */
export function Reveal({ visible, children, className = "" }) {
  return (
    <div
      className={`transition-all duration-700 ease-google ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export const SECTION_RHYTHM_DESKTOP = "py-24 lg:py-32";
