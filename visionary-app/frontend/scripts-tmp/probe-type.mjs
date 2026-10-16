/* Type-law probe: for each route, find
   - uppercase kickers (computed size/transform)
   - any element with computed font-size below 14px (floor law)
   - off-ladder sizes outside the canonical ladder
   Usage: node scripts-tmp/probe-type.mjs [outFile] */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const outFile = process.argv[2] || 'artifacts/research/remaining-pages-audit-2026-10-16/dom/_type.txt';

const ROUTES = [
  ['how-it-works', '/how-it-works'], ['pricing', '/pricing'], ['download', '/download'],
  ['about', '/about'], ['careers', '/careers'], ['research', '/research'],
  ['community', '/community'], ['contact', '/contact'], ['partners', '/partners'],
  ['updates', '/updates'], ['referral', '/referral'], ['safety', '/safety'],
  ['privacy', '/privacy'], ['security', '/security'], ['terms', '/terms'],
  ['accessibility', '/accessibility'], ['cookies', '/cookies'],
];

const LADDER = new Set([12, 14, 16, 17, 18, 21, 24, 28, 32, 40, 48, 56, 60, 64, 68, 72, 76, 80, 88, 96, 112, 140]);

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const lines = [];

for (const [slug, route] of ROUTES) {
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const step = Math.max(500, Math.floor(innerHeight * 0.9));
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  const data = await page.evaluate((ladderArr) => {
    const ladder = new Set(ladderArr);
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    const kickers = [];
    document.querySelectorAll('#main p.uppercase, #main span.uppercase, #main div.uppercase, #main label.uppercase').forEach((el) => {
      if (kickers.length < 6) kickers.push({ t: txt(el), fs: cs(el, 'font-size'), tt: cs(el, 'text-transform'), ls: cs(el, 'letter-spacing'), fw: cs(el, 'font-weight') });
    });
    const small = [];
    document.querySelectorAll('#main *').forEach((el) => {
      if (!el.textContent || el.children.length > 0 && !el.matches('p, span, a, button, label, h1, h2, h3, h4, li, div')) return;
      const fs = parseFloat(cs(el, 'font-size'));
      const hasDirectText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasDirectText) return;
      if (fs < 14 && small.length < 25) small.push({ fs: `${fs}px`, tag: el.tagName.toLowerCase(), t: txt(el) });
      if (!ladder.has(Math.round(fs)) && fs >= 14 && small.length < 60) {
        // record off-ladder only once per size+tag combo
        const key = `${fs}-${el.tagName}`;
        if (!small.some((s) => s.key === key)) small.push({ key, fs: `${fs}px`, tag: el.tagName.toLowerCase(), t: txt(el) });
      }
    });
    return { kickers, small };
  }, [...LADDER]);

  lines.push(`══ ${slug}`);
  lines.push(`  kickers: ${data.kickers.map((k) => `${k.fs}/${k.tt}/${k.fw} "${k.t}"`).join(' · ') || '(none)'}`);
  lines.push(`  small/off-ladder: ${data.small.map((s) => `${s.fs} <${s.tag}> "${s.t}"`).join(' | ') || '(none)'}`);
}

await fs.writeFile(outFile, lines.join('\n'));
console.log(lines.join('\n'));
await browser.close();
