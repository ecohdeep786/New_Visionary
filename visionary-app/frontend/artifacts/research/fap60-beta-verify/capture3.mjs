import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil:'networkidle', timeout:60000 });
const sec = p.locator('[data-section="05-intelligence"]').last();
await sec.scrollIntoViewIfNeeded();
await p.waitForTimeout(2000);
await sec.screenshot({ path:'artifacts/research/fap60-beta-verify/landing-promo.png' });
// measure the bot img at each width
for (const w of [390, 768, 1440]) {
  await p.setViewportSize({ width: w, height: 1000 });
  await p.waitForTimeout(700);
  const m = await p.evaluate(()=>{
    const img=[...document.querySelectorAll('[data-section="05-intelligence"] picture img')].pop();
    if(!img) return null; const r=img.getBoundingClientRect();
    return Math.round(r.width)+'x'+Math.round(r.height);
  });
  console.log('bot @'+w+':', m);
}
await p.setViewportSize({ width: 1440, height: 1000 });
await sec.screenshot({ path:'artifacts/research/fap60-beta-verify/landing-promo2.png' });
console.log('done');
await b.close();
