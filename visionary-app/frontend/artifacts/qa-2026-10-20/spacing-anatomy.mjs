/* Reference spacing anatomy:
   A) education-initiative hero — the headline line stack (line boxes + gaps)
      and the stage's optical centre.
   B) Vision Pro hero — the CTA pair (pill height, padding, label size,
      gap between the pills, gap from tagline to CTA row). */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

/* A) education hero */
await page.goto('https://www.apple.com/in/education-initiative/', { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(2200);
const edu = await page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
  const lines = [];
  document.querySelectorAll('span, div, h1, p').forEach((e) => {
    if (!e.offsetWidth) return;
    const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const s = getComputedStyle(e);
    const f = parseFloat(s.fontSize);
    if (f < 40) return;
    const r = e.getBoundingClientRect();
    if (r.top > 1200) return;
    lines.push({ t: (e.textContent || '').trim().slice(0, 24), ...R(e), fs: Math.round(f), fw: s.fontWeight, lh: Math.round(parseFloat(s.lineHeight)), padB: s.paddingBottom, padT: s.paddingTop, mt: s.marginTop });
  });
  lines.sort((a, b) => a.y - b.y);
  const stage = document.querySelector('.headline-container');
  const sr = stage ? stage.getBoundingClientRect() : null;
  const caption = Array.from(document.querySelectorAll('a, p, div')).find((e) => (e.textContent || '').trim() === 'Enactus, Monterrey');
  const cr = caption ? caption.getBoundingClientRect() : null;
  return {
    navBottom: (() => { const n = document.querySelector('nav, header'); const r = n ? n.getBoundingClientRect() : null; return r ? Math.round(r.bottom) : null; })(),
    stage: sr ? R(stage) : null,
    lines,
    caption: cr ? { ...R(caption), fs: Math.round(parseFloat(getComputedStyle(caption).fontSize)) } : null
  };
});
console.log('EDU', JSON.stringify(edu, null, 1));

/* B) Vision Pro CTA pair */
await page.goto('https://www.apple.com/apple-vision-pro/', { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(2200);
const vp = await page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
  const acts = [];
  document.querySelectorAll('a, button').forEach((e) => {
    if (!e.offsetWidth) return;
    const t = (e.textContent || '').trim();
    if (!/^(Book a demo|Buy)$/.test(t)) return;
    const s = getComputedStyle(e);
    acts.push({ t, ...R(e), fs: Math.round(parseFloat(s.fontSize)), pad: s.padding, rad: s.borderRadius, bg: s.backgroundColor, border: s.borderTopWidth, gap: s.gap });
  });
  const tag = document.querySelector('[class*="typography-hero-tagline"]');
  const tr = tag ? tag.getBoundingClientRect() : null;
  const hero = document.querySelector('h1.hero-headline');
  const hr = hero ? hero.getBoundingClientRect() : null;
  return { actions: acts, tagline: tr ? R(tag) : null, wordmark: hr ? R(hero) : null };
});
console.log('VP', JSON.stringify(vp, null, 1));

await ctx.close();
await browser.close();
