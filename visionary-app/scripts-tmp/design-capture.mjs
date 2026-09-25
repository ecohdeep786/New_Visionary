import { chromium } from 'playwright-core';
const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
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
const shots = [
  [1440, 900, '/dashboard/home', 'current-home-1440'],
  [1440, 900, '/dashboard/learn', 'current-learn-1440'],
  [390, 844, '/dashboard/home', 'current-home-390'],
];
for (const [w, h, route, name] of shots) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  await context.addInitScript(seed);
  const page = await context.newPage();
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }); break; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `scripts-tmp/${name}.png`, fullPage: false });
  // Sample background colors: page canvas vs surface vs sidebar.
  const colors = await page.evaluate(() => {
    const pick = el => el ? getComputedStyle(el).backgroundColor + ' | border-bottom: ' + getComputedStyle(el).borderBottomWidth + ' ' + getComputedStyle(el).borderBottomColor : 'none';
    const sidebar = document.querySelector('aside');
    const shell = document.querySelector('.workspace-shell');
    const surface = document.querySelector('.workspace-surface');
    const main = document.getElementById('main');
    return { shell: pick(shell), surface: pick(surface), main: pick(main), sidebar: pick(sidebar) };
  });
  console.log(name, JSON.stringify(colors));
  await context.close();
}
await browser.close();
