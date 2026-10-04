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
 await page.goto(base+'/dashboard/build?artifact=portfolio-project',{waitUntil:'networkidle'});
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['review-pro:professional'].artifacts[0].portfolioReviews=[{projectVersion:'old',criteria:null,reflection:'Retain original',reviewedAt:'invalid'}];localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});
 await page.reload({waitUntil:'networkidle'});
 console.log(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(-1800)}));
} finally {await browser.close();}
