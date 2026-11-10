/**
 * B2 typography bank.
 *  - `node b2-bank.mjs before` : scan all uppercase/tier-class riders, body-wide.
 *  - `node b2-bank.mjs after`  : re-locate every `before` bank site (tag|text
 *    buckets in DOM order) and measure the same elements, so rows align 1:1
 *    with b2-bank-before.json regardless of class renames.
 * Writes b2-bank-<tag>.json with computed fs/fw/ls/lh/tt/color per site.
 */
import { chromium } from 'playwright-core';
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5188';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const TAG = process.argv[2] || 'before';
const ROUTES = ['/', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies'];

const BEFORE_TARGETS = JSON.parse(readFileSync(path.join(OUT, 'b2-bank-before.json'), 'utf8'));

const makeScript = (routeKey) => {
  const targets = TAG === 'before' ? null : (BEFORE_TARGETS[routeKey] || []).map((r) => ({ tag: r.tag, text: r.text }));
  return `(async (targets) => {
  const settle = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 24; i++) if (document.querySelector('main')) break; else await settle(200);
  await settle(1400);
  const main = document.querySelector('#main') || document.querySelector('main');
  const txt = (el) => (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 36);
  const pathOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n !== document.body && parts.length < 4) {
      const sec = n.getAttribute && n.getAttribute('data-section');
      const cls = (n.getAttribute && n.getAttribute('class') || '').split(' ').filter((c) => /^(apple-eyebrow|tracking-|text-\\[1|font-)/.test(c)).slice(0, 4).join('.');
      parts.unshift(n.tagName + (sec ? '[' + sec + ']' : '') + (cls ? '.' + cls : ''));
      n = n.parentElement;
    }
    return parts.join(' > ').slice(0, 200);
  };
  const measure = (el) => {
    if (!el) return { missing: true };
    const s = getComputedStyle(el);
    const cls = el.getAttribute('class') || '';
    return {
      tag: el.tagName,
      text: txt(el),
      cls: cls.replace(/\\s+/g, ' ').slice(0, 140),
      fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing, lh: s.lineHeight,
      tt: s.textTransform, color: s.color,
      dt: el.getAttribute('data-type') || '',
      path: pathOf(el),
      inMain: !!(main && main.contains(el)),
    };
  };
  if (!targets) {
    const cands = document.body.querySelectorAll('[class*="uppercase"], [class*="text-[15px]"], [class*="text-[16.5px]"], [class*="text-[14.5px]"], [class*="text-[17.5px]"]');
    return JSON.stringify([...cands].map((el) => {
      const cls = el.getAttribute('class') || '';
      if (!(cls.includes('uppercase') || ['text-[15px]', 'text-[16.5px]', 'text-[14.5px]', 'text-[17.5px]'].some((k) => cls.includes(k)))) return null;
      return measure(el);
    }).filter(Boolean));
  }
  const cands = document.body.querySelectorAll('[class*="uppercase"], [class*="apple-eyebrow"], [data-type="label"], [class*="text-[16px]"], [class*="text-[14px]"], [class*="text-[17px]"]');
  return JSON.stringify([...cands].map((el) => measure(el)));
})(${JSON.stringify(targets)})`;
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const bank = {};
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  let rows = null;
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('main, #main', { timeout: 30000 });
    await page.waitForTimeout(2200);
    rows = await page.evaluate(makeScript(route === '/' ? 'home' : route.slice(1))).then((r) => JSON.parse(r));
  } catch (e) {
    rows = [{ error: String(e).slice(0, 100) }];
  }
  await ctx.close();
  bank[route === '/' ? 'home' : route.slice(1)] = rows;
  console.log(`${route}: ${rows.length} sites`);
}
await browser.close();
const outFile = TAG === 'after' ? 'b2-dump-after.json' : `b2-bank-${TAG}.json`;
writeFileSync(path.join(OUT, outFile), JSON.stringify(bank, null, 1));
console.log(`WROTE ${outFile}`);
