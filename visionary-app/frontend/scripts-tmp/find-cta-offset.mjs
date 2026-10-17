/* Locate CTA section offsets for previews. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [url, id] of [['how-it-works', '07-cta'], ['pricing', '05-cta']]) {
  await page.goto('http://localhost:5173/' + url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const top = await page.evaluate((sel) => document.querySelector(sel)?.offsetTop, `section[data-section="${id}"]`);
  console.log(url, id, 'top=', top, 'seg=', Math.floor(top / 900));
}
await browser.close();
