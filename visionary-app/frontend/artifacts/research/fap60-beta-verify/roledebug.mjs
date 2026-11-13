import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4197/login', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(2000);
await p.getByRole('button',{name:'Continue with Email'}).first().click();
await p.locator('input[type="email"]').first().fill('qa.designer@example.test');
await p.getByRole('button',{name:/continue|next/i}).last().click();
await p.waitForTimeout(1200);
await p.locator('input[type="password"]').first().fill('Visionary#2026',{timeout:20000});
await p.getByRole('button',{name:/sign in/i}).last().click();
await p.waitForFunction(()=>{ try{const ws=JSON.parse(localStorage.getItem('visionary_workspace_v2')||'{}');return Object.keys(ws.active||{}).length>0;}catch{return false;} },{timeout:25000});
await p.waitForTimeout(2000);
for (const name of [/Skip introduction/i, /Continue/i, /Get started/i, /Done/i]) {
  const btn = p.getByRole('button',{name}).first();
  if (await btn.count().catch(()=>0)) { await btn.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(700); }
}
const before = await p.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); return {people:db.people.map(x=>({id:x.id,roles:x.roles,ageBand:x.ageBand})), workspaces:db.workspaces.map(w=>w.id), active:db.active}; });
console.log('BEFORE:', JSON.stringify(before,null,1));
// open dialog
const select = p.locator('select.workspace-switcher');
await p.selectOption('select.workspace-switcher', 'add');
await p.waitForTimeout(1000);
const dialog = p.locator('[role="dialog"]');
console.log('dialog open:', await dialog.count());
await dialog.locator('select').first().selectOption('teacher');
const cb = dialog.locator('input[type="checkbox"]');
if (await cb.count()) { await cb.check(); console.log('checkbox ticked'); }
await p.waitForTimeout(400);
const dbAfterSelect = await p.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); return db.active; });
console.log('active after select add:', JSON.stringify(dbAfterSelect));
await dialog.locator('button').last().click();
await p.waitForTimeout(2500);
const after = await p.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); const dlg=document.querySelector('[role="dialog"]'); return {active:db.active, workspaces:db.workspaces.map(w=>w.id), dialogStillOpen: !!dlg, dialogText: dlg? dlg.textContent.trim().slice(0,200):null, url: location.pathname}; });
console.log('AFTER:', JSON.stringify(after,null,1));
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/role-debug.png' });
await b.close();
