/* Re-shoot the router→journey join after the bridge padding fix. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(1200);
await page.evaluate(async () => {
  for (let y = 0; y < 5400; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
});
await page.evaluate(() => scrollTo(0, 3700));
await page.waitForTimeout(800);
await page.screenshot({ path: '../artifacts/research/landing-redesign-2026-10-16/captures/after/join-router-journey-2.png' });
const m = await page.evaluate(() => {
  const j = document.querySelector('[data-section="06-journey"]');
  const x = document.querySelector('[data-section="13-explore"]');
  return {
    exploreBottom: Math.round(x.getBoundingClientRect().bottom + scrollY),
    journeyTop: Math.round(j.getBoundingClientRect().top + scrollY),
    journeyPadTop: getComputedStyle(j).paddingTop,
  };
});
console.log(JSON.stringify(m));
await browser.close();
