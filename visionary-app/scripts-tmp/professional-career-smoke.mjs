// Fictional local scenario only. No model answer, real hiring assessment, or network backend.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(`${base}/dev/scenarios`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Sam/ }).first().click();
  await page.waitForURL('**/dashboard/home');
  await page.goto(`${base}/dashboard/career`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Your next capability' }).waitFor();
  await page.getByRole('link', { name: 'Set a career goal' }).waitFor();
  if (await page.getByRole('link', { name: 'Join a class' }).count()) throw new Error('Professional toolbar used school vocabulary.');
  await page.getByLabel('Capability or role target').fill('Data-informed decisions');
  await page.getByLabel('What would useful progress look like?').fill('Create a fictional report with limitations.');
  await page.getByRole('button', { name: 'Save direction' }).click();
  await page.getByText('Career target saved on this device.').waitFor();

  await page.goto(`${base}/dashboard/learn`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Try authored workplace sample' }).click();
  await page.getByText('1 authored sample activity').waitFor();
  await page.getByRole('button', { name: /Turn data into a decision/ }).first().click();
  await page.getByRole('button', { name: /Start Turn data into a decision/ }).click();
  await page.getByRole('button', { name: 'Start this learning unit' }).click();
  await page.getByRole('button', { name: 'Check my understanding' }).click();
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Continue practice' }).click();
  await page.getByRole('radio').nth(2).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Apply this in Build' }).click();
  await page.getByRole('link', { name: 'Open your project' }).click();
  await page.getByLabel('Your working document').fill('Fictional task totals were 20, 30 and 25. Mean 25. Three weeks cannot establish a cause.');
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await page.getByLabel('Project status').selectOption('completed');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Application evidence recorded').waitFor();

  await page.goto(`${base}/dashboard/career`, { waitUntil: 'networkidle' });
  await page.getByLabel('Connect to a capability you started').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Save direction' }).click();
  await page.getByText('2/2 recorded checks').waitFor();
  await page.getByText('Write an evidence-based report').first().waitFor();
  await page.screenshot({ path: 'scripts-tmp/professional-career-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: 'scripts-tmp/professional-career-mobile.png', fullPage: true });
  if (overflow > 1 || errors.length) throw new Error(JSON.stringify({ overflow, errors }));
  console.log('Professional goal → authored capability → checks → private portfolio → linked career view; desktop/mobile no page error or overflow.');
} finally { await browser.close(); }
