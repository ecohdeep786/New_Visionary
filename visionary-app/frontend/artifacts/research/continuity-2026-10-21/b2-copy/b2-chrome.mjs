/**
 * B2 chrome census — uppercase + blue in headline elements OUTSIDE #main
 * (nav chrome, values strip, footer, banners). Full-body scope per route.
 * Writes b2-chrome.json.
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
  await settle(1600);
  const main = document.querySelector('#main') || document.querySelector('main') || document.body;
  const txt = (el, n) => (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, n);
  const isBlue = (c) => { const m = c.match(/rgba?\\((\\d+), (\\d+), (\\d+)/); if (!m) return false; const r = +m[1], g = +m[2], b = +m[3]; return b > r + 40 && b > g + 20; };
  const kickers = [];
  const blues = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (main.contains(el)) continue;
    const s = getComputedStyle(el);
    const hasText = txt(el, 1);
    if (!hasText) continue;
    if (s.textTransform === 'uppercase') kickers.push({ tag: el.tagName, text: txt(el, 46), cls: (el.getAttribute('class') || '').slice(0, 120), fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing });
    if (['H1','H2','H3','H4'].includes(el.tagName) || el.closest('h1,h2,h3,h4')) {
      const el2 = el.closest('h1,h2,h3,h4');
      if ((isBlue(s.color) || (isBlue(s.backgroundImage) && /gradient/.test(s.backgroundImage))) && el !== el2) blues.push({ hTag: el2.tagName, hText: txt(el2, 40), tag: el.tagName, text: txt(el, 30), color: s.color, bg: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 110) : '' });
    }
  }
  return JSON.stringify({ kickers, blues });
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
    blues: data.blues || [],
    ...(data.error ? { error: data.error } : {}),
  };
  console.log(`${route}: chromeKickers=${(data.kickers || []).length} chromeBlues=${(data.blues || []).length}${data.error ? ' ERROR ' + String(data.error).slice(0, 60) : ''}`);
}
await browser.close();
writeFileSync(path.join(OUT, 'b2-chrome.json'), JSON.stringify(census, null, 1));
console.log('WROTE b2-chrome.json');
