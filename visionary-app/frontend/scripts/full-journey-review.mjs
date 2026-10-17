import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Real Web/Admin SDK identity and cookies on demo Auth; memory app data and fictional payments.
const origin = 'http://127.0.0.1:5175', emulator = 'http://127.0.0.1:9099', project = 'demo-visionary-auth';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), output = path.join(root, 'artifacts/tmp/full-journey-browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true }), results = [], errors = [];
const email = `journey-${Date.now()}@fixture.invalid`, password = 'Journey-only-password-789!';
let activePage;
const fakeSDK = `window.Razorpay=class{constructor(o){this.o=o}on(){}close(){this.o.modal.ondismiss()}async open(){const r=await fetch('/api/__test/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:this.o.subscription_id})});if(!r.ok)throw Error('Fictional provider could not confirm');this.o.handler(await r.json())}};`;
async function newPage(context, width = 1280) {
  const page = await context.newPage(); activePage = page; await page.setViewport({ width, height: width < 500 ? 844 : 960 });
  page.setDefaultNavigationTimeout(90000);
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('requestfailed', request => { if (request.url().startsWith(emulator)) console.error('Emulator request failed:', new URL(request.url()).pathname, request.failure()?.errorText); });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url() === 'https://checkout.razorpay.com/v1/checkout.js') return request.respond({ status: 200, contentType: 'application/javascript', body: fakeSDK });
    return [origin, emulator].includes(new URL(request.url()).origin) ? request.continue() : request.abort();
  });
  return page;
}
const see = (page, value) => page.waitForFunction(value => document.body.innerText.includes(value), { timeout: 45000 }, value);
async function click(page, text) {
  await page.waitForFunction(text => [...document.querySelectorAll('button')].some(node => node.textContent.trim() === text && !node.disabled), {}, text);
  await page.evaluate(text => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === text && !node.disabled).click(), text);
}
async function fill(page, selector, value) { await page.waitForSelector(selector); await page.click(selector); await page.type(selector, value); }
const post = (page, target) => page.evaluate(target => fetch(target, { method: 'POST' }).then(response => { if (!response.ok) throw Error('Expected successful fixture control'); return response.json(); }), target);
const records = page => page.evaluate(() => fetch('/api/__test/record-check').then(response => response.json()));
async function signIn(page) { await click(page, 'Continue with Email'); await fill(page, 'input[type="email"]', email); await click(page, 'Continue'); await fill(page, 'input[autocomplete="current-password"]', password); await click(page, 'Sign in'); }
try {
  const context = await browser.createBrowserContext(), page = await newPage(context);
  await page.goto(origin + '/pricing', { waitUntil: 'networkidle0' });
  await page.click('a[href="/dashboard/subscription?plan=personal&billing=annual"]');
  await see(page, 'Sign in to review Personal with annual billing.');
  await page.$eval('a[href^="/register"]', node => node.click());
  await see(page, 'Create an account to review Personal with annual billing.');
  await click(page, 'Continue with Email'); await fill(page, 'input[type="email"]', email); await click(page, 'Continue');
  await page.waitForSelector('input[type="password"]');
  const passwords = await page.$$('input[type="password"]'); for (const input of passwords) await input.type(password);
  await click(page, 'Create account'); await see(page, 'I verified my email'); await see(page, 'Verify your email to review Personal');
  const actions = await fetch(`${emulator}/emulator/v1/projects/${project}/oobCodes`).then(response => response.json());
  const verification = actions.oobCodes.filter(row => row.email === email && row.requestType === 'VERIFY_EMAIL').at(-1); assert.ok(verification);
  const actionPage = await newPage(context); await actionPage.goto(origin + '/auth/action?mode=verifyEmail&oobCode=' + encodeURIComponent(verification.oobCode), { waitUntil: 'networkidle0' }); await see(actionPage, 'Your email is verified.'); await actionPage.close(); activePage = page;
  await click(page, 'I verified my email'); await page.waitForFunction(() => location.pathname === '/onboarding');
  assert.match(new URL(page.url()).searchParams.get('returnTo'), /plan=personal&billing=annual/);
  const free = await records(page); assert.equal(free.sameAuthUid, true); assert.equal(free.basePlan, 'start'); assert.equal(free.subscribed, false); assert.equal(free.providerCreates, 0);
  results.push({ scenario: 'public annual pricing to real emulator registration, verified email and UID-bound Free account', passed: true });
  await see(page, 'Make Visionary your own');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(node => node.textContent.includes('I am a Professional')).click()); await click(page, 'Continue');
  await fill(page, 'input[type="text"]', 'Journey Review'); await page.select('select', 'adult'); await click(page, 'Continue');
  await see(page, 'Make Visionary work for you'); await click(page, 'Skip for now'); await see(page, 'Ready to start with Visionary?'); await click(page, 'Start using Visionary');
  await page.waitForSelector('[data-billing-review]'); assert.equal(await page.$$eval('[role="dialog"]', nodes => nodes.length), 1);
  assert.match(await page.$eval('[data-billing-review]', node => node.innerText), /2,990/); assert.equal(await page.$('#getting-started-title'), null);
  results.push({ scenario: 'saved onboarding returns to one explicit annual payment review without overlapping welcome dialog', passed: true });
  await post(page, '/api/__test/verify-outage');
  await page.click('[data-billing-review] input[type="checkbox"]'); await click(page, 'Continue to secure checkout');
  await see(page, 'Payment confirmation is temporarily unavailable.');
  assert.equal(new URL(page.url()).searchParams.has('plan'), false);
  assert.equal((await records(page)).providerCreates, 1);
  await click(page, 'Refresh status'); await see(page, 'Paid period confirmed');
  const paid = await records(page); assert.equal(paid.sameAuthUid, true); assert.equal(paid.invoiceUidMatches, true); assert.equal(paid.invoices, 1); assert.equal(paid.providerCreates, 1);
  await page.reload({ waitUntil: 'networkidle0' }); await see(page, 'Paid period confirmed'); assert.equal(await page.$('[data-billing-review]'), null);
  results.push({ scenario: 'lost confirmation recovers one subscription and invoice; reload does not reopen purchase review', passed: true });
  await click(page, 'View invoice'); await page.waitForSelector('[data-billing-invoice]');
  assert.equal(await page.$eval('.billing-invoice-details-toggle', node => node.getAttribute('aria-expanded')), 'false');
  assert.doesNotMatch(await page.$eval('.billing-invoice-sheet', node => node.innerText), /Billing account ID|Subscription ID/);
  await page.screenshot({ path: path.join(output, 'simple-invoice-desktop.png'), fullPage: true });
  await click(page, 'Payment details'); await see(page, 'Billing account ID');
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[data-billing-invoice]') && document.activeElement?.textContent === 'View invoice');
  results.push({ scenario: 'simple invoice with optional technical details and restored keyboard focus', passed: true });
  const otherContext = await browser.createBrowserContext(), other = await newPage(otherContext, 390);
  await other.goto(origin + '/pricing', { waitUntil: 'networkidle0' }); await other.click('a[href="/dashboard/subscription?plan=personal&billing=annual"]'); await see(other, 'Sign in to review Personal'); await signIn(other);
  await see(other, 'Paid period confirmed'); await see(other, 'You already have a subscription or saved payment.'); assert.equal(await other.$('[data-billing-review]'), null);
  assert.equal((await records(other)).providerCreates, 1); assert.equal(await other.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await click(other, 'View invoice'); await other.waitForSelector('[data-billing-invoice]'); await other.screenshot({ path: path.join(output, 'simple-invoice-mobile.png'), fullPage: true }); await click(other, 'Close invoice');
  results.push({ scenario: 'independent mobile sign-in returns to existing paid account without offering another purchase', passed: true });
  await post(page, '/api/__test/expire-session'); await click(page, 'Refresh status'); await see(page, 'Sign in to manage your plan and payments.');
  await signIn(page); await see(page, 'Paid period confirmed'); const recovered = await records(page); assert.equal(recovered.invoices, 1); assert.equal(recovered.invoiceUidMatches, true); assert.equal(recovered.providerCreates, 1);
  await page.screenshot({ path: path.join(output, 'reauthenticated-paid-account.png'), fullPage: true });
  results.push({ scenario: 'expired billing session reauthenticates into the same subscription and receipt without a retry loop', passed: true });
  const accountViews = await page.evaluate(async () => {
    const profile = await fetch('/api/auth/me').then(response => response.json());
    const read = async path => { const response = await fetch(path, { headers: { 'X-Visionary-Account': profile.id } }); if (!response.ok) throw Error('Account record read failed'); return response.json(); };
    return { overview: await read('/api/account/overview'), devices: await read('/api/account/devices'), invoices: await read('/api/account/invoices') };
  });
  assert.equal(accountViews.overview.uid, accountViews.overview.identity.uid);
  assert.equal(accountViews.overview.uid, accountViews.overview.profile.id);
  assert.equal(accountViews.overview.uid, accountViews.overview.billing.uid);
  assert.equal(accountViews.overview.onboarding.status, 'complete');
  assert.ok(accountViews.devices.items.length >= 3); assert.equal(accountViews.devices.items.filter(device => device.current).length, 1);
  assert.ok(accountViews.devices.items.some(device => device.status === 'active'));
  assert.equal(accountViews.invoices.items.length, 1);
  assert.doesNotMatch(JSON.stringify(accountViews), /cookieHash|idToken|private_key/);
  results.push({ scenario: 'one authenticated account overview joins identity, onboarding, billing and device history without security credentials', passed: true });
  assert.deepEqual(errors, []); await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ identity: 'real Firebase Auth Emulator', database: 'transactional memory', payments: 'fictional provider', results, pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ scenarios: results.length, pageErrors: errors.length, providerCreates: recovered.providerCreates, invoiceUidMatches: recovered.invoiceUidMatches }));
} catch (error) {
  if (activePage && !activePage.isClosed()) { await activePage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); await fs.writeFile(path.join(output, 'failure.txt'), await activePage.$eval('body', node => node.innerText)); }
  console.error('Whole journey failed after', results.length, 'completed scenarios:', error.message); throw error;
} finally { await browser.close(); }
