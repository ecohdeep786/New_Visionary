/* Live interaction + console check for /careers. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 160)); });
page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR ${String(err).slice(0, 160)}`));

await page.goto('http://localhost:5173/careers', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(800);

const checks = {};
checks.mailtoHrefs = await page.evaluate(() => [...document.querySelectorAll('#main a[href^="mailto:"]')].map((a) => a.getAttribute('href').slice(0, 46)));
checks.selectChevrons = await page.evaluate(() => document.querySelectorAll('#overview .relative > svg').length);
checks.railItems = await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Careers sections"] a')].slice(0, 6).map((a) => a.textContent.trim().slice(0, 14)));

// Rail click -> teams chapter scrolls into view
await page.click('nav[aria-label="Careers sections"] a[href="#teams"]');
await page.waitForTimeout(1200);
checks.teamsInView = await page.evaluate(() => {
  const r = document.querySelector('#teams').getBoundingClientRect();
  return { top: Math.round(r.top), scrollY: Math.round(window.scrollY) };
});

// Roles anchor link -> hiring chapter scrolls into view
await page.evaluate(() => document.querySelector('#roles a[href="#hiring"]').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
await page.click('#roles a[href="#hiring"]');
await page.waitForTimeout(1200);
checks.hiringInView = await page.evaluate(() => {
  const r = document.querySelector('#hiring').getBoundingClientRect();
  return { top: Math.round(r.top), scrollY: Math.round(window.scrollY) };
});

checks.consoleErrors = consoleErrors;
console.log(JSON.stringify(checks, null, 1));
await browser.close();
