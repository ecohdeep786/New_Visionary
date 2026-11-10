import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
// About hero
await p.goto('http://127.0.0.1:5173/about', { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1500);
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/about-hero.png' });
// mission card (Why Visionary exists)
const el = await p.$('#team');
if (el) await el.screenshot({ path:'artifacts/research/fap60-beta-verify/about-mission.png' });
// landing promo band
await p.goto('http://127.0.0.1:5173/', { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1800);
const secs = await p.$$('section');
for (const s of secs) {
  const t = (await s.innerText().catch(()=>'' )).slice(0,80).replace(/\n+/g,' ');
  if (/One intelligence/i.test(t)) { await s.screenshot({path:'artifacts/research/fap60-beta-verify/landing-bot.png'}); break; }
}
console.log('captured 3');
await b.close();
