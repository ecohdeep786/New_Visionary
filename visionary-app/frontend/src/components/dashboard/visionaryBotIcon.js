import { createElement } from 'react';

/* The Guide's nav identity: the Visionary bot, reduced to one monochrome
 * mark that inherits currentColor — the same silhouette (round head, two
 * eyes, small smile, capsule body) as the brand bot image, adapted to the
 * nav icon system so it reads on light and dark surfaces alike. Plain
 * createElement (no JSX) so the Node-side navigation tests can import it.
 * Reference basis: Apple HIG — Icons; familiar shape language at small
 * sizes, one glyph family across the interface. */
const face = 'var(--v-surface, #ffffff)';
export default function VisionaryBotIcon({ size = 20, className = '' }) {
  return createElement('svg', {
    width: size, height: size, viewBox: '0 0 64 64', fill: 'none',
    className, 'aria-hidden': true, focusable: false,
  },
    createElement('rect', { x: 19, y: 34, width: 26, height: 26, rx: 12, fill: 'currentColor' }),
    createElement('circle', { cx: 32, cy: 23, r: 16, fill: 'currentColor' }),
    createElement('circle', { cx: 26, cy: 22.5, r: 2.7, fill: face }),
    createElement('circle', { cx: 38, cy: 22.5, r: 2.7, fill: face }),
    createElement('path', { d: 'M27.5 28.5c2.8 2.2 6.2 2.2 9 0', stroke: face, strokeWidth: 1.8, strokeLinecap: 'round', fill: 'none' }),
  );
}
