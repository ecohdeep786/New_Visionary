/* Sibling-strip ground truth: what the approved About hero's fan cards and
   quiet link actually compute. Usage: node scripts-tmp/probe-about-strip.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/about', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(700);

const out = await page.evaluate(() => {
  const d = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { label, radius: c.borderTopLeftRadius, mr: c.marginRight, w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, shadow: c.boxShadow === 'none' ? null : 'shadow' };
  };
  const t = (s) => document.querySelector(s);
  return [
    d('fan-card', t('#main section .group.relative.mr-6')),
    d('fan-img?', t('#main section .group.relative.mr-6 img')),
    d('hero-dek', t('#main h1 + p')),
    d('hero-pill', t('#main section a[href="/how-it-works"]')),
    d('hero-quiet', t('#main section a[href="/research"]')),
  ];
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
