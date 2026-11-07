#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * FAP-59 live browser verification + screenshot evidence.
 *
 * Runs the real dev-server product in msedge (via playwright-core), walks the
 * public surface, measures the CTA law / rhythm / overflow at each width, and
 * saves PNG evidence per route into the artifacts directory.
 *
 * Usage:
 *   VERIFY_URL=http://127.0.0.1:5173 VERIFY_OUT=<dir> node scripts/fap59-browser-verify.mjs
 *
 * Exit 1 if a law assertion fails (page error, document overflow, CTA anatomy
 * drift on a page whose hero pill is measured). Writes verification.json.
 * ────────────────────────────────────────────────────────────────────────── */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.VERIFY_URL || 'http://127.0.0.1:5173';
const outDir = path.resolve(process.env.VERIFY_OUT || 'artifacts/research/fap59-frontend-design/verification');
await fs.mkdir(outDir, { recursive: true });

const ROUTES = [
  { group: 'reference', route: '/', name: 'landing' },
  { group: 'reference', route: '/student', name: 'student' },
  { group: 'reference', route: '/teacher', name: 'teacher' },
  { group: 'reference', route: '/parent', name: 'parent' },
  { group: 'reference', route: '/professional', name: 'professional' },
  { group: 'reference', route: '/organization', name: 'organization' },
  { group: 'reference', route: '/how-it-works', name: 'how-it-works' },
  { group: 'reference', route: '/pricing', name: 'pricing' },
  { group: 'reference', route: '/download', name: 'download' },
  { group: 'rest', route: '/about', name: 'about' },
  { group: 'rest', route: '/careers', name: 'careers' },
  { group: 'rest', route: '/contact', name: 'contact' },
  { group: 'rest', route: '/partners', name: 'partners' },
  { group: 'rest', route: '/updates', name: 'updates' },
  { group: 'rest', route: '/referral', name: 'referral' },
  { group: 'rest', route: '/research', name: 'research' },
  { group: 'rest', route: '/community', name: 'community' },
  { group: 'rest', route: '/help', name: 'help' },
  { group: 'rest', route: '/safety', name: 'safety' },
  { group: 'rest', route: '/privacy', name: 'privacy' },
  { group: 'rest', route: '/terms', name: 'terms' },
  { group: 'rest', route: '/security', name: 'security' },
  { group: 'rest', route: '/accessibility', name: 'accessibility' },
  { group: 'rest', route: '/cookies', name: 'cookies' },
];
const WIDTHS = [1440, 1024, 768, 390, 320];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push({ route: page.url(), error: String(e) }));
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(90000);

const measure = () => {
  const px = (v) => Math.round(parseFloat(v || '0'));
  // Scope to the page's own hero chapter — not the nav, tabs, or policy contents.
  const hero = document.querySelector('#main [data-section="01-hero"]')
    || [...document.querySelectorAll('#main > section, #main section')][0]
    || document.querySelector('#main');
  const inHero = (sel) => [...hero.querySelectorAll(sel)];
  // CTA pill candidates: rounded controls carrying a CTA-law tone. The law
  // tones are the ink fill (#1d1d1f), the link blue (#0066cc) and the commerce
  // cobalt (#0071e3) — grey/white chips, tabs and suggestion pills are not CTAs.
  const LAW_FILLS = ['rgb(29, 29, 31)', 'rgb(0, 102, 204)', 'rgb(0, 113, 227)'];
  const pills = inHero('a[href], button')
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0)
    .filter(({ el }) => {
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderTopLeftRadius || '0');
      return radius >= 100 && LAW_FILLS.includes(cs.backgroundColor);
    });
  // the primary CTA: the first law-toned pill whose target is not an in-page jump
  const pill = pills.find(({ el }) => !(el.getAttribute('href') || '').startsWith('#')) || pills[0];
  const pcs = pill ? getComputedStyle(pill.el) : null;
  // The hero lead: the hero's own first substantial paragraph.
  const sub = inHero('p').find((el) => (el.textContent || '').trim().length > 40);
  const scs = sub ? getComputedStyle(sub) : null;
  const h1 = hero.querySelector('h1') || document.querySelector('#main h1');
  return {
    h1Size: h1 ? getComputedStyle(h1).fontSize : null,
    ctaPill: pill ? {
      text: (pill.el.textContent || '').trim().slice(0, 30),
      h: px(pill.r.height), fontSize: pcs.fontSize, fontWeight: pcs.fontWeight,
      px: pcs.paddingLeft, radius: px(pcs.borderTopLeftRadius),
    } : null,
    subTier: scs ? { fontSize: scs.fontSize, color: scs.color } : null,
    docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    mainOverflow: (() => { const m = document.querySelector('#main'); return m ? m.scrollWidth > m.clientWidth + 1 : false; })(),
    heroPt: hero ? px(getComputedStyle(hero).paddingTop) : null,
    heroPb: hero ? px(getComputedStyle(hero).paddingBottom) : null,
  };
};

const results = [];
let failures = 0;
for (const { group, route, name } of ROUTES) {
  const entry = { group, route, name, widths: {}, errors: [] };
  try {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    // `networkidle` is unreliable against a Vite dev server with HMR sockets;
    // settle on the app shell instead, then give fonts/images a short beat.
    await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#main', { timeout: 30000 });
    await page.waitForTimeout(900);
    const m = await page.evaluate(measure);
    entry.widths[w] = m;
    if (m.docOverflow) { entry.errors.push(`document overflow @${w}`); failures += 1; }
    // CTA law: a detected hero pill must be 44px tall with 17px label at desktop.
    // (Tabs, pagers and in-page jump chips are excluded by the hero scoping.)
    if (w === 1440 && m.ctaPill && m.ctaPill.h !== 44) {
      entry.errors.push(`CTA height drift @1440: ${JSON.stringify(m.ctaPill)}`);
      failures += 1;
    }
    if (w === 1440) await page.screenshot({ path: path.join(outDir, `${name}@1440.png`), fullPage: false });
    if (w === 390) await page.screenshot({ path: path.join(outDir, `${name}@390.png`), fullPage: false });
  }
  } catch (error) {
    entry.errors.push(`navigation/measure failed: ${String(error && error.message ? error.message : error)}`);
    failures += 1;
  }
  results.push(entry);
  process.stdout.write(entry.errors.length ? 'x' : '.');
}
process.stdout.write('\n');

const overflow = results.flatMap((r) => Object.entries(r.widths)
  .filter(([, m]) => m.docOverflow).map(([w]) => `${r.route}@${w}`));

await browser.close();
await fs.writeFile(path.join(outDir, 'verification.json'), JSON.stringify({
  base, generatedAt: new Date().toISOString(), routes: results,
  pageErrors, failures, overflow,
}, null, 2));

console.log(`routes: ${results.length}`);
console.log(`page errors: ${pageErrors.length}`);
console.log(`law failures: ${failures}`);
for (const r of results) if (r.errors.length) console.log(`  ${r.route}: ${r.errors.join(' | ')}`);
console.log(`evidence: ${outDir}`);
process.exit(failures === 0 && pageErrors.length === 0 ? 0 : 1);
