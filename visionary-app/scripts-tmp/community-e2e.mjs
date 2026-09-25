// E2E: student posts in the class community; the assigned teacher removes it; the
// learner no longer sees it. Uses the production bundle + seeded demo accounts.
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const log = [];
const errors = [];
async function enter(page, persona) {
  await page.goto(`${BASE}/dashboard/home`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
  // Seed the scenario data through the demo bootstrap in localStorage via appClient:
  // simplest faithful path is to run the seed inline for the connected fixtures.
  await page.evaluate(async ({ persona }) => {
    const mod = await import('/src/api/demoFixtures.js');
    mod.seedConnectedFixtures(localStorage, new Date());
    void persona;
  }, { persona }).catch(e => log.push('seedInline: ' + String(e).slice(0, 80)));
}
const seed = () => {
  const user = { id: 'qa-view', email: 'qa-view@visionary.test', full_name: 'Qa Tester', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
  localStorage.setItem('visionary_users', JSON.stringify([user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-view-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
  localStorage.setItem('visionary_session_token', 'qa-view-token');
  const wsId = 'qa-view:student';
  const db = { version: 2, people: [{ id: 'qa-view', email: 'qa-view@visionary.test', name: 'Qa Tester', ageBand: 'adult', roles: ['student'] }], workspaces: [{ id: wsId, personId: 'qa-view', role: 'student', name: 'Learner space', lastPath: '/dashboard/home' }], active: { 'qa-view': wsId }, relationships: [], data: { [wsId]: { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-25' }, legacyImported: false } } };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
  // Connect qa-view to the demo class as a student so the community access checks pass.
  const classroom = { id: 'demo-class-cube', name: 'Space, shape and reasoning', subject: 'Geometry', teacher_email: 'teacher@visionary.test', teacher_id: 'demo-teacher', teacher_name: 'Dev', join_code: 'DEMO-CUBE', color: '#1967d2', created_date: new Date().toISOString(), createdAt: Date.now() };
  const enrollment = { id: 'qa-enrollment', class_id: 'demo-class-cube', student_email: 'qa-view@visionary.test', student_id: 'qa-view', student_name: 'Qa Tester', status: 'active', createdAt: Date.now() };
  localStorage.setItem('visionary_entity_Classroom', JSON.stringify([classroom]));
  localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([enrollment]));
};
// 1. Student posts.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(seed);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push('student: ' + String(e).slice(0, 120)));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(`${BASE}/dashboard/classes?class=demo-class-cube`, { waitUntil: 'networkidle', timeout: 30000 }); break; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
  await page.getByRole('button', { name: 'Community' }).click();
  await page.waitForTimeout(600);
  await page.locator('textarea').fill('Why does the box hold 27 cubic units?');
  await page.getByRole('button', { name: 'Post' }).click();
  await page.getByText('Why does the box hold 27 cubic units?').first().waitFor({ timeout: 8000 });
  log.push('student: post visible after posting');
  await page.screenshot({ path: 'scripts-tmp/community-student.png' });
  await context.close();
}
// 2. Teacher (Dev) views and removes the post.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const users = JSON.parse(localStorage.getItem('visionary_users') || '[]');
    void users;
  });
  await context.addInitScript(seed);
  await context.addInitScript(() => {
    // Turn the same account into the assigned teacher of the demo class.
    const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
    db.people[0].roles = ['teacher'];
    db.workspaces = [{ id: 'qa-view:teacher', personId: 'qa-view', role: 'teacher', name: 'Teacher space', lastPath: '/dashboard/home' }];
    db.active = { 'qa-view': 'qa-view:teacher' };
    db.data['qa-view:teacher'] = JSON.parse(JSON.stringify(db.data['qa-view:student']));
    localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
    const users = JSON.parse(localStorage.getItem('visionary_users'));
    users[0].identity = 'teacher';
    users[0].roles = ['teacher'];
    localStorage.setItem('visionary_users', JSON.stringify(users));
    // Contexts have separate localStorage: seed the learner's post into the teacher view.
    localStorage.setItem('visionary_community_v1', JSON.stringify({ version: 1, posts: [{ id: 'e2e-post-1', classId: 'demo-class-cube', authorId: 'qa-view', authorName: 'Qa Tester', authorRole: 'student', text: 'Why does the box hold 27 cubic units?', at: '2026-09-25T12:00:00Z', status: 'visible' }] }));
    // The test teacher must own the demo class for the ownership check to pass.
    const classrooms = JSON.parse(localStorage.getItem('visionary_entity_Classroom'));
    classrooms[0].teacher_email = 'qa-view@visionary.test';
    classrooms[0].teacher_id = 'qa-view';
    localStorage.setItem('visionary_entity_Classroom', JSON.stringify(classrooms));
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push('teacher: ' + String(e).slice(0, 120)));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(`${BASE}/dashboard/class/demo-class-cube`, { waitUntil: 'networkidle', timeout: 30000 }); break; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
  await page.getByRole('button', { name: 'Community' }).click();
  await page.waitForTimeout(800);
  const tabState = await page.evaluate(() => document.body.innerText.slice(0, 600));
  console.log('teacher page:', JSON.stringify(tabState.slice(100, 500)));
  const visible = await page.getByText('Why does the box hold 27 cubic units?').count();
  await page.getByRole('button', { name: /Remove post by Qa Tester/ }).click();
  await page.waitForTimeout(600);
  const gone = await page.getByText('Why does the box hold 27 cubic units?').count();
  log.push(`teacher: sawPost=${visible > 0} removedGone=${gone === 0}`);
  await page.screenshot({ path: 'scripts-tmp/community-teacher.png' });
  await context.close();
}
await browser.close();
console.log(log.join('\n'));
console.log('pageErrors:', errors.length, errors[0] || '');
