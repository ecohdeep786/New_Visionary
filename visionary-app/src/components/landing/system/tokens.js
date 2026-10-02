/**
 * Visionary landing design tokens — the single source of truth shared by every
 * public page. Values follow the Google marketing system (Google Sans Flex,
 * #5f6368 secondary text, #f1f3f4 tracks, #4285F4 action blue) with Apple-grade
 * restraint: one accent per zone, no decorative chrome.
 */

export const fontStack =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

export const color = {
  ink: "#121317",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  blue: "#4285F4",
  deepBlue: "#0b57d0",
  chipBg: "#e8f0fe",
  track: "#f1f3f4",
  mist: "#dadce0",
  surface: "#f8f9fa",
  surfaceBlue: "#e8f0fe",
  cardSurface: "#ffffff",
  cardSurfaceAlt: "#f8f9fa",
  white: "#ffffff",
};

/** Corner-radius scale. Media and cards share 28/24; everything interactive is a pill. */
export const radius = {
  media: "12px",
  card: "12px",
  overlay: "16px",
  pill: "9999px",
};

/** Type scale as clamp() strings for inline styles. */
export const type = {
  hero: "clamp(48px, 5.55vw, 80px)",
  sectionHeading: "clamp(28px, 3vw, 48px)",
  display: "clamp(40px, 4.45vw, 64px)",
  body: "16px",
  lead: "clamp(18px, 1.4vw, 20px)",
  cardBody: "14px",
};

/** Content container widths — hero pages use their own 1756px shell. */
export const container = {
  standard: "max-w-[1240px]",
  wide: "max-w-[1400px]",
  hero: "max-w-[1756px]",
};
