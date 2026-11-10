/* Hero word-fit verification — hovers every audience link so the rotating
   line renders each persona word, then checks (a) the word holds one line,
   (b) it never exceeds the copy column, (c) the composition does not move
   between words, (d) the mask keeps a constant line box. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = process.env.OUT_DIR || 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\2\\opencode\\hero-wordfit';
await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const report = {};
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900], [1724, 1172]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4188/', { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => { const el = document.querySelector('main h1'); return el && (el.textContent || '').includes('One intelligence'); }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  const rail = page.locator('nav[aria-label="Audiences"] a');
  const n = await rail.count();
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    await rail.nth(i).hover();
    await page.waitForTimeout(320);
    const m = await page.evaluate(() => {
      const mask = document.querySelector('main h1 .overflow-hidden');
      const word = mask ? mask.querySelector('span') : null;
      const copy = document.querySelector('.cast-copy');
      if (!word || !mask || !copy) return null;
      const wr = word.getBoundingClientRect();
      const mr = mask.getBoundingClientRect();
      const available = Math.min(980, copy.clientWidth);
      const h1 = document.querySelector('main h1').getBoundingClientRect();
      const s = getComputedStyle(word);
      return {
        text: (word.textContent || '').trim(),
        fontSize: Math.round(parseFloat(s.fontSize)),
        lineHeight: s.lineHeight,
        textWidth: Math.round(word.scrollWidth),
        available: Math.round(available),
        wordBoxH: Math.round(wr.height),
        maskH: Math.round(mr.height),
        maskTop: Math.round(mr.top),
        h1Top: Math.round(h1.top),
        h1Bottom: Math.round(h1.bottom),
        oneLine: wr.height <= parseFloat(s.fontSize) * 1.25,
        fits: word.scrollWidth <= available + 1,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    rows.push(m);
  }
  report[w] = rows;
  if (w === 1440 || w === 390) {
    await rail.nth(0).hover();
    await page.waitForTimeout(320);
    await page.screenshot({ path: path.join(OUT, 'students-' + w + '.png') });
    const orgIndex = rows.findIndex((r) => r && r.text.toLowerCase().includes('organizations'));
    if (orgIndex >= 0) {
      await rail.nth(orgIndex).hover();
      await page.waitForTimeout(320);
      await page.screenshot({ path: path.join(OUT, 'organizations-' + w + '.png') });
    }
  }
  console.log('=== ' + w + ' ===');
  for (const r of rows) console.log(r ? `${r.text.padEnd(16)} fs ${String(r.fontSize).padStart(3)}  text ${String(r.textWidth).padStart(4)}/${r.available}  oneLine ${r.oneLine}  fits ${r.fits}  h1Top ${r.h1Top}  overflow ${r.overflow}` : 'null');
  await ctx.close();
}
await browser.close();
