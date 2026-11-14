import { chromium } from 'playwright-core';
const width = Number(process.argv[2] || 1440);
const routes = process.argv[3] ? process.argv[3].split(',') : ['/dashboard/classes','/dashboard/connections','/dashboard/practice','/dashboard/build','/dashboard/notifications','/dashboard/plans'];
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0,140)));
await p.goto('http://127.0.0.1:4197/login', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(2000);
await p.getByRole('button',{name:'Continue with Email'}).first().click();
await p.locator('input[type="email"]').first().fill('qa.designer@example.test');
await p.getByRole('button',{name:/continue|next/i}).last().click();
await p.waitForTimeout(1200);
await p.locator('input[type="password"]').first().fill('Visionary#2026',{timeout:20000});
await p.getByRole('button',{name:/sign in/i}).last().click();
await p.waitForFunction(()=>{ try{const ws=JSON.parse(localStorage.getItem('visionary_workspace_v2')||'{}');return Object.keys(ws.active||{}).length>0;}catch{return false;} },{timeout:25000});
await p.waitForTimeout(1500);
for (const r of routes) {
  try {
    await p.goto('http://127.0.0.1:4197'+r, { waitUntil:'networkidle', timeout:45000 });
    await p.waitForTimeout(1400);
    const info = await p.evaluate(()=>{
      const m=document.querySelector('.workspace-shell #main')||document.querySelector('#main');
      const h1=document.querySelector('h1');
      return { h1: h1?h1.textContent.trim().slice(0,44):'(none)', overflow: m? m.scrollWidth - m.clientWidth : null };
    });
    const slug = r.replaceAll('/','-');
    await p.screenshot({ path:`artifacts/research/fap60-beta-verify/deep${slug}@${width}.png` });
    console.log(r.padEnd(30), 'h1:', info.h1.padEnd(46), 'overflow:', info.overflow);
  } catch(e){ console.log(r, 'ERROR', String(e).slice(0,110)); }
}
console.log('page errors:', errs.length? errs.slice(0,4) : 'none');
await b.close();
