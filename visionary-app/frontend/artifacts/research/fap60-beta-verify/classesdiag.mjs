import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440, height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0,200)));
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
// dismiss the getting-started dialog if present
await p.getByRole('button',{name:/Skip introduction|Continue/i}).first().click({timeout:8000}).catch(()=>{});
await p.waitForTimeout(1200);
try { const c2=p.getByRole('button',{name:/Continue|Get started|Done|Open my outline/i}); if(await c2.count()) await c2.first().click({timeout:5000}); await p.waitForTimeout(900); } catch {}
await p.evaluate(()=>{ try{const d=document.querySelector('[data-state="open"] [data-radix-dialog-close], [data-radix-dialog-close]'); if(d) d.click();}catch{} });
await p.waitForTimeout(600);
// in-app: click the sidebar Classes link
const link = p.locator('a', { hasText: 'Classes' }).first();
console.log('classes link href:', await link.getAttribute('href').catch(()=>null));
await link.click();
await p.waitForTimeout(1800);
console.log('after in-app click URL:', p.url());
console.log('h1:', await p.evaluate(()=>document.querySelector('h1')?.textContent.trim().slice(0,50)||'(none)'));
// now try direct SPA navigation via history (no reload)
await p.evaluate(()=>window.history.pushState({},'','/dashboard/classes'));
await p.waitForTimeout(300);
await p.reload({ waitUntil:'networkidle', timeout:45000 });
await p.waitForTimeout(1500);
console.log('after reload URL:', p.url());
console.log('h1 after reload:', await p.evaluate(()=>document.querySelector('h1')?.textContent.trim().slice(0,50)||'(none)'));
console.log('page errors:', errs.length? errs.slice(0,3) : 'none');
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/classes-after-click.png' });
await b.close();
