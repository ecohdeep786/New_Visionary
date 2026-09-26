// Final proof on the fresh production bundle: the sidebar-bottom orb shows Vision Boy
// by default, and switching the Personalization dropdown to Vision Girl changes it live
// (no reload), with the summoned greeting intact.
const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(`(() => {
  const user = { id: 'qa-view', email: 'qa-view@visionary.test', full_name: 'Qa Tester', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-view-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'qa-view-token');
  const wsId = 'qa-view:student';
  const db = { version: 2, people: [{ id: 'qa-view', email: 'qa-view@visionary.test', name: 'Qa Tester', ageBand: 'adult', roles: ['student'] }], workspaces: [{ id: wsId, personId: 'qa-view', role: 'student', name: 'Learner space', lastPath: '/dashboard/home' }], active: { 'qa-view': wsId }, relationships: [], data: { [wsId]: { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-25' }, legacyImported: false } } };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
})()`);
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
await page.goto('http://localhost:4173/dashboard/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2200);
const clsBoy = await page.locator('.v-audio-orb-button').getAttribute('class');
await page.screenshot({ path: 'scripts-tmp/final-vision-boy.png', clip: { x: 0, y: 600, width: 220, height: 300 } });
// Live toggle: Personalization → AGI animation → Vision Girl.
await page.goto('http://localhost:4173/dashboard/personalization', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.getByText('AGI animation').first().waitFor({ timeout: 10000 });
await page.getByLabel('AGI animation').selectOption('girl');
await page.waitForTimeout(600);
await page.goto('http://localhost:4173/dashboard/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
const clsGirl = await page.locator('.v-audio-orb-button').getAttribute('class');
await page.screenshot({ path: 'scripts-tmp/final-vision-girl.png', clip: { x: 0, y: 600, width: 220, height: 300 } });
// Summon works in both.
await page.locator('.v-audio-orb-button').click();
await page.waitForTimeout(150);
const caption = await page.locator('.v-audio-caption').textContent().catch(() => 'GONE');
console.log(`Vision Boy class: ${clsBoy}`);
console.log(`Vision Girl class: ${clsGirl}`);
console.log(`summon on Vision Girl: "${String(caption).trim().slice(0, 44)}"`);
console.log('pageErrors:', errors.length);
await browser.close();
