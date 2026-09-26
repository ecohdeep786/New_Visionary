import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(`${base}/dev/scenarios`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Anika/ }).first().click();
  await page.waitForURL('**/dashboard/home');
  await page.goto(`${base}/dashboard/reports?child=not-connected`, { waitUntil: 'networkidle' });
  await page.getByRole('alert').getByRole('heading', { name: 'This report is no longer shared' }).waitFor();
  if (await page.getByRole('heading', { name: /Aarav|Maya/ }).count()) throw new Error('A forged report link fell back to another child.');
  await page.getByRole('combobox', { name: /Child/ }).selectOption('demo-bengali');
  await page.getByRole('heading', { name: 'Maya' }).waitFor();
  if (!page.url().includes('child=demo-bengali')) throw new Error('Child switch did not update the deep link.');
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1 || errors.length) throw new Error(JSON.stringify({ overflow, errors }));
  console.log('Forged parent report fails closed; authorized child switch updates URL; desktop/mobile no page errors or overflow.');
} finally { await browser.close(); }
