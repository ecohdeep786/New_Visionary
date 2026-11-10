/* FAP-34 hero calibration: dump the hero anatomy (every visible leaf text
   element in the top ~2800px) for the two Apple references the founder named
   (education-initiative = main landing hero, apple-vision-pro = all category
   heroes) plus our own heroes, at matched viewports. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const VIEWPORTS = [[390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const TARGETS = [
  { name: 'apple-edu', url: 'https://www.apple.com/in/education-initiative/' },
  { name: 'apple-vision-pro', url: 'https://www.apple.com/apple-vision-pro/' },
  { name: 'vz-home', url: 'http://127.0.0.1:4188/' },
  { name: 'vz-student', url: 'http://127.0.0.1:4188/student' }
];

const dump = () => {
  const st = (el) => { const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    return {
      fs: Math.round(parseFloat(c.fontSize)),
      fw: c.fontWeight,
      lh: Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100,
      ls: c.letterSpacing === 'normal' ? 'n' : (parseFloat(c.letterSpacing) / parseFloat(c.fontSize)).toFixed(4),
      w: Math.round(r.width),
      top: Math.round(r.top)
    }; };
  const out = [];
  const seen = new Set();
  const walk = (root) => {
    for (const e of root.querySelectorAll('h1,h2,h3,h4,p,a,span,li,button,div[class*="headline"],div[class*="eyebrow"]')) {
      const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || r.top < -20 || r.top > 2800) continue;
      const c = st(e);
      const key = e.tagName + '|' + c.fs + '|' + (e.textContent || '').trim().slice(0, 24);
      if (seen.has(key)) continue;
      seen.add(key);
      let cls = ''; try { cls = String(e.className).split(' ').filter(Boolean).slice(0, 3).join(' ').slice(0, 64); } catch {}
      out.push({ tag: e.tagName.toLowerCase(), ...c, cls, txt: (e.textContent || '').trim().slice(0, 46) });
    }
  };
  const main = document.querySelector('main') || document.body;
  walk(main);
  // Apple ground truth: their own type roles, wherever they sit near the top
  const roles = [];
  for (const e of document.querySelectorAll('[class*="typography-"]')) {
    const r = e.getBoundingClientRect();
    if (!r.width || r.top > 3200) continue;
    const c = st(e);
    roles.push({ cls: String(e.className).split(' ').filter((x) => x.startsWith('typography')).join(' ').slice(0, 56), ...c, txt: (e.textContent || '').trim().slice(0, 40) });
    if (roles.length > 14) break;
  }
  return { vw: window.innerWidth, docH: document.documentElement.scrollHeight, leaves: out.slice(0, 46), roles };
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = {};
for (const t of TARGETS) {
  report[t.name] = {};
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    try {
      await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(1800);
      report[t.name][w] = await page.evaluate(dump);
    } catch (e) {
      report[t.name][w] = { error: String(e).slice(0, 120) };
    }
    await ctx.close();
  }
}
await browser.close();
await fs.writeFile(new URL('./hero-measure.json', import.meta.url), JSON.stringify(report, null, 1));
// compact console table
for (const [name, byVw] of Object.entries(report)) {
  console.log('==== ' + name + ' ====');
  for (const [vw, d] of Object.entries(byVw)) {
    if (d.error) { console.log(vw + ' ERROR ' + d.error); continue; }
    console.log('-- vw ' + vw + ' docH ' + d.docH);
    for (const l of d.leaves.slice(0, 14)) {
      console.log('  ' + l.tag.padEnd(6) + String(l.fs).padStart(4) + '/' + l.fw + '/lh' + l.lh + '/ls' + l.ls + '  ' + l.txt.slice(0, 38));
    }
  }
}
