import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const users = [
  { id: 'ask-parent', email: 'parent@ask.test', full_name: 'Anika', identity: 'parent', roles: ['parent'], age_band: 'adult', onboarding_complete: true },
  { id: 'ask-child-a', email: 'a@ask.test', full_name: 'Aarav', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true },
  { id: 'ask-child-b', email: 'b@ask.test', full_name: 'Maya', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true },
 ];
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-29' }, legacyImported: false });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({ token: user.identity === 'parent' ? 'parent' : user.id, userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }))));
 localStorage.setItem('visionary_session_token', 'parent');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships: [ { id: 'share-a', from: 'ask-parent', to: 'ask-child-a', type: 'guardian', scope: ['progress-summary'], status: 'active' }, { id: 'share-b', from: 'ask-parent', to: 'ask-child-b', type: 'guardian', scope: ['progress-summary'], status: 'active' } ], data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()])) }));
 const dated = new Date(Date.now() - 15 * 86400000).toISOString();
 const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
 db.data['ask-child-a:student'].sessions.push({ id: 'older-activity', journeyId: 'cube', stage: 'completed', updatedAt: dated, evidence: [] });
 localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify([{ id: 'older-assignment', class_id: 'older-class', title: 'Older returned work', status: 'published' }]));
 localStorage.setItem('visionary_entity_Enrollment', '[]');
 localStorage.setItem('visionary_entity_Submission', JSON.stringify([{ id: 'older-return', assignment_id: 'older-assignment', class_id: 'older-class', student_email: 'a@ask.test', status: 'graded', graded_date: dated, text: 'PRIVATE ANSWER', feedback: 'PRIVATE FEEDBACK', grade: 10 }]));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/reports?child=ask-child-a`, { waitUntil: 'networkidle' });
 await page.getByText('0 completed guided-learning activities.').waitFor();
 assert.equal(await page.getByText('Older returned work').count(), 0);
 await page.getByLabel('Report period').selectOption('30');
 await page.getByText('1 completed guided-learning activities.').waitFor();
 await page.getByText('Older returned work').waitFor();
 await page.getByRole('heading', { name: 'Progress and retention' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/parent-report-period-390.png' });
 await page.getByRole('link', { name: 'Ask about this report' }).click();
 await page.getByRole('heading', { name: /Ask about Aarav/ }).waitFor();
 assert.match(page.url(), /ask\?child=ask-child-a&period=30/);
 await page.getByRole('button', { name: 'Get guidance' }).click();
 await page.getByRole('heading', { name: /From Aarav’s shared report/ }).waitFor();
 await page.getByText(/no recent recorded evidence here/i).first().waitFor();
 await page.getByText(/last 30 days/i).first().waitFor();
 await page.getByRole('button', { name: /teacher\?/ }).click();
 await page.getByRole('button', { name: 'Get guidance' }).click();
 await page.getByRole('heading', { name: /From Aarav’s shared report/ }).waitFor();
 await page.getByText(/You could ask their teacher/i).first().waitFor();
 await page.getByRole('heading', { name: /From Aarav’s shared report/ }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/parent-report-ask-390.png', fullPage: true });
 await page.reload({ waitUntil: 'networkidle' });
 assert.equal(await page.getByRole('heading', { name: /From Aarav’s shared report/ }).count(), 0, 'guidance stays transient');
 await page.getByRole('link', { name: 'Return to shared report' }).click();
 assert.match(page.url(), /reports\?child=ask-child-a&period=30/);
 await page.getByRole('combobox', { name: 'Child' }).selectOption('ask-child-b');
 await page.getByRole('heading', { name: /Maya’s overview/ }).waitFor();
 assert.equal(await page.getByText('Older returned work').count(), 0);
 await page.goto(`${base}/dashboard/ask?child=ask-child-a&period=30`, { waitUntil: 'networkidle' });
 await page.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
  db.relationships.find(row => row.id === 'share-a').status = 'revoked';
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('visionary:v2-change'));
 });
 await page.getByRole('heading', { name: 'Shared report unavailable' }).waitFor();
 assert.equal(await page.getByText('Aarav').count(), 0);
 await page.goto(`${base}/dashboard/ask?child=ask-child-b`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: /Ask about Maya/ }).waitFor();
 assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['ask-parent:parent'].conversations.length), 0);
 await page.goto(`${base}/dashboard/notifications`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Family updates' }).waitFor();
 await page.getByRole('combobox', { name: 'Preview language' }).selectOption('hi');
 await page.getByText(/प्रगति का सारांश/).waitFor();
 assert.equal(await page.getByRole('heading', { name: 'Summary preview' }).locator('..').getByRole('link', { name: 'View report' }).count(), 1);
 await page.getByRole('combobox', { name: 'Summary frequency' }).selectOption('off');
 await page.getByText('Summary previews are off in this workspace.').waitFor();
 await page.getByRole('heading', { name: 'Sharing status' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/parent-notifications-390.png' });
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
 assert.deepEqual(errors, []);
 console.log('Parent report Ask: selected child, transient guidance, revocation, second child, no page errors or 390px overflow passed.');
} finally { await browser.close(); }
