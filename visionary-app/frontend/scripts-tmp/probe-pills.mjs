/* Differential: ink pills on approved pages vs the just-converted careers page. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const url of ['/contact', '/partners', '/careers']) {
  await page.goto(`http://localhost:5173${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#main h1', { timeout: 30000 });
  await page.waitForTimeout(700);
  const out = await page.evaluate(() => {
    const dumpEl = (el) => {
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { txt: el.textContent.trim().slice(0, 28), fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, h: Math.round(r.height), bg: c.backgroundColor };
    };
    return {
      anchorPills: [...document.querySelectorAll('#main a[class*="bg-[#121317]"]')].map(dumpEl),
      buttonPills: [...document.querySelectorAll('#main button[class*="bg-[#121317]"]')].map(dumpEl),
    };
  });
  console.log(url, JSON.stringify(out));
}
await browser.close();
