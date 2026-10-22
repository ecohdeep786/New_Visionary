/**
 * C2/FAP-50 capture sweep — the full onboarding journey photographed at
 * 1440 / 768 / 390. Same seeded preview walk as c2-probes.mjs; writes
 * c2-<stage>-<width>.png beside this script.
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'http://localhost:5192';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });

await page.goto(`${ORIGIN}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-font-surface="product"]');
await page.evaluate(() => {
  const user = { id: 'c2-probe-user', email: 'c2-onboarding-probe@fixture.invalid', full_name: 'C2 Probe', identity: null, onboarding_complete: false, getting_started_complete: false, preferred_language: 'English', created_at: new Date().toISOString() };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'c2-probe-token', userId: user.id, email: user.email, expiresAt: Date.now() + 7200000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'c2-probe-token');
});

const clickButton = async label => {
  await page.waitForFunction(l => [...document.querySelectorAll('button')].some(element => (element.textContent || '').trim() === l && !element.disabled), label, {});
  await page.evaluate(l => [...document.querySelectorAll('button')].find(element => (element.textContent || '').trim() === l && !element.disabled).click(), label);
};

const reseed = async () => {
  await page.goto(`${ORIGIN}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-font-surface="product"]');
  await page.evaluate(() => {
    const user = { id: 'c2-probe-user', email: 'c2-onboarding-probe@fixture.invalid', full_name: 'C2 Probe', identity: null, onboarding_complete: false, getting_started_complete: false, preferred_language: 'English', created_at: new Date().toISOString() };
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'c2-probe-token', userId: user.id, email: user.email, expiresAt: Date.now() + 7200000, createdAt: Date.now() }]));
    localStorage.setItem('visionary_session_token', 'c2-probe-token');
  });
};

const capture = async (stage, width) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `c2-${stage}-${width}.png`) });
  console.log(`captured c2-${stage}-${width}.png`);
};

for (const width of [1440, 768, 390]) {
  await page.setViewportSize({ width, height: Math.max(760, Math.round(width * 0.72)) });
  await reseed();
  await page.goto(`${ORIGIN}/onboarding`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-font-surface="product"]', { timeout: 30000 });
  await page.waitForTimeout(600);

  // identity — the role choice
  await page.click('button[aria-pressed]:has-text("I am a Learner")');
  await page.waitForTimeout(350);
  await capture('identity', width);

  await clickButton('Continue');
  await page.waitForSelector('section[aria-labelledby="onboarding-title"] input[type="text"]', { timeout: 30000 });
  await page.evaluate(() => {
    const input = document.querySelector('section[aria-labelledby="onboarding-title"] input[type="text"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'C2 Probe');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.selectOption('section[aria-labelledby="onboarding-title"] select', 'adult');
  await page.waitForTimeout(300);
  await capture('about', width);

  await clickButton('Continue');
  await page.waitForSelector('button[aria-pressed]:has-text("School")', { timeout: 30000 });
  await page.click('button[aria-pressed]:has-text("School")');
  await page.waitForTimeout(350);
  await capture('focus', width);

  await clickButton('Continue');
  await page.waitForSelector('section[aria-labelledby="onboarding-title"] select', { timeout: 30000 });
  await page.evaluate(() => {
    for (const select of document.querySelectorAll('section[aria-labelledby="onboarding-title"] select')) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      const option = select.options[1];
      if (option) { setter.call(select, option.value); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  await page.waitForTimeout(350);
  await capture('context', width);

  await clickButton('Continue');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => (element.textContent || '').trim() === 'Start using Visionary'), null, { timeout: 30000 });
  await page.waitForTimeout(350);
  await capture('review', width);

  await clickButton('Start using Visionary');
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), null, { timeout: 30000 });
  let opened = false;
  for (let attempt = 0; attempt < 2 && !opened; attempt++) {
    opened = await page.waitForSelector('[role="dialog"]', { timeout: 20000 }).then(() => true).catch(() => false);
    if (!opened) { await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1200); }
  }
  if (!opened) throw new Error('GettingStarted dialog did not open after onboarding finished');
  await page.waitForTimeout(700);
  await capture('getting-started', width);
}

await browser.close();
console.log('C2 capture sweep complete.');
