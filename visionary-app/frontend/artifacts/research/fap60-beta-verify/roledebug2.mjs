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
await p.waitForTimeout(2500);
// close any open dialog via Escape + the dialog close buttons
for (let i=0;i<3;i++) {
  const open = await p.evaluate(()=>!!document.querySelector('[role="dialog"]'));
  if (!open) break;
  await p.keyboard.press('Escape').catch(()=>{});
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ const d=document.querySelector('[role="dialog"]'); if(d){const x=d.querySelector('[aria-label*="lose"], button.absolute, [data-radix-dialog-close]'); if(x) x.click();} });
  await p.waitForTimeout(800);
}
console.log('dialog open before flow:', await p.evaluate(()=>!!document.querySelector('[role="dialog"]')));
console.log('URL:', p.url());
// run the add-role flow
const sel = p.locator('select.workspace-switcher');
console.log('switcher found:', await sel.count());
await sel.selectOption('add');
await p.waitForTimeout(1200);
const dlg = p.locator('[role="dialog"]');
console.log('add-role dialog open:', await dlg.count());
await dlg.locator('select').first().selectOption('teacher');
await p.waitForTimeout(400);
await dlg.locator('button').last().click();
await p.waitForTimeout(2500);
const after = await p.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')); const d=document.querySelector('[role="dialog"]'); return {active:db.active, workspaces:db.workspaces.map(w=>w.id), personRoles:db.people[0].roles, dialogStillOpen:!!d, dialogText:d?d.textContent.trim().slice(0,240):null, url:location.pathname}; });
console.log('AFTER:', JSON.stringify(after,null,1));
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/role-debug2.png' });
await b.close();
