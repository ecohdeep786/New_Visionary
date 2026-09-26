// Verifies the PRODUCTION bundle (vite preview :4173): orb inside the search pill at
// desktop + mobile, sidebar solid active icon. Seeds a local session to reach /dashboard.
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const log = [];
const errors = [];
const seed = () => {
  const user = { id: 'qa-view', email: 'qa-view@visionary.test', full_name: 'Qa Tester', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-view-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'qa-view-token');
  const wsId = 'qa-view:student';
  const db = {
    version: 2,
    people: [{ id: 'qa-view', email: user.email, name: 'Qa Tester', ageBand: 'adult', roles: ['student'], learningContext: { board: 'CBSE', classLevel: '7', subjects: ['Mathematics'] } }],
    workspaces: [{ id: wsId, personId: 'qa-view', role: 'student', name: 'Learner space', lastPath: '/dashboard/home' }],
    active: { 'qa-view': wsId },
    relationships: [],
    data: { [wsId]: { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-25' }, legacyImported: false } },
  };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
};
for (const viewport of [[1440, 900], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] } });
  await context.addInitScript(seed);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(`${BASE}/dashboard/home`, { waitUntil: 'networkidle', timeout: 30000 }); break; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
  await page.waitForTimeout(1800);
  const anchor = page.locator('.v-audio-anchor');
  const orbBox = await page.locator('.v-audio-orb').boundingBox();
  const pillBox = await page.locator('[aria-label="Search your workspace"]').boundingBox();
  const inside = orbBox && pillBox && orbBox.x + orbBox.width <= pillBox.x + pillBox.width + 2 && orbBox.x >= pillBox.x;
  log.push(`@${viewport[0]}: orb=${await page.locator('.v-audio-orb').count()} insidePill=${inside} orbX=${orbBox && Math.round(orbBox.x)} pillX=${pillBox && Math.round(pillBox.x)} pillW=${pillBox && Math.round(pillBox.width)}`);
  await page.screenshot({ path: `scripts-tmp/prod-home-${viewport[0]}.png`, clip: { x: 0, y: 0, width: viewport[0], height: Math.min(140, viewport[1]) } });
  await context.close();
}
await browser.close();
console.log(log.join('\n'));
console.log(`pageErrors: ${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
