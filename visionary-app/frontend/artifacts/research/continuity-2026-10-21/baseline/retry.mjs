/**
 * A0 retry pass — re-captures specific route@width combos that failed in the main run
 * (see baseline-receipts.json). Writes into this directory via the corrected ROOT path.
 */
import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = process.env.PORT || '5180';
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const RETRY = [
  { route: '/partners', width: 1440 },
  { route: '/partners', width: 1024 },
  { route: '/accessibility', width: 1440 },
  { route: '/signin', width: 1024 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const results = [];
for (const { route, width } of RETRY) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await context.newPage();
  let status = 'ok';
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1200);
    const slug = route.slice(1);
    await page.screenshot({ fullPage: true, path: path.join(ROOT, `${slug}-${width}.jpeg`), type: 'jpeg', quality: 80 });
  } catch (e) {
    status = 'failed: ' + String(e).slice(0, 80);
  }
  results.push({ route, width, status });
  console.log(`${route}@${width} ${status}`);
  await context.close();
}
await browser.close();
await writeFile(path.join(ROOT, 'retry-receipts.json'), JSON.stringify({ retriedAt: new Date().toISOString(), results }, null, 2));
console.log('RETRY DONE');
