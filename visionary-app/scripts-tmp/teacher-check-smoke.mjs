// Internal QA: reviewed teacher question -> published classwork -> learner draft.
// Uses only fictional /dev/scenarios accounts. Set VISIONARY_BASE for another port.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const enter = async name => {
  await page.goto(`${base}/dev/scenarios`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  await page.waitForURL('**/dashboard/home');
};

try {
  await enter('Dev');
  await page.goto(`${base}/dashboard/prepare`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'New lesson' }).click();
  const editor = page.getByRole('dialog').first();
  await editor.getByLabel('Title').fill('Smoke: explain volume');
  await editor.getByLabel('Outline and notes').fill('Use unit cubes to explain length × width × height.');
  await editor.getByRole('button', { name: 'Add question' }).click();
  await editor.getByRole('textbox', { name: 'Question 1', exact: true }).fill('Why do all three dimensions matter?');
  await editor.getByLabel('Status').selectOption('reviewed');
  await editor.getByRole('button', { name: 'Save draft' }).click();
  await page.getByRole('button', { name: /Smoke: explain volume/ }).first().click();
  await page.getByRole('button', { name: 'Assign reviewed lesson' }).click();
  const assign = page.getByRole('dialog').last();
  await assign.getByLabel('Class').selectOption({ index: 1 });
  await assign.getByRole('button', { name: 'Confirm assignment' }).click();
  await page.getByText('Assigned. A reviewed copy is now available').first().waitFor();

  await enter('Aarav');
  await page.goto(`${base}/dashboard/classes?class=demo-class-cube`, { waitUntil: 'networkidle' });
  await page.getByText('Smoke: explain volume').first().waitFor();
  const answer = page.getByLabel('1. Why do all three dimensions matter?');
  await answer.fill('The layers, rows and columns determine the count of unit cubes.');
  await page.reload({ waitUntil: 'networkidle' });
  const restored = await page.getByLabel('1. Why do all three dimensions matter?').inputValue();
  if (!restored.includes('layers, rows and columns')) throw new Error('Learner draft did not survive refresh.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Submit' }).last().click();
  await page.getByText('Submitted — waiting for your teacher to review.').first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (errors.length || overflow > 1) throw new Error(JSON.stringify({ errors, overflow }));
  console.log('Teacher question published; learner draft survived refresh; mobile submission recorded; no page error or overflow.');
} finally {
  await browser.close();
}
