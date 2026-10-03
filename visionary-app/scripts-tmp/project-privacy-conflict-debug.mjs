import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const users = [
  { id: 'sponsor-pro', email: 'sam@sponsor.test', full_name: 'Sam', identity: 'professional', roles: ['professional'], age_band: 'adult', onboarding_complete: true },
  { id: 'sponsor-org', email: 'company@sponsor.test', full_name: 'Company admin', org_name: 'Example Company', identity: 'organization', roles: ['organization'], age_band: 'adult', onboarding_complete: true },
 ];
 const empty = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date().toISOString().slice(0, 10) }, legacyImported: false });
 localStorage.setItem('visionary_users', JSON.stringify(users));
 localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({ token: user.id, userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }))));
 localStorage.setItem('visionary_session_token', 'sponsor-pro');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: users.map(user => ({ id: user.id, email: user.email, name: user.full_name, ageBand: user.age_band, roles: user.roles })), workspaces: users.map(user => ({ id: `${user.id}:${user.identity}`, personId: user.id, role: user.identity, name: user.identity, lastPath: '/dashboard/home' })), active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])), relationships: [], data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()])) }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const enter = async (token, path) => { await page.evaluate(value => localStorage.setItem('visionary_session_token', value), token); await page.goto(`${base}${path}`, { waitUntil: 'networkidle' }); };
try {
 await page.goto(base+'/dashboard/build',{waitUntil:'networkidle'});await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project title',{exact:true}).fill('Conflict plan');await page.getByLabel('Your working document').fill('Saved baseline');await page.getByRole('button',{name:'Save',exact:true}).click();
 const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['sponsor-pro:professional'].artifacts[0].id);
 const other=await context.newPage();other.on('pageerror',error=>errors.push(String(error)));await other.goto(base+'/dashboard/build?artifact='+id,{waitUntil:'networkidle'});
 await page.getByLabel('Your working document').fill('My unsaved reasoning');await other.getByLabel('Your working document').fill('Newer saved reasoning');await other.getByRole('button',{name:'Save',exact:true}).click();
 await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:/Conflict plan/}).first().click();if(await page.getByLabel('Your working document').inputValue()!=='My unsaved reasoning')throw Error('Another tab deleted the unsaved draft');
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('heading',{name:'A newer project version is saved'}).waitFor();await page.getByText('Review latest saved version',{exact:true}).click();await page.getByText('Newer saved reasoning',{exact:true}).waitFor();
 await page.getByRole('heading',{name:'A newer project version is saved'}).scrollIntoViewIfNeeded();await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/project-conflict-390.png'});
 await page.getByRole('button',{name:'Save my edits as a separate project',exact:true}).click();await page.getByText('Your edits were saved as a separate private draft. The newer original was kept.',{exact:true}).waitFor();
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['sponsor-pro:professional'].artifacts);if(records.find(item=>item.id===id).body!=='Newer saved reasoning')throw Error('Original overwritten');const copy=records.find(item=>item.id!==id);if(copy.body!=='My unsaved reasoning'||copy.visibility!=='private'||copy.sharedWith.length||copy.learningSessionId)throw Error('Copy did not preserve private edits');
 if(errors.length)throw Error(errors.join('\n'));if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');console.log('390px two-tab project conflict → retained draft on refresh → separate private copy passed.');
}catch(error){console.log(await page.locator('main').innerText());console.log('URL',page.url());await page.screenshot({path:'scripts-tmp/project-privacy-conflict-failure.png'});throw error;}finally{await browser.close();}