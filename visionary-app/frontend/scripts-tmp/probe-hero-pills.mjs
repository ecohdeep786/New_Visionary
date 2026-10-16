/* Hero action tier on approved pages vs careers. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const url of ['/', '/about', '/how-it-works', '/careers']) {
  await page.goto(`http://localhost:5173${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#main h1', { timeout: 30000 });
  await page.waitForTimeout(700);
  const out = await page.evaluate(() => {
    const scopes = ['[data-section="01-hero"]', '#main > section:first-of-type'];
    const els = new Set();
    for (const s of scopes) {
      document.querySelectorAll(`${s} a[class*="bg-[#121317]"], ${s} button[class*="bg-[#121317]"]`).forEach((el) => els.add(el));
    }
    return [...els].map((el) => {
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), txt: el.textContent.trim().slice(0, 24), fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, h: Math.round(r.height) };
    });
  });
  console.log(url, JSON.stringify(out));
}
await browser.close();
