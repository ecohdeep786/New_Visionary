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
  chipBg: "#D2E3FC",
  track: "#f1f3f4",
  mist: "#dadce0",
  surface: "#F5F6F8",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
  white: "#ffffff",
};

/** Corner-radius scale. Media and cards share 28/24; everything interactive is a pill. */
export const radius = {
  media: "28px",
  card: "24px",
  overlay: "20px",
  pill: "9999px",
};

/** Type scale as clamp() strings for inline styles. */
export const type = {
  sectionHeading: "clamp(28px, 2.78vw, 40px)",
  display: "clamp(36px, 5vw, 72px)",
  body: "17.5px",
  cardBody: "14px",
};

/** Content container widths — hero pages use their own 1756px shell. */
export const container = {
  standard: "max-w-[1240px]",
  wide: "max-w-[1400px]",
  hero: "max-w-[1756px]",
};
