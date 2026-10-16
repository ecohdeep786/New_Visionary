/* Verify asset resolution on the landing page: dump img srcs per section. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 60000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
});
await page.waitForTimeout(1200);
const imgs = await page.evaluate(() => {
  const rows = [];
  document.querySelectorAll('#main img, #main .lazy-placeholder').forEach((el) => {
    const sec = el.closest('[data-section]');
    rows.push({
      section: sec?.getAttribute('data-section') ?? '-',
      tag: el.tagName.toLowerCase(),
      src: el.getAttribute?.('src') ?? '(placeholder div)',
      naturalW: el.naturalWidth ?? null,
      naturalH: el.naturalHeight ?? null,
      rect: (() => { const r = el.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
    });
  });
  return rows;
});
console.log(JSON.stringify(imgs, null, 1));
console.log('--- failed requests ---');
console.log(failed.slice(0, 30).join('\n'));
await browser.close();
