import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
 const errors = [];
 page.on('pageerror', error => errors.push(String(error)));
 await page.goto('http://localhost:5183/dev/scenarios', { waitUntil: 'networkidle' });
 await page.getByRole('button', { name: /Asha/ }).first().click();
 await page.waitForURL('**/dashboard/home');
 await page.goto('http://localhost:5183/dashboard/privacy', { waitUntil: 'networkidle' });
 await page.getByRole('button', { name: 'Review local data' }).click();
 const preview = page.getByRole('region', { name: 'What is saved on this device' });
 await preview.getByText('5 personal workspaces found').waitFor();
 assert.match(await preview.textContent(), /does not upload, merge, or remove anything/);
 for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${width}px viewport overflowed by ${overflow}px`);
 }
 assert.deepEqual(errors, []);
 console.log('Privacy local-data preview: 5 owned roles, honest no-transfer copy, no page errors or overflow at 1440/390.');
} finally { await browser.close(); }
