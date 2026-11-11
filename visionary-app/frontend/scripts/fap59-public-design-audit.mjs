#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * FAP-59 public-page design audit — measured evidence generator.
 *
 * Founder directive: all public pages must read against one product rhythm and
 * the Apple premium bar. The reference set (landing + 5 personas + how-it-works
 * + pricing + download) is the law; "the rest" is measured against it.
 *
 * Measures, per route:
 *   - h1 display geometry (fontSize / weight / lineHeight / letterSpacing)
 *   - sub-copy tier (fontSize / lineHeight / colour)
 *   - CTA anatomy (height / fontSize / weight / radius / horizontal padding)
 *   - section paddings (pt/pb) for the rhythm band
 *   - document/main horizontal overflow
 *
 * Usage:
 *   AUDIT_URL=http://127.0.0.1:5173 AUDIT_OUT=<dir> node scripts/fap59-public-design-audit.mjs
 *
 * Writes <dir>/design-audit-results.json and screenshots per route at 1440.
 * Exit 0 (evidence generator, not a gate).
 * ────────────────────────────────────────────────────────────────────────── */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const outDir = path.resolve(process.env.AUDIT_OUT || 'artifacts/research/fap59-frontend-design/public-design-audit');
const widths = (process.env.AUDIT_WIDTHS || '1440').split(',').map(Number);
const shoot = process.env.AUDIT_SHOOT !== '0';
await fs.mkdir(outDir, { recursive: true });

const REFERENCE = ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/how-it-works', '/pricing', '/download'];
const REST = [
  '/about', '/careers', '/contact', '/partners', '/updates', '/referral', '/research',
  '/community', '/help', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies',
];
const ROUTES = [...REFERENCE.map((r) => ({ group: 'reference', route: r })), ...REST.map((r) => ({ group: 'rest', route: r }))];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(90000);

const probe = () => {
  const px = (v) => Math.round(parseFloat(v || '0') * 100) / 100;
  const q = (sel) => document.querySelector(sel);
  const h1 = q('#main h1') || q('h1');
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const h1cs = cs(h1);
  // CTA: the first interactive pill/link in the hero region (first 1400px of the page)
  const candidates = [...document.querySelectorAll('#main a[href], #main button')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0 && r.top < 1400 && r.top > -1)
    .sort((a, b) => a.r.top - b.r.top);
  const heroPill = candidates.find(({ el }) => {
    const c = getComputedStyle(el);
    return (c.borderRadius || '').startsWith('9999') || parseFloat(c.borderTopLeftRadius) >= 100;
  });
  // quiet text link: a blue inline link in the hero region
  const heroLink = candidates.find(({ el }) => /rgb\(0,\s*102,\s*204\)|rgb\(41,\s*151,\s*255\)/.test(getComputedStyle(el).color));
  const cta = heroPill ? heroPill.el : (heroLink ? heroLink.el : null);
  const ccs = cs(cta);
  const sub = [...document.querySelectorAll('#main p')].find((el) => {
    if (el.offsetParent === null) return false;
    const t = (el.textContent || '').trim();
    return t.length > 40 && parseFloat(getComputedStyle(el).fontSize) >= 15 && parseFloat(getComputedStyle(el).fontSize) <= 24;
  });
  const scs = cs(sub);
  const sections = [...document.querySelectorAll('#main section')].slice(0, 12).map((el) => {
    const c = getComputedStyle(el);
    return { pt: px(c.paddingTop), pb: px(c.paddingBottom) };
  });
  const main = q('#main');
  const overflow = [];
  for (let w of [320, 390, 768, 1024, 1440]) {
    if (document.documentElement.scrollWidth > window.innerWidth + 1) overflow.push(`doc>${window.innerWidth}`);
  }
  return {
    h1: h1cs ? {
      text: (h1.textContent || '').trim().slice(0, 60),
      fontSize: h1cs.fontSize, fontWeight: h1cs.fontWeight,
      lineHeight: h1cs.lineHeight, letterSpacing: h1cs.letterSpacing,
    } : null,
    cta: ccs ? {
      text: (cta.textContent || '').trim().slice(0, 40),
      h: Math.round(cta.getBoundingClientRect().height),
      fontSize: ccs.fontSize, fontWeight: ccs.fontWeight,
      radius: ccs.borderTopLeftRadius,
      px: ccs.paddingLeft,
    } : null,
    sub: scs ? { text: (sub.textContent || '').trim().slice(0, 50), fontSize: scs.fontSize, lineHeight: scs.lineHeight, color: scs.color } : null,
    sections: { count: sections.length, paddings: sections.slice(0, 8) },
    overflowDoc: document.documentElement.scrollWidth > window.innerWidth + 1,
    overflowMain: main ? main.scrollWidth > main.clientWidth + 1 : false,
  };
};

const results = [];
for (const { group, route } of ROUTES) {
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(700);
    const data = await page.evaluate(probe);
    results.push({ group, route, ...data });
    if (shoot) {
      const name = route === '/' ? 'landing' : route.replace(/^\//, '').replace(/\//g, '-');
      await page.screenshot({ path: path.join(outDir, `${name}@1440.png`) });
    }
    process.stdout.write('.');
  } catch (error) {
    results.push({ group, route, error: String(error && error.message ? error.message : error) });
    process.stdout.write('x');
  }
}
process.stdout.write('\n');

// overflow sweep across widths for every route
const overflowSweep = [];
for (const { route } of ROUTES) {
  try {
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
    const per = [];
    for (const w of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(250);
      const bad = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth > window.innerWidth + 1,
        main: (() => { const m = document.querySelector('#main'); return m ? m.scrollWidth > m.clientWidth + 1 : false; })(),
      }));
      if (bad.doc || bad.main) per.push({ w, ...bad });
    }
    overflowSweep.push({ route, overflow: per });
  } catch (error) {
    overflowSweep.push({ route, error: String(error) });
  }
}

await browser.close();
await fs.writeFile(path.join(outDir, 'design-audit-results.json'), JSON.stringify(results, null, 2));
await fs.writeFile(path.join(outDir, 'overflow-sweep.json'), JSON.stringify(overflowSweep, null, 2));

const sum = (g, key) => results.filter((r) => r.group === g && r[key]).map((r) => r[key][key === 'cta' ? 'h' : 'fontSize']);
console.log(`routes measured: ${results.length} (errors: ${results.filter((r) => r.error).length})`);
console.log(`reference CTA heights: ${[...new Set(sum('reference', 'cta'))].join(',')}`);
console.log(`rest CTA heights:      ${[...new Set(sum('rest', 'cta'))].join(',')}`);
console.log(`reference CTA type:    ${[...new Set(sum('reference', 'cta').map((_, i) => results.filter((r) => r.group === 'reference' && r.cta)[i]?.cta.fontSize))].join(',')}`);
console.log(`rest CTA type:         ${[...new Set(results.filter((r) => r.group === 'rest' && r.cta).map((r) => r.cta.fontSize))].join(',')}`);
console.log(`overflow routes: ${overflowSweep.filter((s) => s.overflow && s.overflow.length).length}`);
if (errors.length) console.log(`page errors: ${errors.length} :: ${errors.slice(0, 3).join(' | ')}`);
console.log(`evidence: ${outDir}`);
