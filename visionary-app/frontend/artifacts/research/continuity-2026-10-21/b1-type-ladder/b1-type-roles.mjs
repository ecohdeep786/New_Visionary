/**
 * B1 rendered role gate — for each landing route/width:
 *   1. count section h1/h2/h3 WITHOUT data-type           (must be 0)
 *   2. count elements still carrying bridge-retag classes (must be 0)
 *   3. report residual body-law retag singles             (B2 residue, informational)
 *   4. report the data-type role distribution             (receipt)
 * Writes b1-type-roles.json.
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5186';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization'];
const WIDTHS = [1440, 1024, 390];

const RETAG = [
  'text-[clamp(36px,5vw,72px)]', 'text-[clamp(34px,5vw,72px)]', 'text-[clamp(40px,4.5vw,72px)]',
  'text-[clamp(30px,3.8vw,56px)]', 'text-[clamp(26px,3.4vw,48px)]', 'text-[clamp(40px,5.55vw,80px)]',
  'text-[clamp(28px,2.78vw,40px)]', 'text-[clamp(28px,2.9vw,40px)]', 'text-[clamp(28px,2.9vw,42px)]',
  'text-[clamp(28px,3.6vw,42px)]', 'text-[clamp(28px,3.6vw,46px)]', 'text-[clamp(30px,4vw,46px)]',
  'text-[clamp(26px,3.4vw,38px)]', 'text-[clamp(32px,3.3vw,44px)]', 'text-[clamp(24px,3vw,34px)]',
  'text-[clamp(24px,2.78vw,40px)]', 'text-[clamp(20px,2vw,26px)]', 'text-[clamp(20px,2vw,28px)]',
  'text-[30px]', 'text-[32px]', 'text-[34px]', 'text-[36px]', 'text-[38px]', 'text-[40px]',
  'text-[42px]', 'text-[44px]', 'text-[46px]', 'text-[52px]', 'text-[56px]',
  'text-[13px]',
];
const BODY_RESIDUE = ['text-[15px]', 'text-[16.5px]', 'text-[14.5px]', 'text-[17px]', 'text-[17.5px]'];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const dump = {};
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('main', { timeout: 12000 });
      await page.waitForTimeout(1400);
      const res = await page.evaluate((lists) => {
        const heads = [...document.querySelectorAll('main section h1, main section h2, main section h3')];
        const unroled = heads.filter(h => !h.getAttribute('data-type')).map(h => `${h.tagName.toLowerCase()}·${(h.innerText || '').trim().slice(0, 26)}`);
        const count = (cls) => document.querySelectorAll('.' + CSS.escape(cls)).length;
        const retagHits = {};
        for (const cls of lists.retag) { const n = count(cls); if (n) retagHits[cls] = n; }
        const residueHits = {};
        for (const cls of lists.residue) { const n = count(cls); if (n) residueHits[cls] = n; }
        const roles = {};
        for (const h of heads) { const r = h.getAttribute('data-type') || '—'; roles[r] = (roles[r] || 0) + 1; }
        return {
          sections: document.querySelectorAll('main section[data-section]').length,
          headedHeadings: heads.length,
          unroled,
          unroledCount: unroled.length,
          retagHits,
          residueHits,
          roles,
        };
      }, { retag: RETAG, residue: BODY_RESIDUE });
      dump[`${slug}@${width}`] = res;
      console.log(`${slug}@${width}: unroled=${res.unroledCount} retagHits=${Object.values(res.retagHits).reduce((a, b) => a + b, 0)} residue=${Object.values(res.residueHits).reduce((a, b) => a + b, 0)} roles=${Object.entries(res.roles).map(([k, v]) => k + '×' + v).join(' ')}`);
    } catch (e) {
      dump[`${slug}@${width}`] = { error: String(e).slice(0, 80) };
      console.log(`ERR ${slug}@${width}: ${String(e).slice(0, 60)}`);
    }
  }
  await ctx.close();
}
await browser.close();
writeFileSync(path.join(OUT, 'b1-type-roles.json'), JSON.stringify(dump, null, 1));
console.log('WROTE b1-type-roles.json');
