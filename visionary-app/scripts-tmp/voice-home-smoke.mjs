// One-off rendered smoke for the Voice Mentor dock (internal shell).
// Observational: enters a demo scenario on the dev server, checks the dock, the Ask
// dictation button, the personalization off-switch, states, errors, and overflow.
// Run: npm run dev, then `node scripts-tmp/voice-home-smoke.mjs`.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const log = [];
const errors = [];
const track = page => page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
// The dev server occasionally aborts a navigation under load; retry instead of failing the smoke.
async function goto(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); return; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
}

// 1. Dock renders on Home with honest idle copy.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Aarav/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const dock = page.locator('.v-voice-dock');
  const dockPresent = await dock.count();
  if (dockPresent) {
    const readState = async () => {
      const pill = dock.locator('.v-voice-state');
      if (await pill.count()) return (await pill.textContent()).trim();
      return (await dock.locator('.v-voice-card').textContent()).trim().slice(0, 90);
    };
    const status = await readState();
    const orb = dock.getByRole('button', { name: 'Start voice conversation' });
    log.push(`dock: present=true idleStatus="${status}" orb=${await orb.count()}`);
    // 2. Tap the orb → honest state (the headless browser denies the fake mic).
    await orb.click();
    await page.waitForTimeout(1500);
    const pressed = await orb.getAttribute('aria-pressed');
    log.push(`after tap: aria-pressed=${pressed} status="${await readState()}"`);
    // Stop again and leave the session quiet.
    await orb.click();
    await page.waitForTimeout(600);
    log.push(`after stop: status="${await readState()}"`);
  } else {
    log.push('dock: present=false (speech recognition unavailable in this headless browser)');
  }
  for (const viewport of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: viewport[0], height: viewport[1] });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    log.push(`home @${viewport[0]}: overflow=${overflow}`);
  }
  await page.screenshot({ path: 'scripts-tmp/voice-home.png' });
  await page.close();
}

// 3. Ask page: dictation button beside send.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Asha/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await goto(page, `${BASE}/dashboard/ask`);
  // Guide is lazy-loaded behind DashboardHome; wait for the composer rather than guessing timing.
  await page.getByText('Message Visionary Guide').first().waitFor({ timeout: 15000 });
  const dictate = page.getByRole('button', { name: 'Dictate with your voice' });
  await dictate.waitFor({ timeout: 10000 });
  log.push(`ask: dictateButton=${await dictate.count()} overflow=${await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)}`);
  await page.close();
}

// 4. Personalization off-switch removes the dock entirely.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Asha/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await goto(page, `${BASE}/dashboard/personalization`);
  await page.waitForTimeout(800);
  const checkbox = page.getByRole('checkbox', { name: /Voice mentor/ });
  log.push(`personalization: voiceToggle=${await checkbox.count()} checked=${await checkbox.isChecked()}`);
  await checkbox.uncheck();
  await page.waitForTimeout(600);
  await goto(page, `${BASE}/dashboard/home`);
  await page.waitForTimeout(800);
  log.push(`voice off: dockCount=${await page.locator('.v-voice-dock').count()}`);
  await page.close();
}

await browser.close();
console.log(log.join('\n'));
console.log(`pageErrors: ${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
