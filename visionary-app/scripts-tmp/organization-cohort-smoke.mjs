import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(`${base}/dev/scenarios`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /School administrator/ }).first().click();
  await page.waitForURL('**/dashboard/home');
  await page.goto(`${base}/dashboard/cohorts`, { waitUntil: 'networkidle' });
  await page.getByText(/accepted members/).first().waitFor();
  await page.getByRole('button', { name: 'Create cohort' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill('Reasoning group');
  await dialog.getByLabel('Purpose and curriculum objectives').fill('Practice explaining ideas clearly.');
  const member = dialog.getByRole('group', { name: 'Connected people' }).getByRole('checkbox').first();
  const memberLabel = await member.locator('..').innerText();
  await member.check();
  await dialog.getByRole('group', { name: 'Linked classes' }).getByRole('checkbox').first().check();
  await dialog.getByRole('button', { name: 'Save cohort' }).click();
  await page.getByText('1 connected members · 1 linked classes').waitFor();
  await page.evaluate(label => {
    const email = label.split(' · ')[0];
    const key = 'visionary_entity_OrganizationInvite';
    const roster = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(roster.map(item => item.email === email ? { ...item, status: 'removed' } : item)));
  }, memberLabel);
  await page.getByRole('button', { name: 'Refresh roster' }).click();
  await page.getByRole('button', { name: /Reasoning group/ }).click();
  await dialog.getByText('no longer connected — remove to save').waitFor();
  await dialog.getByText('no longer connected — remove to save').click();
  await dialog.getByText('no longer connected — remove to save').waitFor({ state: 'detached' });
  await dialog.getByRole('button', { name: 'Save cohort' }).click();
  await page.getByText('0 connected members · 1 linked classes').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1 || errors.length) throw new Error(JSON.stringify({ overflow, errors }));
  console.log('Organization cohort uses accepted roster and linked class; revoked member can be removed; desktop/mobile no page errors or overflow.');
} finally { await browser.close(); }
