import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
// About mission card with lazy-load scroll
await p.goto('http://127.0.0.1:5173/about', { waitUntil:'networkidle', timeout:60000 });
await p.evaluate(()=>document.querySelector('#team').scrollIntoView({block:'center'}));
await p.waitForTimeout(2000);
const el = await p.$('#team');
await el.screenshot({ path:'artifacts/research/fap60-beta-verify/about-mission2.png' });
// also measure the img
const m = await p.evaluate(()=>{
  const img=document.querySelector('#team img');
  if(!img) return {found:false};
  const r=img.getBoundingClientRect();
  return {found:true, complete:img.complete, naturalWidth:img.naturalWidth, w:Math.round(r.width), h:Math.round(r.height), src:img.currentSrc.split('/').pop()};
});
console.log('mission img:', JSON.stringify(m));
// Landing promo band (bare bot)
await p.goto('http://127.0.0.1:5173/', { waitUntil:'networkidle', timeout:60000 });
const target = await p.evaluateHandle(()=>{
  const els=[...document.querySelectorAll('section')];
  return els.find(s=>/promo|intelligence/i.test(s.className+s.id) && s.querySelector('picture img'));
});
const promo = target._element || target.asElement?.();
if (promo) { await promo.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await promo.screenshot({ path:'artifacts/research/fap60-beta-verify/landing-promo.png' }); console.log('promo captured'); }
else console.log('promo section not found');
await b.close();
