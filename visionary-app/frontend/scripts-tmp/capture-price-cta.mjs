/* Pricing closer screenshot, standalone. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/pricing', { waitUntil: 'load' });
await page.waitForSelector('section[data-section="05-cta"]', { timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  const sec = document.querySelector('section[data-section="05-cta"]');
  window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - 60);
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'artifacts/research/remaining-pages-audit-2026-10-16/captures/after/pricing-after-cta.jpg' });
console.log('saved pricing-after-cta.jpg');
await browser.close();
process.exit(0);
