/**
 * A4 typography fingerprint v2 (FAP-44) — settle-set version.
 * Guarantees: waits for main + at least one heading OR 6 tallies of sanity,
 * extra settle, and ONE retry when the app fails to mount content.
 * Dumps computed typography of h1/h2/h3 (≤14 each), p (≤10), pills (≤4).
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5184';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const TAG = process.argv[2] || 'before';
const ROUTES = ['/', '/student', '/pricing', '/terms', '/help'];
const WIDTHS = [1440, 1024, 390];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const dump = {};
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    let fp = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('main', { timeout: 12000 });
        const hasContent = await page.waitForFunction(() => {
          const m = document.querySelector('main');
          return !!m && m.querySelectorAll('h1,h2,h3,p').length > 0;
        }, { timeout: 12000 }).then(() => true).catch(() => false);
        await page.waitForTimeout(1500);
        fp = await page.evaluate(() => {
          const fp1 = (el, i) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return { i, tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 34), fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, h: Math.round(r.height) };
          };
          const heads = {};
          for (const t of ['h1', 'h2', 'h3']) heads[t] = [...document.querySelectorAll(`main ${t}`)].slice(0, 14).map(fp1);
          heads.p = [...document.querySelectorAll('main p')].slice(0, 10).map(fp1);
          heads.pill = [...document.querySelectorAll('main a, main button')].filter(el => { const s = getComputedStyle(el); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseInt(s.borderRadius) >= 900; }).slice(0, 4).map(fp1);
          return heads;
        });
        const total = Object.values(fp).reduce((n, arr) => n + arr.length, 0);
        if (total > 0 || hasContent) break;
      } catch (e) {
        fp = { error: String(e).slice(0, 60) };
      }
    }
    dump[`${slug}@${width}`] = fp;
  }
  await ctx.close();
}
await browser.close();
writeFileSync(path.join(OUT, `a4-typography-${TAG}.json`), JSON.stringify(dump, null, 1));
const empty = Object.entries(dump).filter(([, v]) => Object.values(v).reduce((n, a) => n + a.length, 0) === 0);
console.log(`WROTE a4-typography-${TAG}.json · 15 fingerprints${empty.length ? ` · EMPTY: ${empty.map(([k]) => k).join(',')}` : ' · all populated'}`);
