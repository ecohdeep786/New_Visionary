// Verifies: (1) AGI presence ring visible without mic grant (ready breathing),
// (2) sidebar bold active icon, (3) onboarding Enter-to-continue, (4) illustration
// aspect ratios. Run: npm run dev, then `node scripts-tmp/fix-verify.mjs`.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const log = [];
const errors = [];
const track = page => page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
async function goto(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); return; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
}

// 1. Presence ring without mic grant: breathing "ready" state, two frames prove motion.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Aarav/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await page.waitForTimeout(1800);
  const status = (await page.locator('.v-audio-anchor [role="status"]').textContent()).trim();
  await page.screenshot({ path: 'scripts-tmp/presence-ready-1.png', clip: { x: 300, y: 0, width: 840, height: 66 } });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scripts-tmp/presence-ready-2.png', clip: { x: 300, y: 0, width: 840, height: 66 } });
  log.push(`presence: status="${status}"`);
  // 2. Sidebar: bold active icon.
  await page.screenshot({ path: 'scripts-tmp/sidebar-bold.png', clip: { x: 0, y: 0, width: 264, height: 300 } });
  await context.close();
}

// 3+4. Onboarding: illustrations + Enter-to-continue (fresh local account, seeded session).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const user = { id: 'qa-onboard', email: 'qa-onboard@visionary.test', full_name: '', identity: 'student', onboarding_complete: false };
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-token-1', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
    localStorage.setItem('visionary_session_token', 'qa-token-1');
  });
  const page = await context.newPage();
  track(page);
  await goto(page, `${BASE}/onboarding`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts-tmp/onboarding-identity.png', fullPage: false });
  // Identity: select the Learner card and click Continue.
  await page.getByRole('button', { name: /I am a Learner/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(900);
  const step1 = await page.getByText(/Step 1 of/).count();
  log.push(`onboarding: reachedStep1=${step1 > 0}`);
  // The founder's case: focus in a text field, press Enter → the page must continue.
  const nameInput = page.locator('input:visible').first();
  await nameInput.waitFor({ timeout: 8000 });
  await nameInput.fill('Qa Tester');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  const step2 = await page.getByText(/Step 2 of/).count();
  log.push(`onboarding: enterAdvancesToStep2=${step2 > 0}`);
  await page.screenshot({ path: 'scripts-tmp/onboarding-step.png', fullPage: false });
  await context.close();
}

await browser.close();
console.log(log.join('\n'));
console.log(`pageErrors: ${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
