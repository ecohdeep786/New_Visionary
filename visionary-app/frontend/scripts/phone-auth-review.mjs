import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Actual Web SDK -> demo Auth Emulator -> Nest -> transactional memory store.
// No live credentials, Firebase production users, or real SMS are involved.
const origin = 'http://127.0.0.1:5175', emulator = 'http://127.0.0.1:9099';
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../artifacts/tmp/phone-auth-browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [], errors = [], number = '+919' + Date.now().toString().slice(-9);
let page;
const pass = scenario => { results.push({ scenario, passed: true }); console.log('PASS:', scenario); };
try {
  page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 390, height: 844 });
  await page.setRequestInterception(true);
  page.on('request', request => [origin, emulator].includes(new URL(request.url()).origin) ? request.continue() : request.abort());
  const click = async label => {
    await page.waitForFunction(label => [...document.querySelectorAll('button, [role="menuitem"]')].some(e => e.textContent.trim() === label && !e.disabled), {}, label);
    await page.evaluate(label => [...document.querySelectorAll('button, [role="menuitem"]')].find(e => e.textContent.trim() === label && !e.disabled).click(), label);
  };
  const see = text => page.waitForFunction(text => document.body.innerText.includes(text), {}, text);
  const fill = async (selector, value) => { await page.waitForSelector(selector); await page.click(selector); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.type(selector, value); };
  const me = () => page.evaluate(async () => { const response = await fetch('/api/auth/me?passive=1'); return { status: response.status, profile: await response.json() }; });
  const code = async () => {
    const response = await fetch(`${emulator}/emulator/v1/projects/demo-visionary-auth/verificationCodes`);
    return (await response.json()).verificationCodes.filter(item => item.phoneNumber === number).at(-1).code;
  };
  const open = async route => { await page.goto(origin + route, { waitUntil: 'networkidle0' }); await click('Continue with phone'); };
  const send = async () => { await fill('input[type="tel"]', number); await click('Send code'); await see('Enter the 6-digit code'); };
  const verify = async candidate => { await fill('input[autocomplete="one-time-code"]', candidate); await click('Verify and continue'); };
  await open('/register');
  await fill('input[type="tel"]', '+91123'); await click('Send code'); await see('Enter an Indian mobile number');
  pass('invalid-number-stays-on-phone-form');
  await send();
  assert.equal(await page.$eval('button[type="button"][disabled]', e => /Resend/.test(e.textContent)), true);
  pass('sms-request-has-resend-cooldown');
  await page.screenshot({ path: path.join(output, 'phone-mobile-code.png'), fullPage: true });
  const valid = await code();
  await verify(valid === '000000' ? '111111' : '000000'); await see('That code is not correct');
  assert.equal((await me()).status, 401);
  pass('wrong-sms-code-denied-without-product-session');
  await verify(valid); await page.waitForFunction(() => location.pathname === '/onboarding'); await see('I am a Professional');
  const first = (await me()).profile;
  assert.equal(first.phone_number, number); assert.equal(first.onboarding_complete, false); assert.equal(first.email, '');
  await see(number);
  pass('new-phone-account-opens-onboarding-and-shows-account-switch');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(e => e.textContent.includes('I am a Professional')).click()); await click('Continue');
  await fill('input[type="text"]', 'Phone Fixture'); await page.select('select', 'adult'); await click('Continue');
  await see('Make Visionary work for you'); await click('Skip for now'); await see('Ready to start with Visionary?'); await click('Start using Visionary');
  await page.waitForFunction(() => location.pathname === '/dashboard/home');
  await page.goto(origin + '/dashboard/home', { waitUntil: 'networkidle0' }); await page.waitForSelector('.visionary-workspace');
  await see('Welcome to Visionary'); await click('Continue'); await see('Find your next step'); await click('Continue'); await see('You’re in control'); await click('Start exploring');
  await page.waitForFunction(() => !document.getElementById('getting-started-title'));
  await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('.visionary-workspace');
  assert.equal((await me()).profile.id, first.id);
  assert.equal(await page.$('#getting-started-title'), null);
  assert.equal(await page.$eval('body', e => e.scrollWidth <= innerWidth), true);
  pass('phone-setup-introduction-and-remembered-device-persist');
  const issuer = page, peerContext = await browser.createBrowserContext();
  page = await peerContext.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', request => [origin, emulator].includes(new URL(request.url()).origin) ? request.continue() : request.abort());
  await open('/login'); await send(); await verify(await code());
  await page.waitForFunction(() => location.pathname === '/dashboard/home'); await page.waitForSelector('.visionary-workspace');
  assert.equal((await me()).profile.id, first.id);
  const peer = page; page = issuer;
  pass('independent-desktop-device-sees-shared-completed-phone-account');
  await page.click('[aria-label="Open account menu"]'); await click('Sign out on all devices'); await see('Continue with Email');
  assert.equal((await me()).status, 401);
  assert.equal(await peer.evaluate(async () => (await fetch('/api/auth/me?passive=1')).status), 401);
  await peerContext.close();
  pass('phone-account-global-logout-retires-both-device-sessions');
  // The identity cutoff is second-resolution; request a genuinely later auth.
  await new Promise(resolve => setTimeout(resolve, 1100));
  await open('/login'); await send(); await verify(await code());
  await page.waitForFunction(() => location.pathname === '/dashboard/home'); await page.waitForSelector('.visionary-workspace');
  const returning = (await me()).profile;
  assert.equal(returning.id, first.id); assert.equal(returning.onboarding_complete, true); assert.equal(returning.getting_started_complete, true);
  pass('returning-phone-login-reuses-same-uid-and-skips-completed-onboarding');
  await page.screenshot({ path: path.join(output, 'phone-mobile-returning.png'), fullPage: true });
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ environment: 'demo Auth Emulator, real SDK/Nest, memory Firestore', results }, null, 2));
} catch (error) {
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); await fs.writeFile(path.join(output, 'failure.txt'), await page.$eval('body', e => e.innerText)); }
  throw error;
} finally { await browser.close(); }
