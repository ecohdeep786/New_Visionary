import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const user = { id: 'review-pro', email: 'sam@review.test', full_name: 'Sam', identity: 'professional', roles: ['professional'], age_band: 'adult', onboarding_complete: true };
 const now = new Date().toISOString();
 const data = { conversations: [], sessions: [], artifacts: [{ id: 'portfolio-project', title: 'Decision report', body: 'I compared fictional task totals and described the limits.', milestones: [true, true, true], visibility: 'private', sharedWith: [], versions: [], status: 'completed', updatedAt: now }], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: now.slice(0, 10) }, legacyImported: false };
 localStorage.setItem('visionary_users', JSON.stringify([user]));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'review-pro', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', 'review-pro');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [{ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: user.roles }], workspaces: [{ id: 'review-pro:professional', personId: user.id, role: 'professional', name: 'Professional', lastPath: '/dashboard/home' }], active: { [user.id]: 'review-pro:professional' }, relationships: [], data: { 'review-pro:professional': data } }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/build?artifact=portfolio-project`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Portfolio self-review' }).waitFor();
 await page.getByText('No self-review saved yet.').waitFor();
 await page.getByRole('button', { name: 'Review this project' }).click();
 const dialog = page.getByRole('dialog', { name: 'Review your portfolio project' });
 for (let index = 0; index < 3; index++) {
  await dialog.getByLabel('Your rating').nth(index).selectOption(index === 2 ? 'needs-work' : 'supported');
  await dialog.getByLabel('Evidence note').nth(index).fill(`Section ${index + 1} explains my reasoning.`);
 }
 await dialog.getByLabel('What will you improve next?').fill('Check a second fictional source.');
 await dialog.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/professional-portfolio-criteria-390.png' });
 await dialog.getByRole('button', { name: 'Save self-review' }).click();
 await page.getByText(/Self-reviewed .* Current saved work/).waitFor();
 await page.getByRole('heading', { name: 'Portfolio self-review' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/professional-portfolio-reviewed-390.png' });
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByText(/Self-reviewed .* Current saved work/).waitFor();
 await page.getByLabel('Your working document').fill('I revised the method and added another limit.');
 await page.getByRole('button', { name: 'Save', exact: true }).click();
 await page.getByText('Your last self-review is outdated after project changes.').waitFor();
 await page.getByRole('heading', { name: 'Portfolio self-review' }).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/professional-portfolio-outdated-390.png' });
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['review-pro:professional'].artifacts[0]);
 assert.equal(saved.portfolioReviews.length, 1);
 assert.equal(saved.body, 'I revised the method and added another limit.');
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
 assert.deepEqual(errors, []);
 console.log('Professional portfolio: criterion self-review, refresh persistence, outdated state after edit and 390px layout passed.');
} finally { await browser.close(); }
