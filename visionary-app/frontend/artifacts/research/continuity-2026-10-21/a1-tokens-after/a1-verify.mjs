/**
 * A1 token-convergence verification (FAP-58) — targeted after-captures + law probes.
 * Surfaces touched by the token reference: landing, 5 persona pages, pricing, download.
 * Probes: CTA law anatomy (44/17/500/980/ink fill), hero fill weight (A1 fix = 500),
 * quiet-link blue, zero Google-blue washes, data-type role count.
 * Reduced-motion context: reveals render statically for full-page shots.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5181';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url))); // writes next to this script
mkdirSync(ROOT, { recursive: true });

const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/pricing', '/download'];
const WIDTHS = [1440, 1024, 390];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const captures = [];
let probe = null;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await context.newPage();
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ fullPage: true, path: path.join(ROOT, `${slug}-${width}.jpeg`), type: 'jpeg', quality: 80 });
      captures.push({ route, width, status: 'ok' });
      console.log(`${route}@${width} ok`);
    } catch (e) {
      captures.push({ route, width, status: 'failed: ' + String(e).slice(0, 80) });
      console.log(`${route}@${width} FAILED`);
    }
    if (route === '/' && width === 1440) {
      probe = await page.evaluate(() => {
        const law = (el) => {
          if (!el) return null;
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { h: Math.round(r.height), fontSize: s.fontSize, fontWeight: s.fontWeight, borderRadius: s.borderRadius, bg: s.backgroundColor, color: s.color, paddingLR: s.paddingLeft + ' ' + s.paddingRight };
        };
        const navCta = document.querySelector('nav a[href*="download"], nav a[href*="signup"], nav a[class*="bg-[#1d1d1f]"]') || document.querySelector('header a');
        const heroPill = document.querySelector('main a[href*="download"], main a[class*="bg-[#1d1d1f]"]');
        const links = [...document.querySelectorAll('a,p,span,button,h1,h2,h3')];
        const googleBlue = links.filter(el => {
          const s = getComputedStyle(el);
          return s.color === 'rgb(66, 133, 244)' || s.backgroundColor === 'rgb(66, 133, 244)';
        }).length;
        const quietBlue = [...document.querySelectorAll('a')].filter(el => getComputedStyle(el).color === 'rgb(0, 102, 204)').length;
        const typeRoles = document.querySelectorAll('[data-type]').length;
        return { navCta: law(navCta), heroPill: law(heroPill), googleBlueEls: googleBlue, quietLinkBlueEls: quietBlue, dataTypeRoles: typeRoles };
      });
    }
  }
  await context.close();
}
await browser.close();

writeFileSync(path.join(ROOT, 'a1-captures-receipt.json'), JSON.stringify({ capturedAt: new Date().toISOString(), branch: 'gl-kan-201-a1-tokens @ 632a1dab', captures }, null, 2));
writeFileSync(path.join(ROOT, 'a1-probe.json'), JSON.stringify({ probedAt: new Date().toISOString(), probe }, null, 2));
console.log('DONE ' + captures.filter(c => c.status === 'ok').length + '/' + captures.length);
console.log(JSON.stringify(probe));
