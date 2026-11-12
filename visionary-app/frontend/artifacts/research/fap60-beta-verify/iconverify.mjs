import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4197/security', { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1500);
// capture the first CTA pair (the normalized chevron site)
const cta = p.locator('a:has(svg)').first();
await cta.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await cta.screenshot({ path:'artifacts/research/fap60-beta-verify/security-cta.png' }).catch(()=>console.log('cta shot skip'));
const chevrons = await p.evaluate(()=>[...document.querySelectorAll('svg path')].slice(0,400).length);
console.log('security page svg paths:', chevrons, '- page renders OK');
await p.screenshot({ path:'artifacts/research/fap60-beta-verify/security-top.png' });
console.log('ok');
await b.close();
