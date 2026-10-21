/** A4 receipt audit + spot-check: full truth table + hydration-settled re-probe at 1440/390. */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || '5184';

/* 1) full truth table from the completed scan */
const r = JSON.parse(readFileSync(path.join(DIR, 'a4-burndown-receipt.json'), 'utf8'));
const table = {};
for (const [key, routes] of Object.entries(r.counts)) {
  const t = { 1440: [], 1024: [], 390: [] };
  for (const [slug, w] of Object.entries(routes)) {
    for (const width of [1440, 1024, 390]) {
      const v = w[String(width)];
      if (typeof v === 'number' && v > 0) t[width].push(`${slug}:${v}`);
    }
  }
  table[key] = t;
}
writeFileSync(path.join(DIR, 'a4-truth-table.json'), JSON.stringify(table, null, 1));
for (const [key, t] of Object.entries(table)) {
  console.log(`\n${key}\n  1440: ${t[1440].join(' ') || '∅'}\n  1024: ${t[1024].join(' ') || '∅'}\n  390:  ${t[390].join(' ') || '∅'}`);
}

/* 2) hydration-settled spot-check at 1440 + 390 — the decisive question */
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const spot = {};
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  for (const route of ['/about', '/download', '/how-it-works', '/student']) {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('main h1, main h2, main p', { timeout: 12000 });
    await page.waitForTimeout(1200);
    spot[`${route}@${width}`] = await page.evaluate(() => {
      const q = (s) => document.querySelectorAll(s).length;
      return {
        h1t48: q('h1[class*="text-[48px]"]'),
        t13: q('[class*="text-[13px]"]'),
        clampedAny: q('[class*="clamp("]'),
        roundedArb: q('[class*="rounded-["]'),
        uppercaseP: q('main p.uppercase'),
        h1Text: (document.querySelector('main h1') || {}).innerText?.slice(0, 30) || '(none)',
        mainNodes: document.querySelectorAll('main *').length,
      };
    });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(path.join(DIR, 'a4-spot-check.json'), JSON.stringify(spot, null, 1));
console.log('\nSPOT-CHECK (hydration-settled)');
for (const [k, v] of Object.entries(spot)) console.log(`${k}: ${JSON.stringify(v)}`);
