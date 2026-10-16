/* Careers hero submit + CTA pill after the 16px alignment. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/careers', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(700);
const out = await page.evaluate(() => {
  const dumpEl = (el) => {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { txt: el.textContent.trim().slice(0, 24), fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, h: Math.round(r.height), bg: c.backgroundColor };
  };
  const els = [...document.querySelectorAll('#main a[class*="bg-[#121317]"], #main button[class*="bg-[#121317]"]')];
  return els.map(dumpEl).filter((d) => d.h > 0);
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
