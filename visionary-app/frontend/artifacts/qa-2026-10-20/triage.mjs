/* FAP-34 probe triage — identify the exact elements behind nav/oversize flags. */
import { chromium } from 'playwright-core';

const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:4188';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const probe = async (path, vw, vh, kind) => {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1400);
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  const out = await page.evaluate((kind) => {
    const res = { nav: [], big: [] };
    if (kind === 'nav') {
      for (const e of document.querySelectorAll('header a, nav a')) {
        if (!e.offsetWidth) continue;
        const t = (e.textContent || '').trim();
        if (t.length <= 2) continue;
        const s = getComputedStyle(e);
        res.nav.push({ t: t.slice(0, 26), fs: s.fontSize, fw: s.fontWeight, cls: String(e.className).slice(0, 50), parent: String(e.parentElement && e.parentElement.className).slice(0, 40) });
      }
    } else {
      for (const e of document.querySelectorAll('main *')) {
        if (!e.offsetWidth || e.children.length) continue;
        const t = (e.textContent || '').trim();
        if (!t) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize);
        if (fs >= 65) res.big.push({ t: t.slice(0, 40), fs: Math.round(fs), tag: e.tagName, cls: String(e.className).slice(0, 60), parent: String(e.parentElement && e.parentElement.className).slice(0, 40) });
      }
      res.big = res.big.slice(0, 10);
    }
    return res;
  }, kind);
  await ctx.close();
  return out;
};

console.log('== about 88px text (1440) ==');
console.log(JSON.stringify(await probe('/about', 1440, 900, 'big'), null, 1));
console.log('== student nav (390) ==');
console.log(JSON.stringify(await probe('/student', 390, 844, 'nav'), null, 1));
console.log('== pricing nav (390) ==');
console.log(JSON.stringify(await probe('/pricing', 390, 844, 'nav'), null, 1));
console.log('== help nav (390) ==');
console.log(JSON.stringify(await probe('/help', 390, 844, 'nav'), null, 1));
await browser.close();
