/* Element-level captures of specific sections (scrolls through first so lazy
   images load). Usage: node scripts-tmp/section-shots.mjs <url> <outDir> <width> <spec...>
   spec = data-section name (element [data-section="name"]) captured as PNG */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const [url, outDir, widthArg, ...specs] = process.argv.slice(2);
const width = Number(widthArg);
const height = width >= 1000 ? 900 : 844;
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width, height } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });

// scroll through to trigger lazy loading
await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 100));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
});
await page.waitForLoadState('networkidle').catch(() => {});

// report any images that failed to load for the target sections
const broken = await page.evaluate(() =>
  Array.from(document.images)
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => ({ src: img.currentSrc || img.src, cls: (img.className || '').toString().slice(0, 80) }))
);
console.log('broken images:', JSON.stringify(broken, null, 1));

for (const spec of specs) {
  const el = page.locator(`[data-section="${spec}"]`).first();
  const count = await el.count();
  if (!count) { console.log(`section ${spec}: NOT FOUND`); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await el.screenshot({ path: path.join(outDir, `live-${spec}-${width}.png`), animations: 'disabled' }).catch(async (e) => {
    console.log(`element shot failed ${spec}: ${e.message}; viewport fallback`);
    await page.screenshot({ path: path.join(outDir, `live-${spec}-${width}.png`) });
  });
  const box = await el.boundingBox();
  console.log(`section ${spec}: captured`, box && JSON.stringify({ y: Math.round(box.y + (await page.evaluate(() => scrollY))), h: Math.round(box.height) }));
}

await context.close();
await browser.close();
