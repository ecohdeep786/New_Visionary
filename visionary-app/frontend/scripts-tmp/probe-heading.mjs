/* Quick probe: computed styles + matching CSS for the student explore h2.
   Usage: node scripts-tmp/probe-heading.mjs <url> <selector-js>` */
import { chromium } from 'playwright-core';

const [url, sect] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });

const out = await page.evaluate((sectName) => {
  const el = document.querySelector(`[data-section="${sectName}"] h2`);
  if (!el) return { error: 'not found' };
  const cs = getComputedStyle(el);
  return {
    cls: el.className.toString(),
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    color: cs.color,
  };
}, sect);
console.log(JSON.stringify(out, null, 1));
await context.close();
await browser.close();
