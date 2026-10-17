/* Dedicated closer screenshots for both converted pages. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const dir = 'artifacts/research/remaining-pages-audit-2026-10-16/captures/after';
for (const [url, id, out] of [
  ['how-it-works', '07-cta', 'how-after-cta.jpg'],
  ['pricing', '05-cta', 'pricing-after-cta.jpg'],
]) {
  await page.goto('http://localhost:5173/' + url, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const top = await page.evaluate((sel) => document.querySelector(sel)?.offsetTop, `section[data-section="${id}"]`);
  await page.evaluate((y) => scrollTo(0, y), Math.max(0, top - 60));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dir}/${out}` });
  console.log('saved', out, 'at top=', top);
}
await browser.close();
