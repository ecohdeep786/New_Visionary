/**
 * A0 baseline-freeze capture (FAP-41) — evidence only, no product code changes.
 * Captures every public page at 1440 / 1024 / 390 from the served ORIGIN/DEV build.
 * Modeled on scripts/design-quality-review.mjs (playwright-core + msedge headless).
 * Reduced-motion context: scroll-reveal blocks render statically so full-page shots show real content.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5180';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)));
mkdirSync(ROOT, { recursive: true });

const ROUTES = new Set([
  '/', '/signin', '/login', '/register', '/student', '/teacher', '/parent', '/help',
  '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing',
  '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral',
  '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies',
]);
const WIDTHS = [1440, 1024, 390];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const receipts = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 100)));
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    const errorsBefore = consoleErrors.length;
    let status = 'ok';
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 12000 });
      await page.waitForTimeout(900);
      const body = (await page.evaluate(() => document.body ? document.body.innerText.slice(0, 60) : '')) || '';
      if (/^Loading\.\.\./.test(body.trim())) status = 'loading-stuck';
    } catch (e) {
      status = 'goto-failed: ' + String(e).slice(0, 60);
    }
    const file = `${slug}-${width}.jpeg`;
    try {
      await page.screenshot({ fullPage: true, path: path.join(ROOT, file), type: 'jpeg', quality: 80 });
    } catch (e) {
      receipts.push({ route, width, status: 'shot-failed: ' + String(e).slice(0, 60), file: null });
      console.log(`[${new Date().toISOString()}] ${route}@${width} SHOT-FAILED`);
      continue;
    }
    receipts.push({ route, width, status, file, newConsoleErrors: consoleErrors.length - errorsBefore });
    console.log(`[${new Date().toISOString()}] ${route}@${width} ${status}`);
  }
  await context.close();
}
await browser.close();

const files_ok = receipts.filter(r => r.file && !r.status.startsWith('shot-failed')).length;
const stuck = receipts.filter(r => r.status === 'loading-stuck').map(r => `${r.route}@${r.width}`);
const failed = receipts.filter(r => String(r.status).startsWith('shot-failed') || String(r.status).startsWith('goto-failed')).map(r => `${r.route}@${r.width}`);
writeFileSync(path.join(ROOT, 'baseline-receipts.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  base: 'origin/dev 84a432ec',
  viewportWidths: WIDTHS,
  totalCaptures: files_ok,
  loadingStuck: stuck,
  failures: failed,
  receipts,
}, null, 2));
console.log(`DONE ${files_ok} captures; stuck=${stuck.length}; failed=${failed.length}`);
console.log('stuck:', JSON.stringify(stuck));
console.log('failed:', JSON.stringify(failed));
