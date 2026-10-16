/* Console + interaction check for /partners: carousel controls, FAQ expand-all,
   scroll pass; reports console errors and overflow. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:5173/partners', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(1200);

await page.click('button[aria-label="Next slide"]').catch(() => {});
await page.waitForTimeout(350);
await page.click('button[aria-label="Go to slide 3"]').catch(() => {});
await page.waitForTimeout(350);
const slideTitle = await page.evaluate(() => document.querySelector('[role="group"]:not([aria-hidden="true"]) h3')?.textContent?.trim());
await page.click('button[aria-label="Previous slide"]').catch(() => {});
await page.waitForTimeout(350);
const slideTitleBack = await page.evaluate(() => document.querySelector('[role="group"]:not([aria-hidden="true"]) h3')?.textContent?.trim());

await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.82));
await page.waitForTimeout(600);
const expand = page.locator('button', { hasText: 'Expand all' }).first();
let expanded = false;
if (await expand.count()) { await expand.click().catch(() => {}); expanded = true; await page.waitForTimeout(400); }

const out = await page.evaluate(() => ({
  docH: document.documentElement.scrollHeight,
  overX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
console.log(JSON.stringify({ slideTitle, slideTitleBack, expanded, ...out, errors }, null, 1));
await browser.close();
