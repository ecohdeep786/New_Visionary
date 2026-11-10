import { chromium } from 'playwright-core';
const base = 'http://127.0.0.1:5173';
const shots = [
  ['/', 'home'], ['/student', 'student'], ['/pricing', 'pricing'],
  ['/download', 'download'], ['/login', 'login'], ['/safety', 'safety']
];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await ctx.newPage();
for (const [route, name] of shots) {
  await page.goto(base + route, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => !document.body || !document.body.innerText.includes('Loading...'), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `artifacts/qa-2026-10-20/evidence/${name}-390-top.png`, clip: { x: 0, y: 0, width: 390, height: 844 } });
  await page.evaluate(() => window.scrollTo(0, 844 * 2));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `artifacts/qa-2026-10-20/evidence/${name}-390-mid.png`, clip: { x: 0, y: 0, width: 390, height: 844 } });
}
await browser.close();
console.log('done');
