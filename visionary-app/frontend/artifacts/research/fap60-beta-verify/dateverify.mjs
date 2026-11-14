import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
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
await p.goto('http://127.0.0.1:4197/dashboard/progress', { waitUntil:'networkidle', timeout:45000 });
await p.waitForTimeout(1500);
const asOf = await p.evaluate(()=>{
  const time=document.querySelector('time');
  return time? time.textContent : '(no time element)';
});
console.log('Progress as-of renders:', asOf);
const card = await p.$('.v-progress-page');
if (card) { const shot = await card.boundingBox(); await p.evaluate(()=>window.scrollTo(0,0)); await p.screenshot({path:'artifacts/research/fap60-beta-verify/pr-progress-date.png', clip:{x:0,y:0,width:1440,height:500}}); }
console.log('ok');
await b.close();
