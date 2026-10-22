import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const VIEWPORTS = [[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]];
const TARGETS = [
  { name: 'apple-edu', url: 'https://www.apple.com/in/education-initiative/', kind: 'apple' },
  { name: 'apple-home', url: 'https://www.apple.com/', kind: 'apple' },
  { name: 'vz-home', url: 'http://127.0.0.1:5173/', kind: 'ours' },
  { name: 'vz-student', url: 'http://127.0.0.1:5173/student', kind: 'ours' },
  { name: 'vz-pricing', url: 'http://127.0.0.1:5173/pricing', kind: 'ours' },
  { name: 'vz-help', url: 'http://127.0.0.1:5173/help', kind: 'ours' }
];

const measureApple = () => `(() => {
  const style = (el) => { if (!el) return null; const s = getComputedStyle(el);
    return Math.round(parseFloat(s.fontSize)) + '/' + s.fontWeight + '/' + (Math.round(parseFloat(s.lineHeight)/parseFloat(s.fontSize)*100)/100) + '/' + (s.letterSpacing==='normal' ? 'n' : (parseFloat(s.letterSpacing)/parseFloat(s.fontSize)).toFixed(3)); };
  const first = (sel) => style(document.querySelector(sel));
  return {
    body: first('main p') || first('p'),
    heroHeadline: first('[class*="typography-hero-headline"]'),
    heroEyebrow: first('[class*="typography-hero-eyebrow"]'),
    sectionHeadline: first('[class*="typography-section-headline"]'),
    storyHeadline: first('[class*="typography-story-headline"]'),
    label: first('[class*="typography-label"]'),
    intro: first('[class*="typography-eyebrow-reduced"]'),
    tout: first('[class*="typography-tout"]'),
    caption: first('[class*="typography-figure-caption"]'),
    cardHeadline: first('h3'),
    navLink: first('#globalnav-unified-menu a') || first('nav a'),
    footerLink: first('footer a'),
    legal: first('footer p') || first('[class*="footnote"]'),
    docH: document.documentElement.scrollHeight
  };
})()`;

const measureOurs = () => `(() => {
  const style = (el) => { if (!el) return null; const s = getComputedStyle(el);
    return Math.round(parseFloat(s.fontSize)) + '/' + s.fontWeight + '/' + (Math.round(parseFloat(s.lineHeight)/parseFloat(s.fontSize)*100)/100) + '/' + (s.letterSpacing==='normal' ? 'n' : (parseFloat(s.letterSpacing)/parseFloat(s.fontSize)).toFixed(3)); };
  const first = (sel) => { const el = document.querySelector(sel); return style(el); };
  const paras = Array.from(document.querySelectorAll('main p')).filter(e => e.offsetWidth);
  const bigP = (() => { let max = 0; paras.forEach(p => { max = Math.max(max, parseFloat(getComputedStyle(p).fontSize)); }); return max ? Math.round(max) : null; })();
  const bodyP = (() => { const counts = {}; paras.forEach(p => { const f = Math.round(parseFloat(getComputedStyle(p).fontSize)); counts[f] = (counts[f]||0)+1; }); const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]; return top ? top[0] : null; })();
  let min = 99; document.querySelectorAll('main *').forEach(e => { if (e.offsetParent && (e.textContent||'').trim() && !e.children.length) { min = Math.min(min, parseFloat(getComputedStyle(e).fontSize)); } });
  return {
    bodyModePx: bodyP,
    bigPpx: bigP,
    h1: first('h1'),
    h2: first('h2'),
    h3: first('h3'),
    navLinkMin: (() => { const els = Array.from(document.querySelectorAll('header a, nav a')).filter(e => e.offsetWidth); if (!els.length) return null; let m = 999; els.forEach(e => m = Math.min(m, parseFloat(getComputedStyle(e).fontSize))); return Math.round(m) + 'px'; })(),
    footerLinkMin: (() => { const els = Array.from(document.querySelectorAll('footer a')).filter(e => e.offsetWidth); if (!els.length) return null; let m = 999; els.forEach(e => m = Math.min(m, parseFloat(getComputedStyle(e).fontSize))); const s = getComputedStyle(els[0]); return Math.round(m) + 'px/' + s.fontWeight; })(),
    smallTextPx: Math.round(min),
    button: first('a[class*="btn"], button[class*="btn"], a[class*="button"], [class*="cta"], [class*="pill"]'),
    docH: document.documentElement.scrollHeight
  };
})()`;

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = {};
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(40000);

for (const t of TARGETS) {
  report[t.name] = { url: t.url, kind: t.kind, by: {} };
  const fn = t.kind === 'apple' ? measureApple() : measureOurs();
  for (const v of VIEWPORTS) {
    try {
      await page.setViewportSize({ width: v[0], height: v[1] });
      await page.goto(t.url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(t.kind === 'apple' ? 1800 : 800);
      report[t.name].by[v[0]] = await page.evaluate(fn);
      console.log(t.name, v[0], 'ok');
    } catch (e) { report[t.name].by[v[0]] = { error: String(e).slice(0, 90) }; console.log(t.name, v[0], 'FAIL'); }
  }
}
await ctx.close();
await browser.close();
await fs.writeFile('artifacts/qa-2026-10-20/type-matrix.json', JSON.stringify(report, null, 2));
console.log('saved');
