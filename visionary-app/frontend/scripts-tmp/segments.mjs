/* Faithful whole-page record: default motion, scroll pass to load lazy
   media, then viewport segments across the document. Waypoint: this avoids
   the Chromium fullPage-screenshot compositing artifact that blanks
   media-settle layers. Usage: node scripts-tmp/segments.mjs <url> <outDir> <width> <height> <prefix> */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const [url, outDir, widthArg, heightArg, prefix] = process.argv.slice(2);
const width = Number(widthArg), height = Number(heightArg);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(1200);

await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));
});
await page.waitForLoadState('networkidle').catch(() => {});

const total = await page.evaluate(() => document.body.scrollHeight);
const stepPx = Math.round(height * 0.89);
let i = 0;
for (let y = 0; y < total; y += stepPx, i += 1) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, `${prefix}-seg${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 74 });
}
console.log(`segments: ${i} total, page ${total}px`);
await browser.close();
