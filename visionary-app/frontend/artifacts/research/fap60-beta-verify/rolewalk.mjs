import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0,180)));
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
// dismiss welcome dialog
for (const name of [/Skip introduction/i, /Continue/i, /Get started/i, /Done/i]) {
  const btn = p.getByRole('button',{name}).first();
  if (await btn.count().catch(()=>0)) { await btn.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(800); }
}
console.log('URL after dismiss:', p.url());
// open the workspace switcher
const switcher = p.locator('.workspace-shell header button, header button').filter({ hasText: /Personal|Learner/ }).first();
await switcher.click({ timeout: 8000 });
await p.waitForTimeout(1200);
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/role-switcher-open.png' });
// dump menu items
const items = await p.evaluate(()=>{
  const menu=document.querySelector('[role="menu"], [data-radix-popper-content-wrapper]');
  return menu? [...menu.querySelectorAll('button, a, [role="menuitem"]')].map(el=>el.textContent.trim().slice(0,40)).filter(Boolean) : [];
});
console.log('switcher items:', JSON.stringify(items, null, 1));
console.log('page errors:', errs.length? errs.slice(0,3):'none');
await b.close();
