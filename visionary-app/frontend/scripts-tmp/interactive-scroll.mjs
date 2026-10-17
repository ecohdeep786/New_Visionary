/* Interactive scroll test: screenshot viewport at given scroll offsets, default motion. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = 'C:/Users/Administrator/New_Visionary/visionary-app/artifacts/research/landing-redesign-2026-10-16/captures/interactive';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);

const offsets = [900, 1300, 3100, 3450, 4300, 4700, 6200];
for (const y of offsets) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/scroll-${y}.jpg`, type: 'jpeg', quality: 75 });
  console.log(`shot at ${y}`);
}
await browser.close();
