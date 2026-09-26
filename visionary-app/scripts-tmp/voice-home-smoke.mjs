// One-off rendered smoke for the AGI audio presence line (internal shell).
// Checks: thin top line present with no assistant icon/button; honest availability
// status; Ask session audio control; Settings "Audio Interaction" switch; overflow
// and page errors. Run: npm run dev, then `node scripts-tmp/voice-home-smoke.mjs`.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const log = [];
const errors = [];
const track = page => page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
async function goto(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); return; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
}

// 1. Home: presence ring lives on the search pill; the old top line is gone; no assistant icon remains.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Aarav/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const anchor = page.locator('.v-audio-anchor');
  await anchor.waitFor({ timeout: 8000 });
  const ring = anchor.locator('.v-audio-ring');
  const searchHost = await page.getByRole('button', { name: 'Search your workspace' }).locator('xpath=ancestor::div[contains(@class,"v-audio-anchor")]').count();
  const oldTopLine = await page.locator('.v-audio-line').count();
  const orbCount = await page.locator('.v-voice-orb, .v-voice-dock').count();
  const status = (await anchor.locator('[role="status"]').textContent()).trim();
  log.push(`home: anchor=${await anchor.count()} ring=${await ring.count()} ringOnSearch=${searchHost} oldTopLine=${oldTopLine} oldDock=${orbCount}`);
  log.push(`home status: "${status.slice(0, 110)}"`);
  for (const viewport of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: viewport[0], height: viewport[1] });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    log.push(`home @${viewport[0]}: overflow=${overflow}`);
  }
  await page.screenshot({ path: 'scripts-tmp/audio-presence-home.png' });
  await page.close();
}

// 2. Ask: session audio quick control works and reflects its state.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Asha/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await goto(page, `${BASE}/dashboard/ask`);
  await page.getByText('Message Visionary Guide').first().waitFor({ timeout: 15000 });
  const audio = page.getByRole('button', { name: /Audio interaction for this session/ });
  await audio.waitFor({ timeout: 10000 });
  const dictate = await page.getByRole('button', { name: 'Dictate with your voice' }).count();
  log.push(`ask: dictateButton=${dictate} overflow=${await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)}`);
  // 2b. Mentor turn with audio ON (default): evidence-based reply, no speak failures.
  await page.locator('#guide-input').fill('What should I do today?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('From your saved records', { exact: false }).first().waitFor({ timeout: 10000 });
  const mentorStatus = await page.getByText('From your saved records', { exact: false }).count();
  const mentorActions = await page.locator('.guide-messages').getByRole('button', { name: /Open/ }).count();
  const errorPanel = await page.locator('.v-error').count();
  log.push(`mentor turn (audio on): replies=${mentorStatus} actionButtons=${mentorActions} errorPanel=${errorPanel}`);
  await page.screenshot({ path: 'scripts-tmp/mentor-turn.png' });
  // 2c. The session quick control still silences audio for this session.
  await audio.click();
  await page.waitForTimeout(400);
  const after = await audio.getAttribute('aria-pressed');
  log.push(`ask: sessionAudio →${after}`);
  await page.screenshot({ path: 'scripts-tmp/audio-presence-ask.png' });
  await page.close();
}

// 3. Settings: Audio Interaction option; off removes active-listening suggestion.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Asha/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await goto(page, `${BASE}/dashboard/personalization`);
  await page.getByText('Language and accessibility').first().waitFor({ timeout: 15000 });
  const checkbox = page.getByRole('checkbox', { name: /Audio Interaction/ });
  await checkbox.waitFor({ timeout: 10000 });
  const checked = await checkbox.isChecked();
  const toggleCount = await checkbox.count();
  await checkbox.uncheck();
  await page.waitForTimeout(500);
  await goto(page, `${BASE}/dashboard/home`);
  await page.waitForTimeout(1000);
  const status = (await page.locator('.v-audio-anchor [role="status"]').textContent()).trim();
  log.push(`settings: audioToggle=${toggleCount} defaultChecked=${checked}`);
  log.push(`audio off status: "${status.slice(0, 110)}"`);
  await page.screenshot({ path: 'scripts-tmp/audio-presence-off.png' });
  await page.close();
}

await browser.close();
console.log(log.join('\n'));
console.log(`pageErrors: ${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
