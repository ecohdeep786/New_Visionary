/* FAP-34 category-hero acceptance: compare our heroes (worktree preview)
   against the Vision Pro measured ladder. Targets:
   statement 28/40/48 (700 phone / 600 ≥768) lh 1.14/1.1/1.08 ls +0.007/0/-0.003
   tagline   17/24/28 (600) lh 1.24/1.17/1.14 ls -0.011/+0.009/+0.007
   landing hero (education ladder): eyebrow 40/40/56, display 64/96/140. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const VIEWPORTS = [[390, 844], [768, 1024], [1440, 900]];
const PAGES = [
  { name: 'home', url: 'http://127.0.0.1:4188/' },
  { name: 'student', url: 'http://127.0.0.1:4188/student' },
  { name: 'teacher', url: 'http://127.0.0.1:4188/teacher' }
];

const measure = () => {
  const st = (el) => { if (!el) return null; const c = getComputedStyle(el);
    return Math.round(parseFloat(c.fontSize)) + '/' + c.fontWeight + '/lh' + (Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100) + '/ls' + (c.letterSpacing === 'normal' ? 'n' : (parseFloat(c.letterSpacing) / parseFloat(c.fontSize)).toFixed(3)); };
  const heroStatement = document.querySelector('.category-hero-statement');
  const heroTagline = document.querySelector('.category-hero-tagline');
  const castEyebrow = document.querySelector('h1 span.block') || document.querySelector('h1 span');
  const castDisplay = document.querySelector('h1 span.apple-anim');
  const h2s = Array.from(document.querySelectorAll('main h2')).filter((e) => e.offsetWidth).map(st);
  const overflow = (() => { const d = document.documentElement; return d.scrollWidth > d.clientWidth + 1 ? d.scrollWidth + '>' + d.clientWidth : 'none'; })();
  return {
    vw: window.innerWidth,
    cast: document.querySelector('.cast-stage') ? { eyebrow: st(castEyebrow), display: st(castDisplay) } : null,
    category: document.querySelector('.category-hero-statement') ? { statement: st(heroStatement), tagline: st(heroTagline) } : null,
    h2s: h2s.slice(0, 4),
    overflow
  };
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = {};
for (const p of PAGES) {
  report[p.name] = {};
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(1500);
      report[p.name][w] = await page.evaluate(measure);
    } catch (e) { report[p.name][w] = { error: String(e).slice(0, 100) }; }
    await ctx.close();
  }
}
await browser.close();
await fs.writeFile(new URL('./hero-verify.json', import.meta.url), JSON.stringify(report, null, 1));
for (const [n, byVw] of Object.entries(report)) {
  console.log('==== ' + n);
  for (const [vw, d] of Object.entries(byVw)) {
    if (d.error) { console.log(vw + ' ERR ' + d.error); continue; }
    console.log('-- vw ' + vw + ' | overflow: ' + d.overflow);
    console.log('   cast: ' + JSON.stringify(d.cast));
    console.log('   cat : ' + JSON.stringify(d.category));
    console.log('   h2s : ' + JSON.stringify(d.h2s));
  }
}
