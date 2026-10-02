import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const org = { id: 'period-org', email: 'org@period.test', full_name: 'School admin', identity: 'organization', roles: ['organization'], age_band: 'adult', onboarding_complete: true };
 const learners = Array.from({ length: 5 }, (_, index) => ({ id: `period-learner-${index}`, email: `learner${index}@period.test`, full_name: `Learner ${index + 1}`, identity: 'student', roles: ['student'], age_band: 'minor', onboarding_complete: true }));
 const users = [org, ...learners];
 const old = new Date(Date.now() - 15 * 86400000).toISOString();
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date().toISOString().slice(0, 10) }, legacyImported: false });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: org.id, userId: org.id, email: org.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', org.id);
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: user.age_band, roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships: [], data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()])) }));
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'period-class', name: 'Sample class', organization_email: org.email, teacher_email: 'teacher@period.test', status: 'active' }]));
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify(learners.map((user, index) => ({ id: `period-member-${index}`, organization_email: org.email, email: user.email, role: 'student', status: 'active' }))));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify(learners.map((user, index) => ({ id: `period-enroll-${index}`, class_id: 'period-class', student_email: user.email, student_id: user.id, status: 'active' }))));
 localStorage.setItem('visionary_mentor_v1', JSON.stringify({ version: 1, spaces: Object.fromEntries(learners.map((user, index) => [`${user.id}:student`, { owner: user.id, role: 'student', evidence: [{ id: `old-${index}`, conceptId: 'sample:cube:concept', kind: 'check', correct: 1, total: 1, verified: true, sessionId: `session-${index}`, classId: 'period-class', at: old }], events: [], memory: [], memoryEpoch: 0 }])) }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/analytics`, { waitUntil: 'networkidle' });
 const panel = page.getByRole('region', { name: 'Scoped learning evidence' });
 await panel.getByText(/Last 7 days of recorded class evidence/).waitFor();
 await panel.getByText(/No concept total is available/).waitFor();
 await panel.getByLabel('Evidence period').selectOption('30');
 await panel.getByText(/Last 30 days of recorded class evidence/).waitFor();
 await panel.getByText('5 of 5 recorded checks correct · 5 contributors').waitFor();
 await panel.scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/organization-period-30-390.png' });
 await page.evaluate(() => { const rows = JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite')); rows[0].status = 'revoked'; localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify(rows)); window.dispatchEvent(new CustomEvent('visionary:workspace-change')); });
 await panel.getByText(/4 active enrolled learners/).waitFor();
 await panel.getByText(/Concept totals require at least 5/).waitFor();
 assert.equal(await panel.getByText('5 of 5 recorded checks correct · 5 contributors').count(), 0);
 await panel.scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/organization-period-suppressed-390.png' });
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
 assert.deepEqual(errors, []);
 console.log('Organization analytics: 7/30-day evidence, current denominator, five-contributor threshold and revocation passed at 390px.');
} finally { await browser.close(); }
