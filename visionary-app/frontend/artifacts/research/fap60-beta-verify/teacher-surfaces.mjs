import { chromium } from 'playwright-core';
const width = Number(process.argv[2] || 1440);
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const errs=[];
p.on('pageerror', e => errs.push(String(e).slice(0,150)));
await p.goto('http://127.0.0.1:4197/login', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(2000);
await p.getByRole('button',{name:'Continue with Email'}).first().click();
await p.locator('input[type="email"]').first().fill('qa.designer@example.test');
await p.getByRole('button',{name:/continue|next/i}).last().click();
await p.waitForTimeout(1200);
await p.locator('input[type="password"]').first().fill('Visionary#2026',{timeout:20000});
await p.getByRole('button',{name:/sign in/i}).last().click();
await p.waitForFunction(()=>{ try{const ws=JSON.parse(localStorage.getItem('visionary_workspace_v2')||'{}');return Object.keys(ws.active||{}).length>0;}catch{return false;} },{timeout:25000});
await p.waitForTimeout(2500);
await p.evaluate(()=>{ const d=document.querySelector('[role="dialog"]'); if(d){const x=d.querySelector('[aria-label*="lose"], button.absolute, [data-radix-dialog-close]'); if(x) x.click();} });
await p.waitForTimeout(600);
// add + activate the teacher role (idempotent if it exists)
const state = await p.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); return {has:db.workspaces.some(w=>w.role==='teacher'), personId:Object.keys(db.active)[0]}; });
console.log('teacher workspace exists:', state.has);
if (!state.has) {
  await p.locator('select[aria-label="Active workspace"]').selectOption('add');
  await p.waitForTimeout(900);
  const dlg = p.locator('[role="dialog"]');
  await dlg.locator('select').first().selectOption('teacher');
  await dlg.getByRole('button',{name:/Add role/i}).click();
  await p.waitForTimeout(1800);
}
// switch to the teacher workspace via the service (in-page)
await p.evaluate((pid)=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active[pid]=pid+':teacher'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); window.dispatchEvent(new CustomEvent('visionary:v2-change')); }, state.personId);
await p.waitForTimeout(1500);
await p.goto('http://127.0.0.1:4197/dashboard/home', { waitUntil:'networkidle', timeout:45000 });
await p.waitForTimeout(2000);
console.log('teacher home h1:', await p.evaluate(()=>document.querySelector('h1')?.textContent.trim().slice(0,60)||'(none)'));
console.log('role badge:', await p.evaluate(()=>{ const el=[...document.querySelectorAll('header span')].find(s=>/Teacher/.test(s.textContent)); return el?el.textContent.trim():'(check topbar)'; }));
const routes=['/dashboard/home','/dashboard/prepare','/dashboard/classes','/dashboard/learners','/dashboard/insights','/dashboard/growth','/dashboard/library'];
for (const r of routes) {
  try {
    await p.goto('http://127.0.0.1:4197'+r, { waitUntil:'networkidle', timeout:45000 });
    await p.waitForTimeout(1300);
    const info = await p.evaluate(()=>{ const m=document.querySelector('.workspace-shell #main')||document.querySelector('#main'); return { h1:document.querySelector('h1')?.textContent.trim().slice(0,50)||'(none)', ov: m? m.scrollWidth-m.clientWidth : null }; });
    const slug=r.replaceAll('/','-');
    await p.screenshot({ path:`artifacts/research/fap60-beta-verify/tch${slug}@${width}.png` });
    console.log(r.padEnd(26), 'h1:', info.h1.padEnd(52), 'ov:', info.ov);
  } catch(e){ console.log(r, 'ERR', String(e).slice(0,100)); }
}
console.log('page errors:', errs.length? errs.slice(0,4):'none');
await b.close();
