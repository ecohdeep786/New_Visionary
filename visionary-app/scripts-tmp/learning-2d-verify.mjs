// Production-preview check for the authored cube lesson inside the saved learning unit.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4190';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const id = 'representation-student'; const email = `${id}@visionary.test`; const workspaceId = `${id}:student`;
 const user = { id, email, full_name: 'Aarav', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
 const person = { id, email, name: 'Aarav', ageBand: 'adult', roles: ['student'], learningContext: { classLevel: 'Class 10', stage: 'school', board: 'CBSE', subjects: ['Mathematics'] } };
 const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: false }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-28' }, legacyImported: false };
 localStorage.setItem('visionary_users', JSON.stringify([user]));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'representation-session', userId: id, email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', 'representation-session');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [person], workspaces: [{ id: workspaceId, personId: id, role: 'student', name: 'Learner', lastPath: '/dashboard/learn' }], active: { [id]: workspaceId }, relationships: [], data: { [workspaceId]: data } }));
});
const page = await context.newPage();
page.setDefaultNavigationTimeout(120000);
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(base+'/dashboard/learn',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Try authored learning sample'}).click();await page.getByRole('heading',{name:'Mathematics',exact:true}).waitFor();await page.getByRole('region',{name:'Subject chapters'}).getByRole('button').first().click();await page.locator('section[aria-label$="learning path"]').getByRole('button',{name:/^Start /}).click();
 const representation=page.getByRole('region',{name:'Concept representation'});const baseline=await page.evaluate(()=>localStorage.getItem('visionary_mentor_v1'));
 await representation.getByRole('slider',{name:/Selected equal parts/}).fill('6');await representation.getByText('6/8 = 3/4 = 0.75',{exact:true}).waitFor();await page.reload({waitUntil:'networkidle'});if(await representation.getByRole('slider',{name:/Selected equal parts/}).inputValue()!=='6')throw Error('Fraction position not retained');
 await representation.getByRole('slider',{name:/Selected equal parts/}).focus();await page.keyboard.press('ArrowLeft');await representation.getByText('5/8 = 5/8 = 0.625',{exact:true}).waitFor();
 await representation.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/student-number-line-390.png'});
 await representation.getByRole('button',{name:'Read description'}).click();await representation.getByText(/A fraction describes/).waitFor();await representation.getByRole('button',{name:'Interactive number line'}).click();
 if(await page.evaluate(()=>localStorage.getItem('visionary_mentor_v1'))!==baseline)throw Error('View created learning evidence');
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));const users=JSON.parse(localStorage.getItem('visionary_users'));const person=db.people[0];person.roles.push('professional');const personal=db.workspaces[0];const work={...personal,id:person.id+':professional',role:'professional',name:'Professional'};db.workspaces.push(work);db.data[work.id]=structuredClone(db.data[personal.id]);db.active[person.id]=work.id;users[0].roles=person.roles;users[0].identity='professional';localStorage.setItem('visionary_users',JSON.stringify(users));localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});
 await page.goto(base+'/dashboard/learn',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Try authored workplace sample'}).click();await page.getByRole('region',{name:'Subject chapters'}).getByRole('button').first().click();await page.locator('section[aria-label$="learning path"]').getByRole('button',{name:/^Start /}).click();
 await representation.getByRole('table').waitFor();const table=representation.getByRole('table');await table.getByRole('cell',{name:'20',exact:true}).waitFor();await table.getByRole('row',{name:'Mean 25',exact:true}).waitFor();
 await representation.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/professional-data-chart-390.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');if(errors.length)throw Error(errors.join('\n'));
 console.log('390px authored fraction keyboard/refresh/text/evidence and professional chart/table paths passed.');
}finally{await browser.close();}