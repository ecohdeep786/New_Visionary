/* Exercise the /updates signup flow and measure the success state. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/updates', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1');
await page.waitForTimeout(600);

await page.fill('#updates-name', 'R&D probe');
await page.fill('#updates-email', 'probe@example.com');
await page.check('#signup input[type="checkbox"]');
await page.click('#signup button[type="submit"]');
await page.waitForTimeout(800);

const out = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'MISSING';
    const c = getComputedStyle(el);
    return [el.tagName.toLowerCase(), `${c.fontSize}/${c.fontWeight}/${c.lineHeight}`, c.color, c.backgroundColor, `r${c.borderTopLeftRadius}`,
      `h${Math.round(el.getBoundingClientRect().height)}`, (el.textContent || '').trim().slice(0, 40)].join(' | ');
  };
  return {
    h3: g('#signup [role="status"] h3'),
    copy: g('#signup [role="status"] p'),
    tile: g('#signup [role="status"] span'),
    change: g('#signup [role="status"] button'),
    submitGone: document.querySelector('#signup button[type="submit"]') === null,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
