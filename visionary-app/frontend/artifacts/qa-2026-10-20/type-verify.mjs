/* FAP-34 acceptance probe — measures the retiered public typography against
   the Apple ladder (spec §3) at 390/768/1440 on the worktree dev server. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:4188';
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'student', path: '/student' },
  { name: 'pricing', path: '/pricing' },
  { name: 'help', path: '/help' },
  { name: 'security', path: '/security' },
];
const VIEWPORTS = [[390, 844], [768, 1024], [1440, 900]];

const measure = () => `(() => {
  const style = (el) => { if (!el || !el.offsetWidth) return null; const s = getComputedStyle(el);
    return Math.round(parseFloat(s.fontSize)) + '/' + s.fontWeight + '/' + (Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100) + '/' + (s.letterSpacing === 'normal' ? 'n' : (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)).toFixed(3)); };
  const vis = (sel) => Array.from(document.querySelectorAll(sel)).find(e => e.offsetWidth && (e.textContent || '').trim());
  const biggest = (sel) => { let best = null, bf = 0; document.querySelectorAll(sel).forEach(e => { if (e.offsetWidth && (e.textContent || '').trim()) { const f = parseFloat(getComputedStyle(e).fontSize); if (f > bf) { bf = f; best = e; } } }); return best; };
  const h1 = vis('h1');
  const heroEl = biggest('h1, section[data-section] h2');
  const navLink = vis('nav a, header a');
  const footerLink = vis('footer a');
  const bodyP = (() => { const ps = Array.from(document.querySelectorAll('main p')).filter(e => e.offsetWidth && e.children.length === 0 && (e.textContent || '').trim().length > 40); const c = {}; ps.forEach(p => { const f = Math.round(parseFloat(getComputedStyle(p).fontSize)); c[f] = (c[f] || 0) + 1; }); const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? top[0] : null; })();
  let minPx = 99; document.querySelectorAll('main *').forEach(e => { if (e.offsetParent && (e.textContent || '').trim() && !e.children.length) minPx = Math.min(minPx, parseFloat(getComputedStyle(e).fontSize)); });
  return {
    h1: style(h1),
    heroDisplay: style(heroEl),
    h2: style(vis('main h2')),
    h3: style(vis('main h3')),
    bodyMode: bodyP,
    nav: style(navLink),
    footer: style(footerLink),
    smallest: Math.round(minPx),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth - document.documentElement.clientWidth : 0,
    docH: document.documentElement.scrollHeight
  };
})()`;

const SPEC = {
  390: { heroDisplay: 64, h2: 40, h3: 28, bodyMode: 17, nav: 12 },
  768: { heroDisplay: 96, h2: 56, h3: 40, bodyMode: 17, nav: 12 },
  1440: { heroDisplay: 140, h2: 64, h3: [40, 48], bodyMode: 17, nav: 12 },
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const report = {};
let pass = 0, fail = 0;
for (const t of PAGES) {
  report[t.name] = {};
  for (const v of VIEWPORTS) {
    try {
      await page.setViewportSize({ width: v[0], height: v[1] });
      await page.goto(BASE + t.path, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(900);
      const m = await page.evaluate(measure());
      report[t.name][v[0]] = m;
      if (t.name !== 'home' && t.name !== 'student' && v[0] !== 1440) { /* matrix spots */ }
      const spec = SPEC[v[0]];
      if (m.heroDisplay) {
        const size = parseFloat(m.heroDisplay);
        const ok = Math.abs(size - spec.heroDisplay) <= 1;
        if (ok) pass++; else fail++;
        report[t.name][v[0]].heroPass = ok ? 'PASS' : `FAIL(${size}!=${spec.heroDisplay})`;
      } else { report[t.name][v[0]].heroPass = 'no-hero-display'; }
      if (t.name === 'home') {
        const shot = `artifacts/qa-2026-10-20/verify-${t.name}-${v[0]}.jpeg`;
        await page.screenshot({ path: shot, type: 'jpeg', quality: 70 });
        report[t.name][v[0]].shot = shot;
      }
      console.log(t.name, v[0], 'hero:', m.heroDisplay, report[t.name][v[0]].heroPass);
    } catch (e) {
      report[t.name][v[0]] = { error: String(e).slice(0, 100) };
      console.log(t.name, v[0], 'ERR', String(e).slice(0, 60));
    }
  }
}
await ctx.close();
await browser.close();
await fs.writeFile('artifacts/qa-2026-10-20/type-verify.json', JSON.stringify(report, null, 2));
console.log(`PASS ${pass} / FAIL ${fail} — saved artifacts/qa-2026-10-20/type-verify.json`);
