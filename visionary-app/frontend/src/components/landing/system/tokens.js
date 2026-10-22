/**
 * Visionary landing design tokens — the single source of truth shared by every
 * public page. Measured against live apple.com on 2026-10-21 (see
 * docs/visionary/design/APPLE_MEASURED_REFERENCE_2026-10-21.md): one neutral
 * ink family, ONE accent (link blue + the commerce cobalt reserved for
 * billing), hairlines instead of borders, and Apple-grade restraint.
 *
 * Legacy key names are preserved so existing imports keep working; values now
 * resolve to the measured system. The A5 activation retired the deprecated
 * channel keys (deepBlue/chipBg/surfaceBlue): their consumers now read the
 * law names (`link` / `wash`).
 */

export const fontStack = 'var(--font-public)';

export const color = {
  /* ── the ink family (Apple-measured) ── */
  ink: "#1d1d1f",          // headings + primary text + neutral button fill (was #121317)
  slate: "#6e6e73",        // secondary text (was Google #5f6368)
  muted: "#86868b",        // quiet fine print / captions on light ground
  line: "#d2d2d7",         // hairlines (was Google mist #dadce0)

  /* ── grounds ── */
  white: "#ffffff",
  ground: "#f5f5f7",       // grey bands, cards, story gallery, footer
  surface: "#ffffff",
  cardSurface: "#ffffff",
  cardSurfaceAlt: "#f5f5f7",

  /* ── the accent system (Apple-measured) ── */
  link: "#0066cc",         // inline + tertiary text actions (replaces #4285F4 in links)
  commerce: "#0071e3",     // billing / plan surfaces only; hover #0077ed, active #006edb
  commerceHover: "#0077ed",
  commerceActive: "#006edb",

  /* the accent chip wash — active-state fill for chips/rails (was #e8f0fe) */
  wash: "rgba(0,102,204,0.10)",

  /* ── measured button tones (see BUTTONS) ── */
  neutralHover: "#272729", // .button-neutral:hover
  neutralActive: "#18181a",
  secondary: "#757579",    // .button-secondary
  alpha: "rgba(0,0,0,0.08)", // .button-secondary-alpha

  /* ── named surfaces (law-valued; names consumed across the landing) ── */
  graphite: "#6e6e73",     // secondary ink (same family as slate)
  lightGrey: "#86868b",    // muted ink
  mist: "#d2d2d7",         // hairline
  track: "#f5f5f7",        // grey track/ground
  trackStrong: "rgba(29,29,31,0.15)",
  surfaceAlt: "#f5f5f7",
};

/** Corner-radius law. Media and cards share 12px; overlays 16; interactive is a 980px pill. */
export const radius = {
  media: "12px",
  card: "12px",
  overlay: "16px",
  pill: "9999px",
};

/**
 * CTA anatomy law — measured from apple.com's shipped button rules.
 * Geometry: pill radius 980 on the page; 44px min-height (44px on mobile too);
 * padding 11px 21px; text 17px / 1.176 / -0.011em (A2 verified in-browser).
 * Weight: Apple renders 400 under SF; we use 500 on fills — the one sanctioned
 * divergence, because Google Sans Flex reads lighter at 400 than SF Pro Text.
 * Tones: neutral (the site's default), alpha (quiet secondary, hover 0.13 —
 * A2's in-browser receipt), outline (hairline card pair), commerce (billing
 * surfaces only), tertiary (text links), disabled at 0.32 opacity.
 */
export const BUTTONS = {
  geo: "min-h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-[21px] text-[17px] leading-[1.176] tracking-[-0.011em] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 motion-reduce:transition-none",
  neutral: "bg-[#1d1d1f] text-white hover:bg-[#272729] active:bg-[#18181a]",
  alpha: "bg-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:bg-[rgba(0,0,0,0.13)]",
  commerce: "bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#006edb]",
  outline: "border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]",
  tertiary: "text-[#0066cc] hover:underline",
};

/** Content roles resolve from src/styles/rhythm.css at the active breakpoint.
 * The established hero remains independent of the content scale. */
export const type = {
  hero: "clamp(48px, 5.55vw, 80px)",
  sectionHeading: "var(--fs-h2)",
  display: "var(--fs-display)",
  body: "var(--fs-body)",
  lead: "var(--fs-lead)",
  cardBody: "var(--fs-body)",
};

/** Content container law — mirrors rhythm.css :root. Three widths, nothing else.
 * Shells wider than 1240px must carry --frame-x side gutters
 * (px-6 lg:px-[var(--frame-x)]), never custom px padding. */
export const container = {
  standard: "max-w-[1240px] px-6 lg:px-[var(--frame-x)]",
  wide: "max-w-[1400px] px-6 lg:px-[var(--frame-x)]",
  hero: "max-w-[1756px] px-6 lg:px-[var(--frame-x)]",
  /** The 980px editorial text spine (Apple's measured column). */
  editorial: "998px",
};
