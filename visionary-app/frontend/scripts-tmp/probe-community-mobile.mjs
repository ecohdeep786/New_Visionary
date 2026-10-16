/* Mobile width hygiene: document overflow + marquee/jump-bar behavior at 390. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173/community', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const doc = document.documentElement;
  const bar = document.querySelector('nav[aria-label="Community sections"]');
  const barInner = bar.firstElementChild;
  return {
    overflowX: doc.scrollWidth - doc.clientWidth,
    widest: (() => {
      let best = null;
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 391 && (!best || r.width > best.w)) best = { w: Math.round(r.width), cls: String(el.className).slice(0, 60), tag: el.tagName.toLowerCase() };
      });
      return best;
    })(),
    jumpBar: { h: Math.round(bar.getBoundingClientRect().height), scrollW: barInner.scrollWidth, clientW: barInner.clientWidth },
    marqueeBroken: [...document.querySelectorAll('main img')].filter((el) => !(el.complete && el.naturalWidth > 0)).length,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
