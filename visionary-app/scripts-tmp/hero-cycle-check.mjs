import { chromium } from 'playwright-core';
const base = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
const words = [];
for (let i = 0; i < 7; i++) {
  words.push(await page.evaluate(() => document.querySelector('[data-section="01-hero"] h1 span span')?.textContent));
  await page.waitForTimeout(2800);
}
console.log('cycle:', JSON.stringify(words));
await browser.close();
