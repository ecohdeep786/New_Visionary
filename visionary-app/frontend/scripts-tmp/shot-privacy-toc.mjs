/* Mobile TOC open-state shot for /privacy (interaction state).
   Usage: node scripts-tmp/shot-privacy-toc.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173/privacy', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(800);
await page.click('button[aria-controls="privacy-mobile-contents"]');
await page.waitForTimeout(500);
await page.screenshot({
  path: 'artifacts/research/remaining-pages-audit-2026-10-16/captures/after-mobile/privacy-after-toc-open.jpg',
  type: 'jpeg',
  quality: 82,
});
console.log('shot saved');
await browser.close();
