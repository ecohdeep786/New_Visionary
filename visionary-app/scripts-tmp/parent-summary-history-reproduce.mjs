import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const users = [
  { id: 'project-parent', email: 'parent@project.test', full_name: 'Anika', identity: 'parent', roles: ['parent'], age_band: 'adult', onboarding_complete: true },
  { id: 'project-learner', email: 'learner@project.test', full_name: 'Aarav', identity: 'student', roles: ['student'], age_band: 'minor', onboarding_complete: true },
  { id: 'project-other', email: 'other@project.test', full_name: 'Maya', identity: 'student', roles: ['student'], age_band: 'minor', onboarding_complete: true },
 ];
 const now = new Date().toISOString();
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: now.slice(0, 10) }, legacyImported: false });
 const data = Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()]));
 data['project-learner:student'].artifacts.push({ id: 'finished-project', title: 'Bridge model', body: 'PRIVATE_PROJECT_DOCUMENT', milestones: [true, true, true], visibility: 'private', sharedWith: [], versions: [], status: 'completed', updatedAt: now });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({ token: user.id, userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }))));
 localStorage.setItem('visionary_session_token', 'project-learner');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: user.age_band, roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships: ['project-learner', 'project-other'].map((id, index) => ({ id: `guardian-${index}`, from: 'project-parent', to: id, type: 'guardian', scope: ['progress-summary'], status: 'active' })), data }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(base+'/dashboard/build?artifact=finished-project',{waitUntil:'networkidle'});
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['project-learner:student'].artifacts[0].parentSummaries=[null];localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});
 await page.reload({waitUntil:'networkidle'});
 console.log((await page.locator('body').innerText()).slice(-1000));
}finally{await browser.close();}
