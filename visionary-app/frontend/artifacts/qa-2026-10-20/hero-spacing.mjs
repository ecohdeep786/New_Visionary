/* Landing hero spacing verification at 390/768/1440 — gaps, target sizes,
   and screenshots for visual review. */
import { chromium } from 'playwright-core';
import path from 'node:path';

const OUT = process.env.OUT_DIR || 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\2\\opencode\\hero-spacing';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const results = {};
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4188/', { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => { const h1 = document.querySelector('main h1'); return h1 && (h1.textContent || '').includes('One intelligence'); }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  const m = await page.evaluate(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
    const byText = (t) => Array.from(document.querySelectorAll('a')).find((a) => (a.textContent || '').trim().startsWith(t) && a.offsetWidth);
    const h1 = document.querySelector('main h1');
    const cta = byText('Start learning');
    const sec = byText('See how it works');
    const rail = document.querySelector('nav[aria-label="Audiences"]');
    const railLink = rail ? rail.querySelector('a') : null;
    const copy = document.querySelector('.cast-copy');
    const imgs = Array.from(document.querySelectorAll('main img')).map((i) => Math.round(i.getBoundingClientRect().top)).filter((v) => v > 0);
    const cr = cta ? cta.getBoundingClientRect() : null;
    const sr = sec ? sec.getBoundingClientRect() : null;
    return {
      vw: innerWidth, vh: innerHeight,
      copy: copy ? R(copy) : null,
      h1: h1 ? R(h1) : null,
      cta: cta ? R(cta) : null,
      secondary: sec ? R(sec) : null,
      rail: rail ? R(rail) : null,
      railLink: railLink ? R(railLink) : null,
      wordToCta: (h1 && cr) ? Math.round(cr.top - h1.getBoundingClientRect().bottom) : null,
      ctaToRail: (rail && cr) ? Math.round(rail.getBoundingClientRect().top - cr.bottom) : null,
      pairGap: (cr && sr) ? Math.round(sr.left - cr.right) : null,
      firstImageTop: imgs.length ? Math.min(...imgs) : null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  results[w] = m;
  const file = path.join(OUT, 'home-' + w + '.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log(w, JSON.stringify(m));
  await ctx.close();
}
await browser.close();
