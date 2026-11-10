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
for (const name of [/Skip introduction/i, /Continue/i, /Get started/i, /Done/i]) {
  const btn = p.getByRole('button',{name}).first();
  if (await btn.count().catch(()=>0)) { await btn.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(700); }
}
// open the switcher select (native)
const select = p.locator('select.workspace-switcher, select[aria-label]');
console.log('switcher count:', await select.count());
const opts = await select.first().locator('option').allTextContents();
console.log('switcher options:', JSON.stringify(opts));
const addValue = await select.first().locator('option').evaluateAll(os=>{
  const add = os.find(o=>/add/i.test(o.textContent||''));
  return add? add.value : null;
});
if (addValue) {
  await p.selectOption('select.workspace-switcher, select[aria-label]', addValue);
  await p.waitForTimeout(1200);
  await p.screenshot({ path:'artifacts/research/fap60-beta-verify/role-add-dialog.png' });
  // pick teacher in the dialog
  const dialog = p.locator('[role="dialog"]');
  const roleSelect = dialog.locator('select').first();
  const roleOpts = await roleSelect.locator('option').allTextContents();
  console.log('role options:', JSON.stringify(roleOpts));
  await roleSelect.selectOption({ index: 0 });
  await p.waitForTimeout(300);
  const chosen = await roleSelect.locator('option:checked').textContent();
  console.log('chosen role:', chosen);
  const cb=dialog.locator('input[type="checkbox"]'); if(await cb.count()) await cb.check(); await p.waitForTimeout(300); await dialog.locator('button.primary, button[type="button"]').last().click();
  await p.waitForTimeout(2000);
  console.log('URL after add:', p.url());
  const wsNow = await p.evaluate(()=>{ try{const ws=JSON.parse(localStorage.getItem('visionary_workspace_v2')||'{}');return Object.entries(ws.active||{}).map(([k,v])=>v.role||v);}catch{return null;} });
  console.log('active workspace now:', JSON.stringify(wsNow));
  const h1 = await p.evaluate(()=>document.querySelector('h1')?.textContent.trim().slice(0,60)||'(none)');
  console.log('h1 after role add:', h1);
  await p.screenshot({ path:'artifacts/research/fap60-beta-verify/teacher-home.png' });
}
console.log('page errors:', errs.length? errs.slice(0,3):'none');
await b.close();
