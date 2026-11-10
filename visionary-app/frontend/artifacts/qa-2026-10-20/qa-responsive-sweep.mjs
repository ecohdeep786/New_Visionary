/* QA responsive sweep — public frontend device-matrix review (2026-10-20).
 * Usage: node artifacts/qa-2026-10-20/qa-responsive-sweep.mjs [--base http://127.0.0.1:5173] [--out artifacts/qa-2026-10-20/evidence]
 * Screenshots every public route at two touch viewports and runs layout checks at seven
 * viewport widths, mirroring design-quality-review.mjs conventions (playwright-core + msedge).
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const base = arg('--base', 'http://127.0.0.1:5173');
const outDir = path.resolve(arg('--out', new URL('.', import.meta.url).pathname.replace(/^\//, '').replace(/%20/g, ' ') + 'evidence'));
await fs.mkdir(outDir, { recursive: true });

const ROUTES = [
  '/', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works',
  '/organization', '/download', '/about', '/pricing', '/careers', '/research',
  '/community', '/contact', '/partners', '/updates', '/referral', '/safety',
  '/privacy', '/terms', '/security', '/accessibility', '/cookies',
  '/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password'
];

const WIDTHS = [
  { name: 'se-320', width: 320, height: 900 },      // iPhone SE-class
  { name: 'ip-390', width: 390, height: 844 },      // iPhone 14/15/16 class
  { name: 'fold-360', width: 360, height: 800 },    // small Android
  { name: 'tab-768', width: 768, height: 1024 },    // iPad portrait
  { name: 'tab-1024', width: 1024, height: 768 },   // iPad landscape
  { name: 'lap-1440', width: 1440, height: 900 },   // laptop
  { name: 'desk-1920', width: 1920, height: 1080 }  // desktop
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = { startedAt: new Date().toISOString(), base, checks: [] };
const worst = { overflow: {}, consoleErrors: [] };

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: WIDTHS[0], deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 140)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });

  let urlOk = false;
  try {
    await page.goto(base + route, { waitUntil: 'load', timeout: 45000 });
    await page.waitForFunction(() => !document.body || !document.body.innerText.includes('Loading...'), { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(400);
    urlOk = true;
  } catch (e) {
    errors.push('navigation: ' + String(e).slice(0, 140));
  }

  if (urlOk) {
    await page.screenshot({ path: path.join(outDir, route === '/' ? 'home' : route.replace(/\//g, '_').slice(1)) + '-390.jpeg', type: 'jpeg', quality: 62, fullPage: true });

    for (const vp of WIDTHS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(120);
      const geo = await page.evaluate(() => {
        const de = document.documentElement;
        const wide = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > window.innerWidth + 4 && r.height > 8) {
            if (wide.length < 4) wide.push({ tag: el.tagName.toLowerCase(), cls: ((el.className || '') + '').slice(0, 60), w: Math.round(r.width) });
          }
        });
        let nav = null; let footer = null;
        const header = document.querySelector('header');
        if (header) {
          const controls = Array.from(header.querySelectorAll('a,button')).filter((el) => el.offsetParent !== null);
          const smallest = controls.map((el) => { const r = el.getBoundingClientRect(); return Math.min(r.width || 999, r.height || 999); });
          nav = smallest.length ? Math.max(...smallest) : null;
        }
        const footerEl = document.querySelector('footer');
        if (footerEl) {
          const links = Array.from(footerEl.querySelectorAll('a')).filter((el) => el.offsetParent !== null);
          const hs = links.map((el) => el.getBoundingClientRect().height);
          footer = hs.length ? Math.max(...hs) : null;
        }
        const bodyFont = getComputedStyle(document.body).fontFamily.split(',')[0].replaceAll('"', '').trim();
        return { overflowX: de.scrollWidth > de.clientWidth + 1, clientW: de.clientWidth, scrollW: de.scrollWidth, wide, navMin: nav, footerMinH: footer !== null ? Math.round(footer) : null, bodyFont, docHeight: de.scrollHeight };
      });
      const check = { route, viewport: vp.name, width: vp.width, ...geo, errors: errors.length };
      report.checks.push(check);
      if (geo.overflowX) worst.overflow[route] = worst.overflow[route] || [];
      if (geo.overflowX) worst.overflow[route].push(vp.name);
      if (geo.navMin !== null && geo.navMin < 44) worst.navMin = Math.min(worst.navMin === undefined ? 99 : worst.navMin, geo.navMin);
      if (geo.footerMinH !== null && geo.footerMinH < 44) worst.footerMinH = Math.min(worst.footerMinH === undefined ? 99 : worst.footerMinH, geo.footerMinH);
    }

    if (route.startsWith('/')) worst.consoleErrors.push(...errors.filter((e) => e.startsWith('pageerror')).map((e) => route + ' :: ' + e));
  }
  await ctx.close();
}

await browser.close();
report.worst = worst;
const reportPath = path.join(outDir, 'sweep-report.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

const overflowRoutes = Object.keys(worst.overflow);
const navOk = report.checks.filter((c) => c.viewport === 'ip-390' && (c.navMin === null || c.navMin >= 44)).length;
const summary = [
  '== QA responsive sweep summary ==',
  'routes checked: ' + ROUTES.length + ' x ' + WIDTHS.length + ' widths = ' + report.checks.length + ' checks',
  'horizontal overflow routes/widths: ' + (overflowRoutes.length ? overflowRoutes.map((r) => r + ' [' + worst.overflow[r].join(',') + ']').join('; ') : 'none'),
  'min nav target px observed: ' + (worst.navMin ?? 'n/a'),
  'min footer link height px observed: ' + (worst.footerMinH ?? 'n/a'),
  '390px nav >=44px pages: ' + navOk + '/' + ROUTES.length,
  'pageerror/console-error pages: ' + (worst.consoleErrors.length ? worst.consoleErrors.slice(0, 8).join(' | ') : 'none'),
  'report: ' + reportPath
].join('\n');
await fs.writeFile(path.join(outDir, 'summary.txt'), summary);
console.log(summary);
