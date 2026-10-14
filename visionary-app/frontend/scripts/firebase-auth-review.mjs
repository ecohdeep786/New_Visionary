import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Fictional HTTP fixtures only. Never signs into or creates a production identity.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'artifacts/tmp/firebase-auth-browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [];
try {
  for (const scenario of ['anonymous', 'first-time', 'returning', 'storage-down']) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1280, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/api/auth/me') {
        const status = scenario === 'anonymous' ? 401 : scenario === 'storage-down' ? 503 : 200;
        const profile = { id: 'firebase-review-adult', email: 'adult@example.test', full_name: 'Fictional Adult', identity: 'student', age_band: 'adult', education_stage: 'higher_ed', auth_source: 'firebase', onboarding_complete: scenario === 'returning' };
        return request.respond({ status, contentType: 'application/json', body: JSON.stringify(status === 200 ? profile : { message: status === 503 ? 'Account storage is unavailable. Retry without changing your setup.' : 'Sign in to continue.' }) });
      }
      if (url.origin !== 'http://localhost:5173') return request.abort();
      return request.continue();
    });
    await page.goto(`http://localhost:5173/${scenario === 'storage-down' ? 'dashboard/home' : 'login'}`, { waitUntil: 'networkidle0' });
    if (scenario === 'first-time') {
      await page.waitForFunction(() => location.pathname === '/onboarding');
      assert.match(await page.$eval('body', element => element.innerText), /I am a Learner/);
    } else if (scenario === 'returning') {
      await page.waitForFunction(() => location.pathname === '/dashboard/home');
      assert.equal(await page.$('.visionary-workspace'), null === true ? null : await page.$('.visionary-workspace'));
      assert.doesNotMatch(await page.$eval('body', element => element.innerText), /Your account profile is saved online/);
      await page.reload({ waitUntil: 'networkidle0' }); assert.equal(new URL(page.url()).pathname, '/dashboard/home');
      await page.goto('http://localhost:5173/onboarding', { waitUntil: 'networkidle0' });
      assert.equal(new URL(page.url()).pathname, '/dashboard/home');
    } else if (scenario === 'storage-down') {
      assert.match(await page.$eval('body', element => element.innerText), /Retry loading account/);
      assert.equal(new URL(page.url()).pathname, '/dashboard/home');
    } else {
      const click = text => page.evaluate(text => { const button = [...document.querySelectorAll('button')].find(element => element.textContent.includes(text)); if (!button) throw Error('Missing button'); button.click(); }, text);
      await click('Continue with Email'); await page.waitForSelector('input[type="email"]'); await page.type('input[type="email"]', 'fixture@example.test'); await click('Continue'); await page.waitForSelector('input[type="password"]');
      await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' }); await click('Continue with Email'); await page.waitForSelector('input[type="email"]'); await page.type('input[type="email"]', 'fixture@example.test'); await click('Continue'); await page.waitForSelector('input[type="password"]');
      assert.match(await page.$eval('body', element => element.innerText), /Create a Visionary account/);
    }
    assert.deepEqual(errors, [], `${scenario}: browser exceptions`);
    await page.screenshot({ path: path.join(output, `${scenario}.png`), fullPage: true });
    results.push({ scenario, path: new URL(page.url()).pathname, passed: true }); await context.close();
  }
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
