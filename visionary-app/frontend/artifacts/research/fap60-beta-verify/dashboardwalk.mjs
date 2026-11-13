import { chromium } from 'playwright-core';
const width = Number(process.argv[2] || 1440);
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0,160)));
// sign in via the real UI
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
console.log('signed in at', p.url());
const routes = ['/dashboard','/dashboard/learn','/dashboard/ask','/dashboard/progress','/dashboard/personalization','/dashboard/privacy','/dashboard/subscription'];
for (const r of routes) {
  try {
    await p.goto('http://127.0.0.1:4197'+r, { waitUntil:'networkidle', timeout:45000 });
    await p.waitForTimeout(1500);
    const overflow = await p.evaluate(()=>{ const m=document.querySelector('.workspace-shell #main')||document.querySelector('#main'); return m? m.scrollWidth - m.clientWidth : null; });
    const h1 = await p.evaluate(()=>document.querySelector('h1')?.textContent.trim().slice(0,40)||'(none)');
    await p.screenshot({ path:`artifacts/research/fap60-beta-verify/pr-dash${r.replaceAll('/','-')}@${width}.png` });
    console.log(r.padEnd(28), 'h1:', h1.padEnd(42), 'mainOverflowPx:', overflow);
  } catch(e){ console.log(r, 'ERROR', String(e).slice(0,100)); }
}
console.log('page errors:', errs.length? errs.slice(0,4) : 'none');
await b.close();
