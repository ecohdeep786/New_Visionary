import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

// centering audit at 1440
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await page.waitForTimeout(2200);
const c = await page.evaluate(() => {
  const hero = document.querySelector('[data-section="01-hero"]');
  const cx = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.left + b.width / 2); };
  const h1 = hero.querySelector('h1');
  const sub = hero.querySelector('h1 ~ p, p');
  const btns = [...hero.querySelectorAll('a')].filter((a) => a.className.includes('rounded-full'));
  const cast = hero.querySelector('.apple-float');
  return { cast: cx(cast), h1: cx(h1), sub: cx(sub), cta: cx(btns[0].parentElement), viewport: 720 };
});
console.log('centers (want 720):', JSON.stringify(c));
await page.close();

// settled mobile frame
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await p2.waitForTimeout(1400);
await p2.screenshot({ path: 'scripts-tmp/hero-shots/centered/landing-390-settled.png' });
const m = await p2.evaluate(() => ({ scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
console.log('mobile overflow:', m.scrollX);
await browser.close();
