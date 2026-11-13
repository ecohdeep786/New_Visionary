import { chromium } from 'playwright-core';
const [route, out, width, full] = process.argv.slice(2);
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:Number(width)||1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4197'+route, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1800);
// scroll through to trigger lazy content, return to top if not full
if (full==='full') { await p.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));} window.scrollTo(0,0); }); await p.waitForTimeout(1200); await p.screenshot({ path: out, fullPage:true }); }
else await p.screenshot({ path: out });
console.log('saved', out);
await b.close();
