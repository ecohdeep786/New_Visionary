// Internal, observational smoke: five role Homes at desktop and mobile widths.
// Run against a local Vite dev server with VISIONARY_BASE if not on port 5173.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const roles = [
  ['Aarav', 'student'], ['Dev', 'teacher'], ['Anika', 'parent'],
  ['Sam', 'professional'], ['School administrator', 'organization'],
];

try {
  for (const [scenario, role] of roles) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${base}/dev/scenarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: new RegExp(scenario) }).first().click();
    await page.waitForURL('**/dashboard/home');
    await page.reload({ waitUntil: 'networkidle' });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(350);
      const state = await page.evaluate(() => ({
        mounted: Boolean(document.querySelector('main')),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        alerts: [...document.querySelectorAll('[role="alert"]')].map(node => node.textContent?.trim()).filter(Boolean),
      }));
      if (!state.mounted || state.overflow > 1 || errors.length || state.alerts.length) {
        throw new Error(`${role} @${width}: ${JSON.stringify({ ...state, errors })}`);
      }
      console.log(`${role} @${width}: mounted; no overflow, alert, or page error`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
