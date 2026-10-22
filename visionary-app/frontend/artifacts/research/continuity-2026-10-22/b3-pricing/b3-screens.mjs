/**
 * B3/FAP-48 — settled captures of /pricing at the three AC widths.
 * Usage: node b3-screens.mjs before|after  → b3-pricing-<mode>-<w>.png
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5190';
const MODE = process.argv[2] || 'before';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage();
for (const w of [1440, 768, 390]) {
  await page.setViewportSize({ width: w, height: 960 });
  await page.goto(`http://localhost:${PORT}/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(OUT, `b3-pricing-${MODE}-${w}.png`), fullPage: true });
  console.log(`captured ${MODE} @${w}`);
}
await browser.close();
console.log('DONE');
