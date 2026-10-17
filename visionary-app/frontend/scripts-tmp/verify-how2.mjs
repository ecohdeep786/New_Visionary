/* Post-fix verification: mobile tab row scrolls, no page overflow; desktop unchanged. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

// mobile
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
await m.waitForTimeout(900);
await m.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
});
const mob = await m.evaluate(() => {
  const tl = document.querySelector('[role="tablist"]');
  const r = tl?.getBoundingClientRect();
  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    docW: document.documentElement.scrollWidth,
    tablist: tl ? { clientW: tl.clientWidth, scrollW: tl.scrollWidth, top: Math.round(r.top + scrollY), h: Math.round(r.height) } : null,
  };
});
// screenshot the tab row area
await m.evaluate(() => {
  const tl = document.querySelector('[role="tablist"]');
  tl.scrollIntoView({ block: 'center' });
});
await m.waitForTimeout(600);
await fs.mkdir('artifacts/research/remaining-pages-audit-2026-10-16/captures/after-mobile', { recursive: true });
await m.screenshot({ path: 'artifacts/research/remaining-pages-audit-2026-10-16/captures/after-mobile/how-tabs-check.png' });
console.log('MOBILE', JSON.stringify(mob));

// desktop quick re-verify
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
await d.waitForTimeout(700);
const desk = await d.evaluate(() => {
  const tl = document.querySelector('[role="tablist"]');
  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    tablist: tl ? { clientW: tl.clientWidth, scrollW: tl.scrollWidth } : null,
  };
});
console.log('DESKTOP', JSON.stringify(desk));
await browser.close();
