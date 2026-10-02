import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const names = ['Anika', 'Aarav', 'Maya', 'Noor', 'Leela', 'Omar'];
 const users = names.map((name, index) => ({ id: `consent-${index}`, email: `${name.toLowerCase()}@consent.test`, full_name: name, identity: index ? 'student' : 'parent', roles: [index ? 'student' : 'parent'], age_band: 'adult', onboarding_complete: true }));
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-29' }, legacyImported: false });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({ token: user.id, userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }))));
 localStorage.setItem('visionary_session_token', 'consent-0');
 const relationships = [
  { id: 'active', to: 'consent-1', status: 'active' },
  { id: 'pending', to: 'consent-2', status: 'pending', expiresAt: new Date(Date.now() + 86400000).toISOString() },
  { id: 'declined', to: 'consent-3', status: 'declined' },
  { id: 'expired-request', to: 'consent-4', status: 'pending', expiresAt: '2020-01-01T00:00:00Z' },
  { id: 'expired-active', to: 'consent-5', status: 'active', expiresAt: '2020-01-01T00:00:00Z' },
 ].map(row => ({ ...row, from: 'consent-0', type: 'guardian', scope: ['progress-summary'] }));
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships, data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()])) }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const row = name => page.locator('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
try {
 await page.goto(`${base}/dashboard/child`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Connections and history' }).waitFor();
 assert.equal(await row('Aarav').getByRole('link', { name: 'View report' }).count(), 1);
 assert.equal(await row('Maya').getByRole('button', { name: 'Cancel request' }).count(), 1);
 for (const name of ['Noor', 'Leela', 'Omar']) {
  assert.equal(await row(name).getByRole('link', { name: 'View report' }).count(), 0);
  assert.equal(await row(name).getByRole('button', { name: 'Request again' }).count(), 1);
 }
 await row('Omar').getByRole('button', { name: 'Request again' }).click();
 await page.getByRole('status').getByText(/learner must accept/i).waitFor();
 assert.equal(await row('Omar').getByRole('link', { name: 'View report' }).count(), 0);
 await row('Maya').getByRole('button', { name: 'Cancel request' }).click();
 await page.getByRole('status').getByText('Request cancelled.').waitFor();
 await page.reload({ waitUntil: 'networkidle' });
 assert.equal(await row('Maya').getByRole('button', { name: 'Request again' }).count(), 1);
 await row('Omar').last().getByRole('heading', { name: 'Omar' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/parent-consent-lifecycle-390.png' });
 await page.goto(`${base}/dashboard/notifications`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Sharing event history' }).waitFor();
 await page.getByText(/Requested progress sharing with Omar/).waitFor();
 await page.getByText(/Cancelled the sharing request for Maya/).waitFor();
 await page.getByRole('heading', { name: 'Sharing event history' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/parent-sharing-events-390.png' });
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
 assert.deepEqual(errors, []);
 console.log('Parent lifecycle: active, pending, declined, expired request, expired permission, renewal and cancellation pass at 390px.');
} finally { await browser.close(); }
