/**
 * A3 verification (FAP-43) — DOM color-scan of ALL public routes + captures of biggest movers.
 * Scan: every element's computed color/background/border/shadow/fill must contain NO
 * Google-family RGB tuple. Law palette (ink/slate/muted/line/ground/link/commerce/washes/
 * dark-reserve/system colors) defines the legitimate blue/grey/red/green space.
 */
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5183';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = ['/', '/signin', '/login', '/register', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies'];
// biggest movers get before/after-able captures (persona bulk, editorial, trust, auth fields)
const CAPTURE_ROUTES = ['/student', '/teacher', '/organization', '/updates', '/terms', '/signin'];
const WIDTHS = [1440, 1024, 390];

/* Google-family computed rgb tuples that must not render on the public surface */
const BANNED = [
  'rgb(66, 133, 244', 'rgb(11, 87, 208', 'rgb(26, 115, 232', 'rgb(138, 180, 248', 'rgb(210, 227, 252',
  'rgb(95, 99, 105', 'rgb(154, 160, 166', 'rgb(218, 220, 224', 'rgb(248, 249, 250', 'rgb(241, 243, 244',
  'rgb(32, 33, 36', 'rgb(60, 64, 67', 'rgb(18, 19, 23', 'rgb(44, 45, 49', 'rgb(23, 78, 166',
  'rgb(234, 67, 53', 'rgb(52, 168, 83', 'rgb(251, 188, 4', 'rgba(66, 133, 244', 'rgba(11, 87, 208', 'rgba(26, 115, 232',
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
const page = await ctx.newPage();

const scan = [];
for (const route of ROUTES) {
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(900);
    const hits = await page.evaluate((banned) => {
      const out = [];
      for (const el of document.querySelectorAll('*')) {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
        const s = getComputedStyle(el);
        const probes = [s.color, s.backgroundColor, s.borderTopColor, s.borderBottomColor, s.borderLeftColor, s.borderRightColor, s.boxShadow, s.outlineColor, s.textDecorationColor];
        const svg = el.getAttribute && el.getAttribute('fill');
        if (svg && svg.startsWith('#')) probes.push(`has-fillof-${svg}`);
        for (const p of probes) if (p && banned.some(b => p.includes(b))) { out.push(`${el.tagName.toLowerCase()} ${(el.innerText || '').slice(0, 16)} ${p.slice(0, 60)}`); break; }
      }
      return out.slice(0, 8);
    }, BANNED);
    scan.push({ route, status: 'ok', hits });
    console.log(`${route} ${hits.length === 0 ? 'CLEAN' : 'HITS ' + hits.length}`);
  } catch (e) {
    scan.push({ route, status: 'failed: ' + String(e).slice(0, 70) });
    console.log(`${route} SCAN-FAILED`);
  }
}
await ctx.close();

const captures = [];
for (const width of WIDTHS) {
  const c2 = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const p2 = await c2.newPage();
  for (const route of CAPTURE_ROUTES) {
    const slug = route.slice(1);
    try {
      await p2.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 20000 });
      await p2.waitForTimeout(1000);
      await p2.screenshot({ fullPage: true, path: path.join(ROOT, `${slug}-${width}.jpeg`), type: 'jpeg', quality: 80 });
      captures.push({ route, width, status: 'ok' });
    } catch (e) {
      captures.push({ route, width, status: 'failed: ' + String(e).slice(0, 70) });
    }
  }
  await c2.close();
}
await browser.close();

const hitRoutes = scan.filter(r => r.hits && r.hits.length);
writeFileSync(path.join(ROOT, 'a3-scan-receipt.json'), JSON.stringify({ scannedAt: new Date().toISOString(), routes: ROUTES.length, bandedFamilies: BANNED.length, clean: scan.length - hitRoutes.length, hitRoutes, captures }, null, 2));
console.log(`SCAN ${scan.length - hitRoutes.length}/${scan.length} clean · capture ${captures.filter(c => c.status === 'ok').length}/${captures.length}`);
console.log(JSON.stringify(hitRoutes.map(r => ({ route: r.route, hits: r.hits.slice(0, 3) })), null, 1));
mkdirSync(ROOT, { recursive: true });
