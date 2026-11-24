import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.LANDING_REVIEW_URL || 'http://127.0.0.1:5199';
const out = process.env.LANDING_EVIDENCE_DIR || fileURLToPath(new URL('../../../shots/apple-pass-2026-11-24/real-user/', import.meta.url));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const receipt = { base, screens: [] };

for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await page.route('**/api/auth/me*', route => route.fulfill({ status: 401, json: {} }));
  await page.goto(base);
  await page.locator('.home-hero h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  const dir = path.join(out, name);
  await mkdir(dir, { recursive: true });
  for (let i = 0, top = 0; top < docH; i++, top += height) {
    const y = Math.min(top, Math.max(0, docH - height));
    await page.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), y);
    await page.waitForTimeout(250);
    const view = await page.evaluate(() => {
      const nav = document.querySelector('[data-public-nav-bar]')?.getBoundingClientRect();
      const sections = [...document.querySelectorAll('main > section')].map(el => {
        const r = el.getBoundingClientRect();
        const h = el.querySelector('h1,h2,h3');
        const hr = h?.getBoundingClientRect();
        return {
          section: el.dataset.section,
          top: Math.round(r.top), bottom: Math.round(r.bottom),
          heading: h?.innerText.replace(/\s+/g, ' ').slice(0, 70) || null,
          headingTop: hr ? Math.round(hr.top) : null,
        };
      }).filter(s => s.bottom > 0 && s.top < innerHeight);
      return { scrollY: Math.round(scrollY), sections, navBottom: Math.round(nav?.bottom || 0) };
    });
    await page.screenshot({ path: path.join(dir, `screen-${String(i).padStart(2, '0')}.png`) });
    receipt.screens.push({ name, index: i, ...view });
    if (y === docH - height) break;
  }
  await page.close();
}
await browser.close();
await writeFile(path.join(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('screens', receipt.screens.length);
