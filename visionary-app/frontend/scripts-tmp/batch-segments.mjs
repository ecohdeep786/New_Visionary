/* Batch segment capture for the remaining-pages audit.
   Usage: node scripts-tmp/batch-segments.mjs <outDir> <width> <height> <phase>
   phase: 'before' | 'after' — used in file prefix. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = process.argv[2] || 'artifacts/research/remaining-pages-audit-2026-10-16/captures/before';
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const phase = process.argv[5] || 'before';

const ROUTES = [
  ['how-it-works', '/how-it-works'],
  ['pricing', '/pricing'],
  ['download', '/download'],
  ['about', '/about'],
  ['careers', '/careers'],
  ['research', '/research'],
  ['community', '/community'],
  ['contact', '/contact'],
  ['partners', '/partners'],
  ['updates', '/updates'],
  ['referral', '/referral'],
  ['safety', '/safety'],
  ['privacy', '/privacy'],
  ['security', '/security'],
  ['terms', '/terms'],
  ['accessibility', '/accessibility'],
  ['cookies', '/cookies'],
];

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width, height } });

for (const [slug, route] of ROUTES) {
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  const total = await page.evaluate(() => document.body.scrollHeight);
  const stepPx = Math.round(height * 0.89);
  let i = 0;
  for (let y = 0; y < total; y += stepPx, i += 1) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `${slug}-${phase}-seg${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 72 });
  }
  console.log(`${slug}: ${i} segments (${total}px)`);
}

await browser.close();
