import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Complete Web SDK workflow on demo Auth only, with memory profile/session storage.
const origin = 'http://127.0.0.1:5175', emulator = 'http://127.0.0.1:9099', project = 'demo-visionary-auth';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), output = path.join(root, 'artifacts/tmp/auth-emulator-browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const email = `auth-review-${Date.now()}@fixture.invalid`, password = 'Fixture-only-strong-789!', updatedPassword = 'Fixture-only-updated-987!';
const results = [];
const baseline = await (await fetch('http://127.0.0.1:3035/__test/status')).json();
let activePage;
try {
  const page = await browser.newPage(); activePage = page; await page.setViewport({ width: 1280, height: 900 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (![origin, emulator].includes(url.origin)) return request.abort();
    return request.continue();
  });
  const text = () => page.$eval('body', element => element.innerText);
  const click = async label => {
    await page.waitForFunction(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), {}, label);
    await page.evaluate(label => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === label && !element.disabled).click(), label);
  };
  const fill = async (selector, value) => { await page.waitForSelector(selector); await page.$eval(selector, element => { element.value = ''; element.dispatchEvent(new Event('input', { bubbles: true })); }); await page.type(selector, value); };
  const see = value => page.waitForFunction(value => document.body.innerText.includes(value), {}, value);
  const code = async mode => {
    const response = await fetch(`${emulator}/emulator/v1/projects/${project}/oobCodes`), data = await response.json();
    const action = data.oobCodes.filter(item => item.email === email && item.requestType === mode).at(-1);
    assert.ok(action, 'Expected emulator email action'); return action.oobCode;
  };
  const assertSafe = async () => assert.doesNotMatch(await text(), /Firebase:|auth\/|stack trace|TypeError|idToken|private_key/);
  const signIn = async candidate => {
    await page.goto(`${origin}/login`, { waitUntil: 'networkidle0' }); await click('Continue with Email'); await fill('input[type="email"]', email); await click('Continue'); await fill('input[autocomplete="current-password"]', candidate); await click('Sign in');
  };
  await page.goto(`${origin}/register`, { waitUntil: 'networkidle0' }); await click('Continue with Email'); await fill('input[type="email"]', email); await click('Continue');
  await page.waitForSelector('input[type="password"]'); const signupFields = await page.$$('input[type="password"]'); await signupFields[0].type(password); await signupFields[1].type(password);
  await click('Create account'); await see('I verified my email'); await assertSafe();
  results.push({ scenario: 'registration-awaits-verification', passed: true }); console.log('PASS: registration-awaits-verification');
  const verify = await code('VERIFY_EMAIL');
  const actionPage = await browser.newPage(); await actionPage.goto(`${origin}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(verify)}`, { waitUntil: 'networkidle0' });
  await actionPage.waitForFunction(() => document.body.innerText.includes('Your email is verified.')); await actionPage.close();
  await click('I verified my email'); await page.waitForFunction(() => location.pathname === '/onboarding');
  results.push({ scenario: 'verified-signup-loads-first-time-onboarding', passed: true }); console.log('PASS: verified-signup-loads-first-time-onboarding');
  await see('I am a Professional');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.includes('I am a Professional')).click()); await click('Continue');
  await fill('input[type="text"]', 'Fixture Adult'); await page.select('select', 'adult'); await click('Continue');
  await fill('input[type="text"]', 'Learn software engineering'); await click('Continue');
  await click('Start using Visionary');
  await page.waitForFunction(() => location.pathname === '/dashboard/home');
  // The introduction is a separate UI step; reload proves saved completion can resume.
  await page.goto(`${origin}/dashboard/home`, { waitUntil: 'networkidle0' }); await page.waitForSelector('.visionary-workspace');
  assert.doesNotMatch(await text(), /Your account profile is saved online/);
  await page.reload({ waitUntil: 'networkidle0' }); assert.equal(new URL(page.url()).pathname, '/dashboard/home');
  results.push({ scenario: 'onboarding-persists-and-dashboard-resumes', passed: true }); console.log('PASS: onboarding-persists-and-dashboard-resumes');
  await see('Welcome to Visionary'); await click('Continue'); await see('Find your next step'); await click('Continue'); await see('You’re in control'); await click('Start exploring');
  await page.waitForFunction(() => !document.getElementById('getting-started-title'));
  await page.reload({ waitUntil: 'networkidle0' }); assert.equal(await page.$('#getting-started-title'), null);
  results.push({ scenario: 'introduction-acknowledgement-persists-on-account', passed: true }); console.log('PASS: introduction-acknowledgement-persists-on-account');
  await page.goto(`${origin}/forgot-password`, { waitUntil: 'networkidle0' }); await fill('input[type="email"]', email); await click('Send reset link'); await see('Check your email');
  results.push({ scenario: 'forgot-password-sends-real-emulator-action', passed: true }); console.log('PASS: forgot-password-sends-real-emulator-action');
  const reset = await code('PASSWORD_RESET');
  await page.goto(`${origin}/reset-password?oobCode=${encodeURIComponent(reset)}`, { waitUntil: 'networkidle0' }); await see('Reset password');
  const fields = await page.$$('input[type="password"]'); await fields[0].type(updatedPassword); await fields[1].type(updatedPassword); await click('Reset password'); await see('Your password has been updated.'); await assertSafe();
  await page.screenshot({ path: path.join(output, 'reset-success.png'), fullPage: true });
  results.push({ scenario: 'password-reset-signs-out-and-preserves-account', passed: true }); console.log('PASS: password-reset-signs-out-and-preserves-account');
  await page.goto(`${origin}/reset-password?oobCode=${encodeURIComponent(reset)}`, { waitUntil: 'networkidle0' }); await see('Request a new reset link'); await assertSafe();
  results.push({ scenario: 'used-reset-link-offers-new-request', passed: true }); console.log('PASS: used-reset-link-offers-new-request');
  await signIn(password); await see('The email or password is incorrect.'); await assertSafe();
  await page.screenshot({ path: path.join(output, 'invalid-credentials.png'), fullPage: true });
  results.push({ scenario: 'old-password-denied-with-human-message', passed: true }); console.log('PASS: old-password-denied-with-human-message');
  await signIn(updatedPassword); await page.waitForFunction(() => location.pathname === '/dashboard/home');
  results.push({ scenario: 'new-password-resumes-same-account', passed: true }); console.log('PASS: new-password-resumes-same-account');
  const status = await (await fetch('http://127.0.0.1:3035/__test/status')).json();
  assert.equal(status.accounts, baseline.accounts + 1); assert.ok(status.events.some(event => event.type === 'sign_in' && event.hasIp && event.hasBrowser)); assert.ok(status.events.some(event => event.type === 'sign_out' && event.hasIp)); assert.ok(status.sessions.some(session => session.revoked));
  const context = await browser.createBrowserContext(), duplicate = await context.newPage();
  await duplicate.goto(`${origin}/register`, { waitUntil: 'networkidle0' });
  await duplicate.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === 'Continue with Email').click());
  await duplicate.waitForSelector('input[type="email"]'); await duplicate.type('input[type="email"]', email); await duplicate.evaluate(() => document.querySelector('button[type="submit"]').click());
  await duplicate.waitForSelector('input[type="password"]'); const duplicateFields = await duplicate.$$('input[type="password"]'); await duplicateFields[0].type(updatedPassword); await duplicateFields[1].type(updatedPassword); await duplicate.evaluate(() => document.querySelector('button[type="submit"]').click());
  await duplicate.waitForFunction(() => document.body.innerText.includes('An account already uses this email.'));
  assert.doesNotMatch(await duplicate.$eval('body', e => e.innerText), /Firebase:|auth\//); assert.ok(await duplicate.$('a[href="/forgot-password"]'));
  await duplicate.setViewport({ width: 360, height: 640 });
  assert.equal(new URL(duplicate.url()).pathname, '/register');
  assert.equal(await duplicate.$eval('body', e => e.scrollWidth <= innerWidth), true);
  await duplicate.$eval('button[type="submit"]', e => e.scrollIntoView());
  assert.equal(await duplicate.$eval('button[type="submit"]', e => { const rect = e.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; }), true);
  await duplicate.screenshot({ path: path.join(output, 'mobile-duplicate.png'), fullPage: true });
  await context.close();
  results.push({ scenario: 'duplicate-registration-offers-sign-in-and-reset', passed: true }); console.log('PASS: duplicate-registration-offers-sign-in-and-reset');
  await page.goto(`${origin}/forgot-user-id`, { waitUntil: 'networkidle0' }); assert.doesNotMatch(await text(), /we.ll send your account details|Check your messages/);
  results.push({ scenario: 'truthful-recovery-and-mobile-layout', passed: true }); console.log('PASS: truthful-recovery-and-mobile-layout');
  assert.deepEqual(errors, []); await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, recordChecks: status }, null, 2));
  console.log(JSON.stringify(results));
} catch (error) {
  if (activePage) { await activePage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); await fs.writeFile(path.join(output, 'failure.txt'), await activePage.$eval('body', element => element.innerText)); }
  console.error('Auth emulator browser review failed at scenario', results.length + 1, ':', error.message); throw error;
}
finally { await browser.close(); }
