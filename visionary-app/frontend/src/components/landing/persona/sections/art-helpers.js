/* Designed "intelligence" stage — the homepage's ring-and-V-mark language on
   a flat Google-Store surface. Pure SVG in canonical tokens: no external
   requests, no binary weight. `variant` varies composition so repeated cards
   on one page don't read as copies. Rendered wherever a persona section has
   no local photograph (and as a guard, whenever an http(s) URL is passed). */
const ART_VARIANTS = [
  { rotate: 0, dots: [18, 62, 82], scale: 1 },
  { rotate: 40, dots: [30, 74], scale: 1.06 },
  { rotate: 95, dots: [12, 48, 88], scale: 0.94 },
  { rotate: 150, dots: [24, 66], scale: 1.02 },
];

const isExternalSrc = (src) => typeof src === "string" && /^https?:/i.test(src);
export { ART_VARIANTS, isExternalSrc };
