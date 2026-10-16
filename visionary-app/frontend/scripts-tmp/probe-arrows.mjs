/* Compare card-arrow geometry: community vs approved research. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const grab = async (url, sel) => {
  await page.goto(`http://localhost:5173${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#main h1', { timeout: 30000 });
  await page.waitForTimeout(600);
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { s, missing: true };
    const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { s, cls: el.getAttribute('class'), w: r.width, h: r.height, cssW: c.width, cssH: c.height };
  }, sel);
};

console.log(JSON.stringify(await grab('/research', '#future a.group > svg'), null, 1));
console.log(JSON.stringify(await grab('/community', '#learners a.group > svg'), null, 1));
await browser.close();
