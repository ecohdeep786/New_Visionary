import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Render the compiled app on an isolated loopback preview. Only /auth/me is
// fictional. Do not click real OAuth buttons or call identity providers here.
const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://127.0.0.1:5184';
const url = new URL(origin);
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol === 'http:');
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../artifacts/qa/kan34/browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [];
try {
  for (const width of [1280, 390]) {
    for (const route of ['/login', '/register']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      const errors = [], unexpected = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewport({ width, height: 900 });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const target = new URL(request.url());
        if (target.origin === origin && target.pathname === '/api/auth/me') {
          return request.respond({ status: 401, contentType: 'application/json', body: '{"message":"Sign in to continue."}' });
        }
        if (target.origin !== origin || target.pathname.startsWith('/api/')) {
          unexpected.push(`${target.origin}${target.pathname}`);
          return request.abort();
        }
        return request.continue();
      });
      await page.goto(`${origin}${route}?returnTo=%2Fdashboard%2Fplans`, { waitUntil: 'networkidle0' });
      const methods = await page.evaluate(() => [...document.querySelectorAll('button')].map(button => ({
        name: button.getAttribute('aria-label') || button.textContent.trim(), disabled: button.disabled,
        description: button.getAttribute('aria-describedby') ? document.getElementById(button.getAttribute('aria-describedby'))?.textContent : null,
      })));
      for (const name of ['Mobile sign-in unavailable', 'Microsoft sign-in unavailable', 'Organization sign-in unavailable']) {
        const method = methods.find(button => button.name === name);
        assert.equal(method?.disabled, true, `${route} ${width}: ${name}`);
        assert.match(method.description, /unavailable/);
      }
      for (const name of ['Continue with Email', 'Continue with Google', 'Continue with Apple']) {
        assert.equal(methods.find(button => button.name === name)?.disabled, false, name);
      }
      assert.equal(await page.$('input[type="tel"]'), null);
      await page.screenshot({ path: path.join(output, `${route.slice(1)}-${width}.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Continue with Email')).click());
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', 'fixture@example.test');
      await page.evaluate(() => document.querySelector('form button[type="submit"]').click());
      await page.waitForSelector('input[type="password"]');
      assert.match(page.url(), /returnTo=%2Fdashboard%2Fplans/);
      assert.deepEqual(errors, []);
      assert.deepEqual(unexpected, [], 'No provider or mutation request should occur');
      results.push({ route, width, passed: true, realProviderAcceptance: false });
      await context.close();
    }
  }
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
