/* Check explore card image load state after a scroll pass, then after a
   viewport resize to full page height (what fullPage screenshots do). */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });

await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});
await page.waitForLoadState('networkidle').catch(() => {});

const report = async (label) => {
  const r = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('[data-section="13-explore"] img'));
    return imgs.map((i) => ({ nw: i.naturalWidth, complete: i.complete, src: i.currentSrc.split('/').pop() }));
  });
  console.log(label, JSON.stringify(r));
};

await report('after scroll:');
await page.setViewportSize({ width: 1440, height: 3000 });
await page.waitForTimeout(800);
await report('after tall resize:');
await context.close();
await browser.close();
