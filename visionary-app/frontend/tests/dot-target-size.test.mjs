import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* F-27/F-28 target-size law: every carousel-dot button is its own >=44px tap
 * target. The 2026-10-20 baseline recorded Lighthouse target-size score 0 on
 * `/` and `/student`: the dots were 8px buttons whose ±18px ::after expansion
 * produced overlapping invisible hit areas on the 8-16px dot pitch. The fix
 * renders the visible 8px dot as an inner span inside a real 44px button box
 * (touching, zero gap), so each target passes the WCAG 24px minimum AND the
 * FAP-30 44px law outright, with no tap-area overlap and no pseudo-expansion. */

const DOT_FILES = [
  'src/components/landing/system/ui.jsx', // ProgressDots (landing carousel, `/`)
  'src/components/landing/persona/sections/CarouselDots.jsx', // persona challenges (`/student`)
  'src/pages/landing/PartnersPage.jsx', // inline partner dots (`/partners`)
];

for (const file of DOT_FILES) {
  test(`${file} dot buttons are >=44px boxes with no overlapping ::after tap-area expansion`, () => {
    const source = readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
    assert.ok(!source.includes('after:-inset-y-[18px]'), 'the ±18px ::after tap-area expansion must not return — it creates overlapping invisible hit areas');
    assert.ok(/h-11\b/.test(source), 'dot buttons must be 44px tall (h-11)');
    assert.ok(/w-11\b/.test(source), 'dot buttons must be 44px wide (w-11)');
    assert.ok(/h-2\b/.test(source), 'the visible dot stays the approved 8px height (h-2)');
  });
}

test('ProgressDots and CarouselDots render the visible dot as an inner span, not the button box', () => {
  for (const file of DOT_FILES.slice(0, 2)) {
    const source = readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
    assert.ok(/<span\b[^>]*h-2/.test(source), `${file} must render the visible dot as an inner span`);
  }
});
