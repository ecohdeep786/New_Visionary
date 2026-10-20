/* FAP-34 acceptance probe v3 — hero pairing + role-aware ladder conformance.
   Hero checks stay exact against the two Apple references; all other text is
   checked against the ladder (membership + caps) instead of one flat size,
   because h2/h3 carry different roles (label 21–24, card 28–40, section 40–64,
   story 40–48). Nav is judged by the MODE of menu links (not the brand link). */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:4188';
const PAGES = [
  { name: 'home', path: '/', hero: 'landing' },
  { name: 'student', path: '/student', hero: 'category' },
  { name: 'teacher', path: '/teacher', hero: 'category' },
  { name: 'pricing', path: '/pricing', hero: 'cap' },
  { name: 'help', path: '/help', hero: 'cap' },
  { name: 'security', path: '/security', hero: 'cap' },
  { name: 'about', path: '/about', hero: 'cap' }
];
const VIEWPORTS = [[390, 844], [768, 1024], [1440, 900]];
const LADDER = { 390: [12, 17, 19, 21, 24, 28, 32, 40], 768: [12, 17, 19, 21, 24, 28, 32, 40, 48, 56], 1440: [12, 14, 17, 19, 21, 24, 28, 32, 40, 48, 56, 64] };

const measure = () => `(() => {
  const style = (el) => { if (!el || !el.offsetWidth) return null; const s = getComputedStyle(el);
    return Math.round(parseFloat(s.fontSize)) + '/' + s.fontWeight + '/' + (Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100) + '/' + (s.letterSpacing === 'normal' ? 'n' : (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)).toFixed(3)); };
  const vis = (sel) => Array.from(document.querySelectorAll(sel)).find(e => e.offsetWidth && (e.textContent || '').trim());
  const biggest = (sel) => { let best = null, bf = 0; document.querySelectorAll(sel).forEach(e => { if (!e.offsetWidth || !(e.textContent || '').trim()) return; let f = parseFloat(getComputedStyle(e).fontSize); e.querySelectorAll('span').forEach(s => { f = Math.max(f, parseFloat(getComputedStyle(s).fontSize)); }); if (f > bf) { bf = f; best = e; } }); return best ? bf : 0; };
  const mode = (arr) => { const c = {}; arr.forEach(f => { const k = Math.round(f); c[k] = (c[k] || 0) + 1; }); const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? Number(top[0]) : null; };
  const navFs = Array.from(document.querySelectorAll('header a, nav a')).filter(e => {
    if (!e.offsetWidth) return false;
    const cls = String(e.className);
    if (cls.indexOf('sr-only') >= 0 || cls.indexOf('shrink-0') >= 0) return false;
    if (e.closest('nav[aria-label="Breadcrumb"]')) return false;
    if (e.getAttribute('role') === 'button' || cls.indexOf('white') >= 0 || cls.indexOf('h-10') >= 0) return false;
    return (e.textContent || '').trim().length > 2;
  }).map(e => parseFloat(getComputedStyle(e).fontSize));
  const bodyFs = Array.from(document.querySelectorAll('main p')).filter(e => e.offsetWidth && e.children.length === 0 && (e.textContent || '').trim().length > 40).map(e => parseFloat(getComputedStyle(e).fontSize));
  let maxMain = 0;
  document.querySelectorAll('main *').forEach(e => {
    if (!e.offsetWidth || e.children.length || e.closest('[aria-hidden="true"]')) return;
    if ((e.textContent || '').trim().length < 2) return;
    maxMain = Math.max(maxMain, parseFloat(getComputedStyle(e).fontSize));
  });
  const h2 = vis('main h2');
  return {
    heroPx: biggest('h1, section[data-section] h2'),
    h2: h2 ? style(h2) : null,
    h3: style(vis('main h3')),
    navMode: navFs.length >= 2 ? mode(navFs) : null,
    bodyMode: mode(bodyFs),
    maxMain: Math.round(maxMain),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth - document.documentElement.clientWidth : 0
  };
})()`;

const SPEC = {
  390: { landing: 64, category: 40, cap: 40, nav: 12, body: 17 },
  768: { landing: 96, category: 56, cap: 56, nav: 12, body: 17 },
  1440: { landing: 140, category: 64, cap: 64, nav: 12, body: 17 }
};

const near = (v, t) => Math.abs(v - t) <= 1;
const num = (s) => (s ? parseFloat(s) : null);

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const report = {};
const results = [];
for (const t of PAGES) {
  report[t.name] = {};
  for (const v of VIEWPORTS) {
    try {
      await page.setViewportSize({ width: v[0], height: v[1] });
      await page.goto(BASE + t.path, { waitUntil: 'load', timeout: 45000 });
      await page.waitForSelector('main h1', { timeout: 20000 }).catch(() => {});
      await page.waitForFunction(() => { const h = document.querySelector('main h1'); return h && (h.textContent || '').trim().length > 3; }, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(700);
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      const m = await page.evaluate(measure());
      const spec = SPEC[v[0]];
      const checks = [];
      const add = (label, ok, got) => checks.push({ label, ok, got });
      if (t.hero === 'landing' || t.hero === 'category') add('hero', near(m.heroPx, spec[t.hero]), m.heroPx);
      else add('hero<=cap', m.heroPx <= spec.cap + 1, m.heroPx);
      add('maxText<=cap', m.maxMain <= (t.hero === 'landing' ? spec.landing : spec.cap) + 1, m.maxMain);
      if (m.h2) add('h2-on-ladder', LADDER[v[0]].some((x) => near(num(m.h2), x)), m.h2);
      if (m.h3) add('h3-on-ladder', LADDER[v[0]].some((x) => near(num(m.h3), x)), m.h3);
      if (m.navMode) add('nav', near(m.navMode, spec.nav), m.navMode);
      if (m.bodyMode) add('body', near(m.bodyMode, spec.body), m.bodyMode);
      add('overflow', m.overflow === 0, m.overflow);
      report[t.name][v[0]] = { ...m, checks };
      for (const c of checks) results.push({ page: t.name, vw: v[0], check: c.label, ok: c.ok, got: c.got });
      console.log(t.name.padEnd(8), String(v[0]).padStart(4), checks.map((c) => (c.ok ? 'PASS' : 'FAIL(' + c.label + ':' + c.got + ')')).join(' '));
    } catch (e) {
      report[t.name][v[0]] = { error: String(e).slice(0, 120) };
      console.log(t.name, v[0], 'ERR', String(e).slice(0, 70));
    }
  }
}
await ctx.close();
await browser.close();
await fs.writeFile(new URL('./type-verify.json', import.meta.url), JSON.stringify(report, null, 2));
const fails = results.filter((r) => !r.ok);
console.log(`\nCHECKS ${results.length} — PASS ${results.length - fails.length} / FAIL ${fails.length}`);
for (const f of fails) console.log('  FAIL', f.page, f.vw, f.check, f.got);
