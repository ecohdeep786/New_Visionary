/**
 * B2 census (FAP-47) — four instruments over the public landing surface:
 *   1) kickers: elements authored text-transform uppercase (the kicker voice)
 *   2) blue-in-headlines: descendant color/bg of h1/h2/h3 (flat blue vs accent-gradient)
 *   3) pVoices: p census with data-type + computed tier signatures (quote/caption pattern)
 *   4) doors: per section — does the module end with a next step (a next-step offender)?
 * One width (1440), settled, reducedMotion on. Writes b2-census.json.
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5187';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = ['/', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies'];

const SCRIPT = `(async () => {
  const settle = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 20; i++) if (document.querySelector('main, #main')) break; else await settle(150);
  await settle(1200);
  const root = document.querySelector('#main') || document.querySelector('main') || document;
  const pick = (el, ps) => { const s = getComputedStyle(el); return {
    fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing, lh: s.lineHeight,
    color: s.color, bg: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 160) : '',
    tt: s.textTransform
  }; };
  const txt = (el, n) => (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, n);

  // 1) uppercase kickers
  const kickers = [];
  for (const el of root.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.textTransform === 'uppercase' && txt(el, 1)) {
      kickers.push({ tag: el.tagName, text: txt(el, 46), cls: (el.getAttribute('class') || '').slice(0, 120), fs: s.fontSize, ls: s.letterSpacing, fw: s.fontWeight, color: s.color });
    }
  }

  // 2) blue inside headlines
  const isBlue = (c) => {
    const m = c.match(/rgba?\\((\\d+), (\\d+), (\\d+)/);
    if (!m) return false;
    const [, r, g, b] = m.map(Number);
    return b > r + 40 && b > g + 20;
  };
  const blueInHeads = [];
  for (const h of root.querySelectorAll('h1,h2,h3')) {
    for (const el of h.querySelectorAll('span,p,b,strong,em')) {
      const s = getComputedStyle(el);
      if (isBlue(s.color) || isBlue(s.backgroundImage) && /gradient/.test(s.backgroundImage)) {
        blueInHeads.push({ hTag: h.tagName, hText: txt(h, 40), tag: el.tagName, text: txt(el, 30), color: s.color, bg: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 120) : '' });
      }
    }
  }

  // 3) p voices (capped)
  const pVoices = [];
  const ps = [...root.querySelectorAll('p')].slice(0, 80);
  for (const el of ps) pVoices.push({ text: txt(el, 34), dt: el.getAttribute('data-type') || '', fs: getComputedStyle(el).fontSize });

  // 4) doors per section
  const doors = [];
  for (const sec of root.querySelectorAll('section')) {
    const links = sec.querySelectorAll('a[href],button');
    doors.push({ id: sec.getAttribute('data-section') || sec.id || '(anon)', tag: sec.className.split(' ').slice(0, 3).join(' ').slice(0, 40), linkCount: links.length, lastDoor: links.length ? txt(links[links.length - 1], 30) : '' });
  }
  return JSON.stringify({ kickers, blueInHeads, pVoices, doors });
})()`;

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const census = {};
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  let data = null;
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#main', { timeout: 24000 });
    await page.waitForTimeout(2500);
    data = JSON.parse(await page.evaluate(SCRIPT));
  } catch (e) {
    data = { error: String(e).slice(0, 120) };
  }
  await ctx.close();
  census[route === '/' ? 'home' : route.slice(1)] = {
    kickers: data.kickers || [],
    kickerCount: (data.kickers || []).length,
    blueInHeads: data.blueInHeads || [],
    blueCount: (data.blueInHeads || []).length,
    pVoices: data.pVoices || [],
    doors: data.doors || [],
    doorGaps: (data.doors || []).filter((d) => d.linkCount === 0).map((d) => d.id),
    ...(data.error ? { error: data.error } : {}),
  };
  console.log(`${route}: kickers=${census[route === '/' ? 'home' : route.slice(1)].kickerCount} blue+heads=${census[route === '/' ? 'home' : route.slice(1)].blueCount} doorGaps=${census[route === '/' ? 'home' : route.slice(1)].doorGaps.length}`);
}
await browser.close();
writeFileSync(path.join(OUT, 'b2-census.json'), JSON.stringify(census, null, 1));
console.log('WROTE b2-census.json');