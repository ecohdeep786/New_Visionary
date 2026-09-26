// Verifies both selectable AGI animations in the production bundle: Orb (default) and
// Voice bars (selected via preference), motion across frames, and the summon greeting.
const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const makeSeedSource = animation => `(() => {
  const user = { id: 'qa-view', email: 'qa-view@visionary.test', full_name: 'Qa Tester', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-view-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'qa-view-token');
  const wsId = 'qa-view:student';
  const db = { version: 2, people: [{ id: 'qa-view', email: 'qa-view@visionary.test', name: 'Qa Tester', ageBand: 'adult', roles: ['student'] }], workspaces: [{ id: wsId, personId: 'qa-view', role: 'student', name: 'Learner space', lastPath: '/dashboard/home' }], active: { 'qa-view': wsId }, relationships: [], data: { [wsId]: { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true, agiAnimation: '${animation}' }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-25' }, legacyImported: false } } };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
})();`;
for (const animation of ['boy', 'girl']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(makeSeedSource(animation));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto('http://localhost:4173/dashboard/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2200);
  const cls = await page.locator('.v-audio-orb-button').getAttribute('class');
  const pref = await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['qa-view:student'].preferences.agiAnimation);
  await page.screenshot({ path: `scripts-tmp/anim-${animation}-1.png`, clip: { x: 0, y: 640, width: 160, height: 260 } });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `scripts-tmp/anim-${animation}-2.png`, clip: { x: 0, y: 640, width: 160, height: 260 } });
  await page.locator('.v-audio-orb-button').click();
  await page.waitForTimeout(150);
  const caption = await page.locator('.v-audio-caption').textContent().catch(() => 'GONE');
  console.log(`${animation}: pref=${pref} shape=${cls.includes('v-audio-girl') ? 'girl-panel' : 'boy-sphere'} summon="${String(caption).trim().slice(0, 40)}" errors=${errors.length}`);
  await context.close();
}
await browser.close();
