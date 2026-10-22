import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Fictional browser fixture for account switching, not live provider acceptance.
const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5184';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../artifacts/qa/kan34/onboarding-account');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [];
try {
  for (const phase of ['identity', 'flow', 'review']) for (const width of [1280, 390]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    const profile = { id: 'account-switch-fixture', email: 'fixture@example.test', full_name: 'Fixture Adult', onboarding_complete: false, auth_source: 'firebase' };
    const draftKey = `visionary_onboarding_${profile.id}`;
    const draft = { phase, currentStepId: 'about', data: { full_name: 'Saved draft', identity: 'professional', education_stage: 'professional', age_band: 'adult', preferred_language: 'English' } };
    await page.evaluateOnNewDocument(({ key, draft }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(draft)); }, { key: draftKey, draft });
    let logoutCalls = 0, signedOut = false, writes = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const target = new URL(request.url());
      const respond = (status, body) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
      if (target.pathname === '/api/auth/me') return respond(signedOut ? 401 : 200, signedOut ? { message: 'Signed out' } : profile);
      if (target.pathname === '/api/auth/csrf') return respond(200, { token: 'a'.repeat(64) });
      if (target.pathname === '/api/auth/logout') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        assert.equal(request.headers()['x-csrf-token'], 'a'.repeat(64));
        if (++logoutCalls === 1) return respond(503, { message: 'Fictional storage outage' });
        signedOut = true; return respond(200, { ok: true });
      }
      if (target.pathname.startsWith('/api/') && request.method() !== 'GET') { writes++; return respond(500, {}); }
      if (target.origin !== origin) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/onboarding?returnTo=%2Fdashboard%2Fsubscription`, { waitUntil: 'networkidle0' });
    const saved = await page.evaluate(key => localStorage.getItem(key), draftKey);
    assert.ok(saved);
    const click = () => page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(element => element.textContent === 'Use a different account');
      assertButton(button);
      function assertButton(value) { if (!value || value.disabled) throw new Error('Account switch unavailable'); }
      button.click(); button.click();
    });
    await click();
    await page.waitForSelector('[role="alert"]');
    assert.equal(logoutCalls, 1, 'Duplicate switch must not repeat logout');
    assert.equal(new URL(page.url()).pathname, '/onboarding');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), saved);
    assert.match(await page.$eval('body', element => element.innerText), /fixture@example.test/);
    await click();
    await page.waitForFunction(() => location.pathname === '/login');
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/dashboard/subscription');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), saved);
    assert.equal(logoutCalls, 2);
    assert.equal(writes, 0, 'Switching accounts must not save a profile or onboarding');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, `${phase}-${width}.png`), fullPage: true });
    results.push({ phase, width, passed: true, realProviderAcceptance: false });
    await context.close();
  }
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
