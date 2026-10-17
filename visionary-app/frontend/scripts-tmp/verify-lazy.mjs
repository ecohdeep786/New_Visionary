/* Slow-scroll image verification: reveals whether lazy images genuinely
   load once each section is actually visited.
   Usage: node scripts-tmp/verify-lazy.mjs <path> <anchorSelector> */
import { chromium } from 'playwright-core';

const route = process.argv[2] || '/research';
const anchor = process.argv[3] || '#areas';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) failed.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', (r) => { if (!r.url().includes('/api/')) failed.push(`REQFAIL ${r.failure()?.errorText} ${r.url()}`); });

await page.goto(`http://localhost:5173${route}`, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(800);

// slow pass: scroll to the anchor, then in small steps to the bottom
await page.evaluate(async (sel) => {
  const target = document.querySelector(sel);
  if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  await new Promise((r) => setTimeout(r, 1500));
  const step = 300;
  for (let y = scrollY; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  await new Promise((r) => setTimeout(r, 1500));
}, anchor);

await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(1000);

const state = await page.evaluate(() => {
  const rows = [];
  document.querySelectorAll('#main img').forEach((el) => {
    const r = el.getBoundingClientRect();
    rows.push({
      ok: el.complete && el.naturalWidth > 0,
      complete: el.complete,
      nat: `${el.naturalWidth}x${el.naturalHeight}`,
      src: (el.currentSrc || el.src || '').split('/').pop().slice(0, 50),
      sec: el.closest('section')?.id || '-',
      view: r.top + scrollY,
    });
  });
  return rows;
});
const bad = state.filter((s) => !s.ok);
console.log(`imgs=${state.length} not-loaded=${bad.length}`);
bad.forEach((b) => console.log(`  ${b.src} nat=${b.nat} sec=${b.sec} y=${Math.round(b.view)}`));
console.log('--- failed (non-api) ---');
console.log(failed.slice(0, 20).join('\n') || '(none)');
await browser.close();
