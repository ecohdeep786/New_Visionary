import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4197/pricing', { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1200);
const pricing = await p.evaluate(()=>{
  return [...document.querySelectorAll('main h3')].slice(0,6).map(h=>({t:h.textContent.trim().slice(0,20), fs:getComputedStyle(h).fontSize, tag:h.tagName}));
});
console.log('PRICING h3 card names:', JSON.stringify(pricing));
await p.goto('http://127.0.0.1:4197/contact', { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1200);
const contact = await p.evaluate(()=>{
  return [...document.querySelectorAll('main h3')].slice(0,8).map(h=>({t:h.textContent.trim().slice(0,24), fs:getComputedStyle(h).fontSize}));
});
console.log('CONTACT h3:', JSON.stringify(contact));
await b.close();
