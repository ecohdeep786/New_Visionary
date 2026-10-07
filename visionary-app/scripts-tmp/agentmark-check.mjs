import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const errors = [];
const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const p1 = await c1.newPage();
p1.on('pageerror', (e) => errors.push('rm: ' + String(e)));
await p1.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await p1.waitForTimeout(1500);
const rm = await p1.evaluate(() =>
  [...document.querySelectorAll('.agent-anim')].filter((el) => getComputedStyle(el).animationName !== 'none').length
);
console.log('reduced-motion active agent animations (want 0):', rm);
await c1.close();
const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p2 = await c2.newPage();
p2.on('pageerror', (e) => errors.push('m: ' + String(e)));
await p2.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await p2.waitForTimeout(1500);
const ov = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('mobile overflow:', ov);
await c2.close();
console.log('PAGEERRORS:', JSON.stringify(errors));
await browser.close();
