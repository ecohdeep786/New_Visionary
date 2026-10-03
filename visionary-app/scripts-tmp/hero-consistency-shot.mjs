import { chromium } from 'playwright-core';

/* Hero consistency capture: landing + the four persona/org heroes.
   Usage: node scripts-tmp/hero-consistency-shot.mjs <outdir> [w h] */
const out = process.argv[2] || 'scripts-tmp/hero-shots';
const w = Number(process.argv[3] || 1440);
const h = Number(process.argv[4] || 900);
const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:5173';
const routes = [
  ['landing', '/'],
  ['student', '/student'],
  ['teacher', '/teacher'],
  ['professional', '/professional'],
  ['organization', '/organization'],
  ['parent', '/parent'],
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

for (const [name, path] of routes) {
  await page.goto(`${base}${path}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2600); // let the hero entrance settle
  await page.screenshot({ path: `${out}/${name}-${w}.png` });
  console.log(`shot ${name} ${w}`);
}
if (errors.length) console.log('PAGEERRORS:', JSON.stringify(errors));
await browser.close();
