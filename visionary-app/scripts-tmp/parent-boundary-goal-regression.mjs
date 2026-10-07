import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const users = [
  { id: 'goal-parent', email: 'parent@goal.test', full_name: 'Anika', identity: 'parent', roles: ['parent'], age_band: 'adult', onboarding_complete: true },
  { id: 'goal-learner', email: 'learner@goal.test', full_name: 'Aarav', identity: 'student', roles: ['student'], age_band: 'minor', onboarding_complete: true },
  { id: 'goal-other', email: 'other@goal.test', full_name: 'Maya', identity: 'student', roles: ['student'], age_band: 'minor', onboarding_complete: true },
 ];
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date().toISOString().slice(0, 10) }, legacyImported: false });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({ token: user.id, userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }))));
 localStorage.setItem('visionary_session_token', 'goal-learner');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: user.age_band, roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships: ['goal-learner', 'goal-other'].map((id, index) => ({ id: `guardian-${index}`, from: 'goal-parent', to: id, type: 'guardian', scope: ['progress-summary'], status: 'active' })), data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()])) }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/progress`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'My learning goals' }).waitFor();
 await page.getByRole('button', { name: 'Add a goal' }).click();
 const editor = page.getByRole('dialog', { name: 'Add a learning goal' });
 await editor.getByLabel('Goal title').fill('Test my bridge model');
 await editor.getByLabel('Private notes').fill('PRIVATE_GOAL_NOTES');
 await editor.getByRole('button', { name: 'Save goal' }).click();
 await page.getByRole('heading', { name: 'Test my bridge model' }).waitFor();
 await page.getByRole('button', { name: 'Parent sharing' }).click();
 const dialog = page.getByRole('dialog', { name: 'Share a learning goal with a parent' });
 await dialog.getByLabel('Parent with active permission').selectOption('goal-parent');
 await dialog.getByLabel('Summary to share').fill('Please help me test one design each weekend.');
 await dialog.getByRole('region', { name: 'Exact goal preview' }).getByText('Please help me test one design each weekend.').waitFor();
 assert.equal(await dialog.getByText('PRIVATE_GOAL_NOTES').count(), 0);
 await dialog.screenshot({ path: 'scripts-tmp/parent-boundary-regression-parent-goal-share-preview-390.png' });
 await dialog.getByRole('button', { name: 'Confirm goal sharing' }).click();
 await page.getByRole('status').getByText(/Goal summary shared\./).waitFor();
 await page.evaluate(() => localStorage.setItem('visionary_session_token', 'goal-parent'));
 await page.goto(`${base}/dashboard/reports?child=goal-learner`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Test my bridge model' }).waitFor();
 await page.getByText('Please help me test one design each weekend.').waitFor();
 assert.equal(await page.getByText('PRIVATE_GOAL_NOTES').count(), 0);
 await page.getByRole('heading', { name: 'Goals and transitions' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'scripts-tmp/parent-boundary-regression-parent-goal-report-390.png' });
 await page.getByRole('combobox', { name: 'Child' }).selectOption('goal-other');
 assert.equal(await page.getByRole('heading', { name: 'Test my bridge model' }).count(), 0);
 await page.evaluate(() => localStorage.setItem('visionary_session_token', 'goal-learner'));
 await page.goto(`${base}/dashboard/progress`, { waitUntil: 'networkidle' });
 await page.getByRole('button', { name: 'Parent sharing' }).click();
 await dialog.getByRole('button', { name: 'Stop sharing' }).click();
 await dialog.getByRole('button', { name: 'Close' }).click();
 await page.evaluate(() => localStorage.setItem('visionary_session_token', 'goal-parent'));
 await page.goto(`${base}/dashboard/reports?child=goal-learner`, { waitUntil: 'networkidle' });
 assert.equal(await page.getByRole('heading', { name: 'Test my bridge model' }).count(), 0);
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
 assert.deepEqual(errors, []);
 console.log('Learner goal: create privately, exact parent preview, second-child isolation, stop sharing and 390px layout passed.');
} finally { await browser.close(); }
