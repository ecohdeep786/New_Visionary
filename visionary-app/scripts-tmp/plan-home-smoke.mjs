// One-off rendered smoke for the Daily Mentor Engine "Today's plan" module (internal Home).
// Observational only: enters demo scenarios through /dev/scenarios (dev server), checks the
// plan module renders from the app's own connected fixtures, with no page errors or overflow,
// and that an evidence-free learner gets no plan module. Safe to delete after review.
// Run: npm run dev, then `node scripts-tmp/plan-home-smoke.mjs`.
import { chromium } from 'playwright-core';

const BASE = process.env.VISIONARY_BASE || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const log = [];

async function openScenario(name) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto(`${BASE}/dev/scenarios`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  // The demo flow seeds connected fixtures during entry, after Home's first render;
  // one reload lets Home reflect them, as any revision change would in real use.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return { page, errors };
}

// 1. Connected learner (Aarav) → Today's plan module renders from real fixture evidence.
// Aarav's fixture classwork is already submitted (honestly no plan row), so publish one
// unsubmitted assignment in his enrolled demo class — the same seeding pattern as
// tests/role-mentor.test.mjs — to see the populated plan.
{
  const { page, errors } = await openScenario(/Aarav/);
  await page.evaluate(() => {
    const key = 'visionary_entity_Assignment';
    const rows = JSON.parse(localStorage.getItem(key) || '[]');
    rows.push({ id: 'smoke-plan-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-30' });
    localStorage.setItem(key, JSON.stringify(rows));
  });
  await page.reload({ waitUntil: 'networkidle' });
  // #home-daily-plan is the section heading; scope assertions to the whole section.
  const plan = page.locator('section[aria-labelledby="home-daily-plan"]');
  await plan.waitFor({ timeout: 8000 });
  await plan.getByText('Make a model').first().waitFor({ timeout: 8000 });
  const text = await plan.textContent();
  const primaryTitle = await page.locator('#next-step-title').textContent();
  if (!primaryTitle.includes('Make a model')) throw new Error(`Home priority diverged from today's plan: ${primaryTitle}`);
  log.push(`plan module: title=${text.includes('Today’s plan')} classwork=${text.includes('Make a model')} due=${text.includes('2026-09-30')}`);
  for (const viewport of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: viewport[0], height: viewport[1] });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    log.push(`learner @${viewport[0]}: overflow=${overflow} errors=${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
  }
  await page.screenshot({ path: 'scripts-tmp/plan-home-learner.png' });
  await page.close();
}

// 2. Learner with no recorded evidence → no plan module, Home still renders honestly.
{
  const { page, errors } = await openScenario(/Asha/);
  await page.waitForTimeout(800);
  const hasPlan = await page.locator('section[aria-labelledby="home-daily-plan"]').count();
  const mounted = await page.evaluate(() => document.querySelector('#root')?.children.length > 0);
  log.push(`empty learner: planModules=${hasPlan} mounted=${mounted} errors=${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
  await page.close();
}

await browser.close();
console.log(log.join('\n'));
