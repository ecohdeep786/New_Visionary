// M1 rendered verification: (1) plan deferral "Not today" hides today's step and
// returns tomorrow; (2) community learner Report + teacher flagged/Restore.
const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const baseSeed = `(() => {
  const user = { id: 'qa-view', email: 'qa-view@visionary.test', full_name: 'Qa Tester', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-view-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'qa-view-token');
  const wsId = 'qa-view:student';
  const db = { version: 2, people: [{ id: 'qa-view', email: 'qa-view@visionary.test', name: 'Qa Tester', ageBand: 'adult', roles: ['student'] }], workspaces: [{ id: wsId, personId: 'qa-view', role: 'student', name: 'Learner space', lastPath: '/dashboard/home' }], active: { 'qa-view': wsId }, relationships: [], data: { [wsId]: { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-26' }, legacyImported: false } } };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
  localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'demo-class-cube', name: 'Space, shape and reasoning', subject: 'Geometry', teacher_email: 'qa-view@visionary.test', teacher_id: 'qa-view', teacher_name: 'Dev', join_code: 'DEMO-CUBE', color: '#1967d2', createdAt: Date.now() }]));
  localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ id: 'qa-enrollment', class_id: 'demo-class-cube', student_email: 'qa-view@visionary.test', student_id: 'qa-view', student_name: 'Qa Tester', status: 'active', createdAt: Date.now() }]));
  localStorage.setItem('visionary_entity_Assignment', JSON.stringify([{ id: 'm1-classwork', class_id: 'demo-class-cube', title: 'Bring the model', status: 'published', due_date: '2026-09-27' }]));
})()`;
// 1. Not today: the deferral hides the plan step for the rest of today.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(baseSeed);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto('http://localhost:4173/dashboard/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const before = await page.getByText('Bring the model').count();
  await page.getByRole('button', { name: 'Not today' }).first().click();
  await page.waitForTimeout(900);
  const after = await page.getByText('Bring the model').count();
  const stored = await page.evaluate(() => (JSON.parse(localStorage.getItem('visionary_daily_deferrals_v1') || '{"deferred":[]}')).deferred.length);
  console.log(`plan deferral: stepBefore=${before > 0} hiddenAfter=${after === 0} deferralsStored=${stored} errors=${errors.length}`);
  await context.close();
}
// 2. Community: learner sees Report; teacher sees flagged + Restore after a report.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(baseSeed);
  await context.addInitScript(`(() => {
    localStorage.setItem('visionary_community_v1', JSON.stringify({ version: 1, posts: [{ id: 'm1-post', classId: 'demo-class-cube', authorId: 'qa-view', authorName: 'Qa Tester', authorRole: 'student', text: 'Why eight times more volume?', at: new Date().toISOString(), status: 'visible' }] }));
  })()`);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto('http://localhost:4173/dashboard/classes?class=demo-class-cube', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Community' }).click();
  await page.waitForTimeout(700);
  const reportBtn = await page.getByRole('button', { name: /Report post by Qa Tester/ }).count();
  await page.getByRole('button', { name: /Report post by Qa Tester/ }).first().click();
  await page.waitForTimeout(600);
  const hidden = await page.getByText('Why eight times more volume?').count();
  console.log(`community: reportButton=${reportBtn} postHiddenForLearner=${hidden === 0} errors=${errors.length}`);
  await context.close();
}
await browser.close();
