import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

import { professionalCopy } from '../src/lib/professionalCopy.js';
import { projectCopy } from '../src/lib/projectCopy.js';
import { learningDate } from '../src/lib/learningCopy.js';
const seed=() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const user = { id: 'review-pro', email: 'sam@review.test', full_name: 'Sam', identity: 'professional', roles: ['professional'], age_band: 'adult', onboarding_complete: true };
 const now = new Date().toISOString();
 const data = { conversations: [], sessions: [], artifacts: [{ id: 'portfolio-project', title: 'Decision report', body: 'I compared fictional task totals and described the limits.', milestones: [true, true, true], visibility: 'private', sharedWith: [], versions: [], status: 'completed', updatedAt: now }], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: now.slice(0, 10) }, legacyImported: false };
 localStorage.setItem('visionary_users', JSON.stringify([user]));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'review-pro', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', 'review-pro');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [{ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: user.roles }], workspaces: [{ id: 'review-pro:professional', personId: user.id, role: 'professional', name: 'Professional', lastPath: '/dashboard/home' }], active: { [user.id]: 'review-pro:professional' }, relationships: [], data: { 'review-pro:professional': data } }));
};
try {
for (const locale of ['en','hi','bn']) {
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(seed);
 const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'/dashboard/build?artifact=portfolio-project',{waitUntil:'networkidle'});
 await page.evaluate(locale=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['review-pro:professional'].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},locale);
 await page.reload({waitUntil:'networkidle'});
 const t=professionalCopy(locale);
 await page.getByRole('button',{name:t('Review this project'),exact:true}).click();
 let dialog=page.getByRole('dialog',{name:t('Review your portfolio project')});
 for(let i=0;i<3;i++){await dialog.locator('fieldset select').nth(i).selectOption('explained');await dialog.locator('fieldset textarea').nth(i).fill('Original source note '+i);}
 await dialog.getByLabel(t('What will you improve next?')).fill('Retain review draft');
 await dialog.getByRole('button',{name:t('Save self-review'),exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 const valid=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['review-pro:professional'].artifacts[0].portfolioReviews);
 for(const bad of ['broken',null,[null],[{...valid[0],criteria:null}],[{...valid[0],criteria:[{id:'purpose',rating:'verified',note:'Never credential'}]}]]){
  const bytes=await page.evaluate(bad=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['review-pro:professional'].artifacts[0].portfolioReviews=bad;const raw=JSON.stringify(db);localStorage.setItem('visionary_workspace_v2',raw);return raw;},bad);
  await page.reload({waitUntil:'networkidle'});
  await page.getByText(t('Saved self-reviews are unavailable. Your project and review edits are retained. Retry after restoring the original records.'),{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_workspace_v2')),bytes);
  assert.equal(await page.getByRole('button',{name:t('Review again'),exact:true}).count(),0);
  const working=page.getByLabel(projectCopy(locale)('Your working document'));
  await working.fill('Unsaved project edits survive history retry');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:projectCopy(locale)('Export Markdown'),exact:true}).click();assert.equal((await download).suggestedFilename(),'Decision report.md');
  const beforeRetry=await page.evaluate(()=>localStorage.getItem('visionary_workspace_v2'));
  assert.deepEqual(JSON.parse(beforeRetry).data['review-pro:professional'].artifacts[0].portfolioReviews,bad);
  await page.getByRole('button',{name:t('Retry self-review history'),exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_workspace_v2')),beforeRetry);
  // Restore only the source records, then retry without reloading the editor.
  await page.evaluate(valid=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['review-pro:professional'].artifacts[0].portfolioReviews=valid;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},valid);
  await page.getByRole('button',{name:t('Retry self-review history'),exact:true}).click();
  assert.equal(await working.inputValue(),'Unsaved project edits survive history retry');
  await working.fill('I compared fictional task totals and described the limits.');
  await page.getByRole('button',{name:t('Review again'),exact:true}).waitFor();
 }
 // Malformed dates are explicitly unavailable; valid assessments remain inspectable.
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['review-pro:professional'].artifacts[0].portfolioReviews[0].reviewedAt='invalid';localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});
 await page.reload({waitUntil:'networkidle'});
 assert.ok((await page.locator('body').innerText()).includes(t('Self-reviewed')+' '+learningDate('invalid',locale)));
 assert.ok(!(await page.locator('body').innerText()).includes('Invalid Date'));
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 assert.deepEqual(errors,[]);console.log(locale+' retained-history recovery PASS');await context.close();
}
} finally {await browser.close();}
