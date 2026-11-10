/** A4 captures — 6 representative routes × 3 widths, jpeg q80, for the human-eye pass. */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5185';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'captures');
const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization'];
const WIDTHS = [1440, 1024, 390];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    const url = `http://127.0.0.1:${PORT}${route}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('main', { timeout: 12000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, `a5-${slug}-${width}.jpeg`), fullPage: true, type: 'jpeg', quality: 80 });
      console.log(`ok ${slug}@${width}`);
    } catch (e) {
      try { await page.screenshot({ path: path.join(OUT, `a5-${slug}-${width}-FALLBACK.jpeg`), fullPage: false, type: 'jpeg', quality: 80 }); } catch {}
      console.log(`ERR ${slug}@${width}: ${String(e).slice(0, 60)}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log('captures complete');

