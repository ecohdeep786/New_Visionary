import { chromium } from 'playwright-core';
const base = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

// 1) reduced motion at 1440 — entrance must be fade-only, no float
const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const p1 = await c1.newPage();
const errors = [];
p1.on('pageerror', (e) => errors.push(String(e)));
await p1.goto(`${base}/`, { waitUntil: 'networkidle' });
await p1.waitForTimeout(1500);
await p1.screenshot({ path: 'scripts-tmp/hero-shots/after/landing-1440-reduced.png' });
const float = await p1.evaluate(() => {
  const el = document.querySelector('.apple-float');
  return el ? getComputedStyle(el).animationName : 'none-found';
});
console.log('reduced-motion float animation:', float);

// 2) lg boundary 1024 and mid 768 — overflow check
for (const [w, h] of [[1024, 768], [768, 900]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(`w${w}: ` + String(e)));
  await p.goto(`${base}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2400);
  const overflow = await p.evaluate(() => {
    const d = document.documentElement;
    const cast = document.querySelector('[data-section="01-hero"] .apple-float');
    const r = cast ? cast.getBoundingClientRect() : null;
    return { scrollX: d.scrollWidth - d.clientWidth, castWidth: r ? Math.round(r.width) : null, vw: d.clientWidth };
  });
  console.log(`w${w}:`, JSON.stringify(overflow));
  await p.screenshot({ path: `scripts-tmp/hero-shots/after/landing-${w}.png` });
  await c.close();
}
console.log('PAGEERRORS:', JSON.stringify(errors));
await browser.close();
