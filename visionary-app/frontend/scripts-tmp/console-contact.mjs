/* /contact interaction + console check: tab switching, FAQ expand, mailto hrefs, errors. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 160)}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 160)}`));

await page.goto('http://localhost:5173/contact', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(800);

const before = await page.textContent('#resources h2');

await page.getByRole('tab', { name: 'Teachers' }).click();
await page.waitForTimeout(500);
const after = await page.textContent('#resources h2');
const tabsSel = await page.getAttribute('[role="tab"][aria-selected="true"]', 'aria-selected');

await page.getByRole('button', { name: /How quickly will I get a reply/ }).click().catch(() => {});
await page.waitForTimeout(400);
const faqExpanded = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#faq button')].find((x) => /How quickly/.test(x.textContent));
  return b ? b.getAttribute('aria-expanded') : 'not-found';
});

const mailtos = await page.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')).slice(0, 8));

console.log(JSON.stringify({
  headingBefore: before.trim(),
  headingAfter: after.trim(),
  headingChanged: before.trim() !== after.trim(),
  activeTabSelected: tabsSel,
  faqExpanded,
  mailtoCount: mailtos.length,
  mailtoSample: mailtos[0],
  errors,
}, null, 1));
await browser.close();
