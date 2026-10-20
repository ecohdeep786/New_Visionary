/* Landing-hero anatomy — dump the geometry of the education-initiative hero
   and our landing hero so spacing/breath can be compared numerically. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const TARGETS = [
  { name: 'apple', url: 'https://www.apple.com/in/education-initiative/' },
  { name: 'ours', url: 'http://127.0.0.1:4188/' }
];
const VIEWS = [[1440, 900], [390, 844]];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = {};

for (const t of TARGETS) {
  report[t.name] = {};
  for (const [w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    try {
      await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(2200);
      const m = await page.evaluate(() => {
        const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
        const st = (e) => { const s = getComputedStyle(e); return { fs: Math.round(parseFloat(s.fontSize)), fw: s.fontWeight, lh: s.lineHeight, pad: s.padding, margin: s.margin, gap: s.gap }; };
        /* biggest text element in the first viewport = the hero statement */
        let hero = null; let best = 0;
        document.querySelectorAll('h1, h2, span, p, div').forEach((e) => {
          if (!e.offsetWidth || !(e.textContent || '').trim()) return;
          const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!own) return;
          const f = parseFloat(getComputedStyle(e).fontSize);
          const r = e.getBoundingClientRect();
          if (r.top < 0 || r.top > 1100) return;
          if (f > best) { best = f; hero = e; }
        });
        const out = { hero: null, heroBox: null, links: [], section: null, stack: [] };
        if (hero) {
          out.hero = { tag: hero.tagName.toLowerCase(), text: (hero.textContent || '').trim().slice(0, 60), fs: best, ...st(hero) };
          /* climb to the section-like ancestor and report its box + padding */
          let sec = hero;
          for (let i = 0; i < 8 && sec.parentElement; i += 1) {
            sec = sec.parentElement;
            const s = getComputedStyle(sec);
            if (parseFloat(s.paddingTop) > 0 || sec.tagName === 'SECTION') break;
          }
          out.section = { tag: sec.tagName.toLowerCase(), cls: String(sec.className).slice(0, 80), ...R(sec), ...st(sec) };
          /* every visible link in the hero band (from hero top to +520px) */
          document.querySelectorAll('a, button').forEach((a) => {
            const r = a.getBoundingClientRect();
            if (!a.offsetWidth || r.top < Math.max(0, out.section.y) - 40 || r.top > Math.min(1400, out.section.y + 900)) return;
            const s = getComputedStyle(a);
            if (s.visibility === 'hidden') return;
            out.links.push({ text: (a.textContent || '').trim().slice(0, 34), ...R(a), fs: Math.round(parseFloat(s.fontSize)), fw: s.fontWeight, pad: s.padding, radius: s.borderRadius, bg: s.backgroundColor, border: s.borderTopWidth, gap: s.gap });
          });
          /* vertical stack of text blocks under the statement */
          document.querySelectorAll('p, a, span').forEach((e) => {
            if (!e.offsetWidth) return;
            const r = e.getBoundingClientRect();
            if (r.top < out.hero.y || r.top > out.hero.y + 700) return;
            const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
            if (!own) return;
            const s = getComputedStyle(e);
            out.stack.push({ tag: e.tagName.toLowerCase(), text: (e.textContent || '').trim().slice(0, 40), ...R(e), fs: Math.round(parseFloat(s.fontSize)), fw: s.fontWeight, mt: s.marginTop, mb: s.marginBottom });
          });
          out.stack.sort((a, b) => a.y - b.y);
          out.heroBox = R(hero);
        }
        return out;
      });
      report[t.name][w] = m;
      console.log(`--- ${t.name} ${w} ---`);
      console.log('hero', JSON.stringify(m.hero));
      console.log('heroBox', JSON.stringify(m.heroBox));
      console.log('section', JSON.stringify(m.section && { tag: m.section.tag, cls: m.section.cls, y: m.section.y, h: m.section.h, b: m.section.b, pad: m.section.pad }));
      console.log('links', JSON.stringify(m.links.slice(0, 8)));
      console.log('stack', JSON.stringify(m.stack.slice(0, 10)));
    } catch (e) {
      console.log(t.name, w, 'ERR', String(e).slice(0, 100));
    }
    await ctx.close();
  }
}
await browser.close();
await fs.writeFile(new URL('./hero-anatomy.json', import.meta.url), JSON.stringify(report, null, 2));
