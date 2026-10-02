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
const page=await context.newPage();page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(120000);
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const url=base+'/dashboard/build?artifact=portfolio-project';
async function fillReview(dialog,reflection){const selects=dialog.locator('select');const notes=dialog.locator('fieldset textarea');for(let i=0;i<3;i++){await selects.nth(i).selectOption('explained');await notes.nth(i).fill('Document section '+(i+1));}await dialog.getByLabel('What will you improve next?').fill(reflection);}
try{
await page.goto(url,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Review this project',exact:true}).click();
let dialog=page.getByRole('dialog',{name:'Review your portfolio project'});await fillReview(dialog,'First unfinished reflection');
await dialog.getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:'Review this project',exact:true}).click();await dialog.getByText(/Unsaved self-review recovered/).waitFor();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'First unfinished reflection');
await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Review this project',exact:true}).click();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'First unfinished reflection');
const second=await context.newPage();second.setDefaultTimeout(90000);await second.goto(url,{waitUntil:'networkidle'});await second.getByRole('button',{name:'Review this project',exact:true}).click();const other=second.getByRole('dialog',{name:'Review your portfolio project'});await fillReview(other,'Second tab saved reflection');await other.getByRole('button',{name:'Save self-review'}).click();await second.getByText(/Self-reviewed .* Current saved work/).waitFor();
await dialog.getByRole('button',{name:'Save self-review'}).click();await dialog.getByRole('alert').waitFor();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'First unfinished reflection');assert.equal(await dialog.getByRole('button',{name:'Save self-review'}).isDisabled(),true);
const exported=page.waitForEvent('download');await dialog.getByRole('button',{name:'Export review edits'}).click();assert.equal((await exported).suggestedFilename(),'portfolio-self-review-edits.json');await dialog.screenshot({path:'docs/visionary/baseline/design-2026-09-27/portfolio-review-conflict-390.png'});
await dialog.getByRole('button',{name:'Load latest review and discard edits'}).click();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'Second tab saved reflection');
await dialog.getByLabel('What will you improve next?').fill('Retry reflection');
await page.evaluate(()=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_workspace_v2')throw Error('Fictional storage failure');return old.call(this,key,value);};window.restorePortfolioStorage=()=>Storage.prototype.setItem=old;});
await dialog.getByRole('button',{name:'Save self-review'}).click();await dialog.getByRole('alert').waitFor();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'Retry reflection');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['review-pro:professional'].artifacts[0].portfolioReviews.length),1);
await page.evaluate(()=>window.restorePortfolioStorage());await dialog.getByRole('button',{name:'Save self-review'}).click();await page.getByText(/Self-reviewed .* Current saved work/).waitFor();await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Review again'}).click();assert.equal(await dialog.getByLabel('What will you improve next?').inputValue(),'Retry reflection');
await dialog.getByRole('button',{name:'Close',exact:true}).click();
await page.getByText('Saved self-review history (2)',{exact:true}).click();
const history=page.locator('ol').filter({has:page.getByText('Next improvement')});
await history.locator('summary').first().click();await history.getByText('Retry reflection',{exact:true}).waitFor();
await history.locator('summary').nth(1).click();await history.getByText('Second tab saved reflection',{exact:true}).waitFor();
await history.screenshot({path:'docs/visionary/baseline/design-2026-09-27/portfolio-review-history-390.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);console.log('PASS portfolio review close/refresh recovery, per-tab conflict, export, explicit reload, failed-save retry and current review persistence at 390px');
}finally{await browser.close();}
