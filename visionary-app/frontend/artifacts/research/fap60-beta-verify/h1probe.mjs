import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
for (const r of ['/','/about','/research','/accessibility']) {
  await p.goto('http://127.0.0.1:4197'+r, { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(()=>{
    const all=[...document.querySelectorAll('h1')];
    return all.map(h=>({inMain:!!h.closest('main'), text:h.textContent.trim().slice(0,40), fs:getComputedStyle(h).fontSize, display:getComputedStyle(h).display}));
  });
  console.log(r, JSON.stringify(m));
}
await b.close();
