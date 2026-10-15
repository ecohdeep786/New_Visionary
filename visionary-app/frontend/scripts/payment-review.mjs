import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const real = process.argv.includes('--razorpay-test');
const preview = process.argv.includes('--preview');
const origin = preview ? 'http://localhost:4173' : 'http://localhost:5173';
const port = real ? 3038 : 3037;
const output = path.join(root, 'artifacts/tmp', (real ? 'payment-razorpay-test' : 'payment-browser') + (preview ? '-preview' : ''));
await fs.mkdir(output, { recursive: true });
const fixture = spawn(process.execPath, [path.join(root, 'backend/tests/billing-browser-server.cjs'), ...(real ? ['--razorpay-test'] : [])], { cwd: root, windowsHide: true, env: { ...process.env, BILLING_REVIEW_PORT: String(port), BILLING_REVIEW_ORIGIN: origin }, stdio: ['ignore', 'pipe', 'pipe'] });
let fixtureOutput = '';
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Payment fixture startup timed out.')), 60000);
  fixture.stdout.on('data', chunk => { fixtureOutput += chunk; if (fixtureOutput.includes('"ready":true')) { clearTimeout(timer); resolve(); } });
  fixture.once('exit', code => { clearTimeout(timer); reject(new Error(`Payment fixture exited ${code}.`)); });
});
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const backend = `http://127.0.0.1:${port}`, results = [], errors = [];
const fakeSDK = `window.Razorpay=class{constructor(o){this.o=o;this.events={}}on(n,f){this.events[n]=f}close(){this.o.modal.ondismiss()}async open(){if(window.__paymentOutcome==='dismiss'){this.o.modal.ondismiss();return}if(window.__paymentOutcome==='failed'){this.events['payment.failed']?.();this.o.modal.ondismiss();return}const r=await fetch('/__test/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:this.o.subscription_id})});this.o.handler(await r.json())}};`;
async function pageFor(uid = 'billing-review-owner', width = 1440) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  await page.evaluateOnNewDocument(() => {
    window.__billingPolicyViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      if (event.blockedURI.includes('razorpay.com')) window.__billingPolicyViolations.push({ directive: event.effectiveDirective, origin: new URL(event.blockedURI).origin });
    });
  });
  await page.setViewport({ width, height: width < 500 ? 844 : 1000 });
  await page.setRequestInterception(true);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', async request => {
    try {
      if (!real && request.url() === 'https://checkout.razorpay.com/v1/checkout.js') return await request.respond({ status: 200, contentType: 'application/javascript', body: fakeSDK });
      if (request.url().startsWith(origin + '/api/') || request.url().startsWith(origin + '/__test/')) {
        const url = new URL(request.url());
        const response = await fetch(backend + url.pathname + url.search, { method: request.method(), headers: { ...request.headers(), host: `127.0.0.1:${port}`, origin, cookie: uid ? `visionary-session=${uid}; visionary-device=fixture-device; visionary-csrf=${'c'.repeat(64)}` : '' }, ...(request.postData() ? { body: request.postData() } : {}), signal: AbortSignal.timeout(60000) });
        return await request.respond({ status: response.status, contentType: 'application/json', body: await response.text() });
      }
      await request.continue();
    } catch { if (!request.isInterceptResolutionHandled()) await request.abort(); }
  });
  return { page, context };
}
async function clickText(page, tag, text) {
  await page.waitForFunction((tag, text) => [...document.querySelectorAll(tag)].some(node => node.textContent.includes(text)), {}, tag, text);
  await page.evaluate((tag, text) => { const node = [...document.querySelectorAll(tag)].find(node => node.textContent.includes(text)); if (!node || node.disabled) throw Error('Expected enabled control: ' + text); node.click(); }, tag, text);
}
async function reviewAndContinue(page) {
  await page.waitForSelector('[role="dialog"]');
  assert.match(await page.$eval('[role="dialog"]', node => node.textContent), /billing-review@example.test/);
  await page.click('[role="dialog"] input[type="checkbox"]');
  await clickText(page, '[role="dialog"] button', 'Continue to secure checkout');
}
try {
  if (real) {
    const { page } = await pageFor('billing-review-sandbox-' + Date.now());
    await page.goto(origin + '/dashboard/subscription?plan=personal&billing=annual', { waitUntil: 'networkidle2' });
    await reviewAndContinue(page);
    const checkoutElement = await page.waitForSelector('iframe.razorpay-checkout-frame', { timeout: 60000 });
    const checkoutFrame = await checkoutElement.contentFrame();
    assert.ok(checkoutFrame, 'Razorpay frame must exist');
    await checkoutFrame.waitForSelector('input', { timeout: 90000 });
    const initialPolicy = await page.evaluate(() => window.__billingPolicyViolations);
    await fs.writeFile(path.join(output, 'security-policy.json'), JSON.stringify(initialPolicy, null, 2));
    assert.deepEqual(initialPolicy, []);
    const fillVisible = async (selector, value) => {
      for (const input of await checkoutFrame.$$(selector)) {
        const accessible = await input.evaluate(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === node; });
        if (accessible) { await input.focus(); await input.evaluate(node => node.select()); await input.type(value, { delay: 40 }); return; }
      }
      throw new Error('Expected visible provider input: ' + selector);
    };
    const clickProvider = async text => {
      for (const button of await checkoutFrame.$$('button,label,[role="button"]')) {
        const accessible = await button.evaluate((node, text) => { const r = node.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return node.innerText.trim() === text && r.width > 0 && r.height > 0 && (hit === node || node.contains(hit)); }, text);
        if (accessible) { await button.click(); return; }
      }
      throw new Error('Expected visible provider control: ' + text);
    };
    await fillVisible('input[name="contact"]', '9000090000');
    await fillVisible('input[name="email"]', 'billing-review@example.test');
    await clickProvider('Continue');
    await checkoutFrame.waitForFunction(() => ![...document.querySelectorAll('input[name="contact"]')].some(node => { const r = node.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === node; }), { timeout: 15000 });
    const methods = await checkoutFrame.$$('input[type="radio"]');
    assert.ok(methods.length >= 2, 'Provider must expose its card payment method');
    await methods[1].click();
    await checkoutFrame.waitForSelector('input[name="card.number"]', { timeout: 30000 });
    await fillVisible('input[name="card.number"]', '4718609108204366');
    await fillVisible('input[name="card.expiry"]', '1230');
    await fillVisible('input[name="card.cvv"]', '111');
    await checkoutFrame.evaluate(() => { const save = document.querySelector('input[name="save"]'); if (save && !save.checked) save.click(); });
    await new Promise(resolve => setTimeout(resolve, 500));
    await clickProvider('Continue');
    await checkoutFrame.waitForFunction(() => document.body.innerText.includes('Skip OTP'), { timeout: 30000 });
    await clickProvider('Skip OTP');
    await checkoutFrame.waitForFunction(() => document.body.innerText.includes("Pay on bank's page"), { timeout: 30000 });
    await clickProvider("Pay on bank's page");
    // Razorpay's published sandbox authentication page provides Success/Failure.
    // Never synthesize a payment callback in this provider acceptance scenario.
    let bankConfirmed = false;
    const bankDeadline = Date.now() + 60000;
    while (!bankConfirmed && Date.now() < bankDeadline) {
      for (const candidate of await browser.pages()) {
        for (const frame of candidate.frames()) {
          if (!frame.url().startsWith('https://api.razorpay.com/')) continue;
          const buttons = await frame.$$('button,input[type="submit"],a');
          for (const button of buttons) {
            const success = await button.evaluate(node => {
              const r = node.getBoundingClientRect();
              return /^(success|pay successfully)$/i.test((node.innerText || node.value || '').trim()) && r.width > 0 && r.height > 0;
            });
            if (success) { await button.click(); bankConfirmed = true; break; }
          }
          if (bankConfirmed) break;
        }
        if (bankConfirmed) break;
      }
      if (!bankConfirmed) await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(bankConfirmed, 'Official sandbox bank Success must be selected');
    await page.waitForFunction(() => document.body.innerText.includes('Test payment confirmed.'), { timeout: 90000 });
    await page.screenshot({ path: path.join(output, 'secure-checkout.png'), fullPage: true });
    console.log('Razorpay sandbox charge confirmed by the product server.');
    const frames = page.frames().map(frame => ({ name: frame.name(), url: new URL(frame.url() || 'about:blank').origin }));
    await fs.writeFile(path.join(output, 'frames.json'), JSON.stringify(frames, null, 2));
    results.push({ scenario: 'actual Razorpay annual charge and server verification', passed: true });
    await clickText(page, 'button', 'View invoice');
    await page.waitForSelector('[data-billing-invoice]');
    await page.screenshot({ path: path.join(output, 'provider-invoice.png'), fullPage: true });
    assert.match(await page.$eval('[data-billing-invoice]', node => node.textContent), /2,990/);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.__billingPolicyViolations), []);
  } else {
    const anonymous = await pageFor(null);
    await anonymous.page.goto(origin + '/pricing', { waitUntil: 'networkidle2' });
    await anonymous.page.waitForSelector('a[href="/dashboard/subscription?plan=personal&billing=annual"]');
    await anonymous.page.click('a[href="/dashboard/subscription?plan=personal&billing=annual"]');
    await anonymous.page.waitForFunction(() => document.body.innerText.includes('Sign in')); assert.equal(await anonymous.page.$('[role="dialog"]'), null);
    await anonymous.page.waitForFunction(() => document.body.innerText.includes('Sign in to review Personal with annual billing.'));
    results.push({ scenario: 'public annual pricing preserves intent and requires sign-in', passed: true }); await anonymous.context.close();
    const free = await pageFor('billing-review-free', 390);
    await free.page.goto(origin + '/dashboard/subscription', { waitUntil: 'networkidle2' });
    await free.page.waitForFunction(() => document.body.innerText.includes('Current plan · Free'));
    assert.equal(await free.page.$('[data-billing-review]'), null);
    const freeRecord = await free.page.evaluate(() => fetch('/__test/storage-check').then(response => response.json()));
    assert.deepEqual(freeRecord, { uidMatches: true, basePlan: 'start', hasSubscription: false, invoiceCount: 0, providerCreateCount: 0 });
    await free.page.click('header button[aria-haspopup="menu"]');
    await free.page.waitForFunction(() => document.querySelector('[data-account-billing]')?.textContent === 'Free account');
    await free.page.screenshot({ path: path.join(output, 'free-account-mobile.png'), fullPage: true });
    await free.page.keyboard.press('Escape');
    await free.page.goto(origin + '/dashboard/profile', { waitUntil: 'networkidle2' });
    await free.page.waitForFunction(() => document.querySelector('main [data-account-billing]')?.textContent === 'Free account');
    assert.equal(await free.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await free.page.screenshot({ path: path.join(output, 'free-profile-mobile.png'), fullPage: true });
    results.push({ scenario: 'Free is saved under the Auth UID, appears in account menu/profile, and creates no payment', passed: true });
    await free.context.close();
    const owner = await pageFor();
    await owner.page.goto(origin + '/dashboard/subscription?plan=personal&billing=annual', { waitUntil: 'networkidle2' });
    await owner.page.waitForSelector('[role="dialog"]');
    assert.match(await owner.page.$eval('[role="dialog"]', node => node.textContent), /2,990/);
    assert.equal(await owner.page.$eval('[role="dialog"] button', node => node.disabled), true);
    await owner.page.screenshot({ path: path.join(output, 'annual-review.png'), fullPage: true });
    await reviewAndContinue(owner.page);
    await owner.page.waitForFunction(() => document.body.innerText.includes('Test payment confirmed.'), { timeout: 60000 });
    await owner.page.screenshot({ path: path.join(output, 'confirmed-desktop.png'), fullPage: true });
    await owner.page.click('header button[aria-haspopup="menu"]');
    await owner.page.waitForFunction(() => document.querySelector('[data-account-billing]')?.textContent === 'Personal · Test billing');
    await owner.page.keyboard.press('Escape');
    await clickText(owner.page, 'button', 'View invoice'); await owner.page.waitForSelector('[data-billing-invoice]');
    assert.match(await owner.page.$eval('.billing-invoice-sheet', node => node.textContent), /Billing account IDbilling-review-owner/);
    await owner.page.screenshot({ path: path.join(output, 'invoice-desktop.png'), fullPage: true });
    await owner.page.keyboard.press('Escape');
    await owner.page.waitForFunction(() => !document.querySelector('[data-billing-invoice]') && document.activeElement?.textContent === 'View invoice');
    results.push({ scenario: 'annual review, signed verification and receipt', passed: true });
    const other = await pageFor('billing-review-owner', 390);
    await other.page.goto(origin + '/dashboard/subscription', { waitUntil: 'networkidle2' });
    await other.page.waitForFunction(() => document.body.innerText.includes('Paid period confirmed'));
    assert.equal(await other.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await other.page.screenshot({ path: path.join(output, 'confirmed-mobile.png'), fullPage: true });
    await clickText(other.page, 'button', 'View invoice'); await other.page.waitForSelector('[data-billing-invoice]');
    assert.equal(await other.page.$eval('[data-billing-invoice]', node => node.scrollWidth <= node.clientWidth), true);
    await other.page.screenshot({ path: path.join(output, 'invoice-mobile.png'), fullPage: true });
    await other.page.$eval('[data-billing-invoice]', node => { node.scrollTop = node.scrollHeight; });
    await other.page.screenshot({ path: path.join(output, 'invoice-mobile-totals.png'), fullPage: true });
    const invoiceBounds = await other.page.evaluate(() => ({ dialogTop: document.querySelector('[data-billing-invoice]').getBoundingClientRect().top, toolsTop: document.querySelector('[data-invoice-actions]').getBoundingClientRect().top }));
    assert.ok(Math.abs(invoiceBounds.dialogTop - invoiceBounds.toolsTop) < 3, 'Invoice print/close toolbar must remain reachable while scrolling');
    await other.page.emulateMediaType('print');
    assert.equal(await other.page.$eval('.billing-invoice-heading', node => getComputedStyle(node).display), 'flex');
    assert.equal(await other.page.$eval('.billing-invoice-footer', node => getComputedStyle(node).display), 'block');
    await other.page.pdf({ path: path.join(output, 'test-invoice.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true }); await other.page.emulateMediaType('screen');
    await clickText(other.page, '[role="dialog"] button', 'Close invoice');
    results.push({ scenario: 'second device reads subscription and printable invoice', passed: true });
    await clickText(owner.page, 'button', 'Cancel renewal'); await clickText(owner.page, '[role="dialog"] button', 'Confirm cancellation');
    await owner.page.waitForFunction(() => document.body.innerText.includes('Renewal cancelled'));
    results.push({ scenario: 'confirmed cancellation retains paid period', passed: true });
    const interrupted = await pageFor('billing-review-interrupted');
    await interrupted.page.goto(origin + '/dashboard/subscription?plan=personal&billing=monthly', { waitUntil: 'networkidle2' });
    await interrupted.page.evaluate(() => { window.__paymentOutcome = 'dismiss'; }); await reviewAndContinue(interrupted.page);
    await interrupted.page.waitForFunction(() => document.body.innerText.includes('Checkout closed.'));
    await clickText(interrupted.page, 'button', 'Review saved checkout');
    await interrupted.page.evaluate(() => { window.__paymentOutcome = 'failed'; }); await reviewAndContinue(interrupted.page);
    await interrupted.page.waitForFunction(() => document.body.innerText.includes('payment attempt was not confirmed'));
    await interrupted.page.screenshot({ path: path.join(output, 'recoverable-failure.png'), fullPage: true });
    results.push({ scenario: 'dismissal and provider failure preserve the same attempt', passed: true });
    assert.deepEqual(errors, []);
  }
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ mode: real ? 'actual-provider-test' : 'fictional-provider', productionPreview: preview, realFirestore: false, results, errors }, null, 2));
  console.log(JSON.stringify({ mode: real ? 'actual-provider-test' : 'fictional-provider', scenarios: results.length, pageErrors: errors.length }));
} catch (failure) {
  for (const page of await browser.pages()) {
    const frame = page.frames().find(item => item.url().includes('api.razorpay.com'));
    if (frame) {
      await fs.writeFile(path.join(output, 'failure-controls.json'), JSON.stringify(await frame.evaluate(() => ({ text: document.querySelector('input') ? document.body.innerText : 'Provider form closed or not rendered; bootstrap content withheld.', active: document.activeElement?.getAttribute('name'), inputs: [...document.querySelectorAll('input')].map(node => ({ name: node.name, valueLength: node.value.length, hit: (() => { const r = node.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === node; })() })) })), null, 2));
      await page.screenshot({ path: path.join(output, 'provider-failure.png') });
    }
  }
  throw failure;
} finally {
  await browser.close();
  try {
    if (real) {
      const cleanup = await fetch(backend + '/__test/cleanup', { method: 'POST', signal: AbortSignal.timeout(45000) }).then(response => response.json());
      await fs.writeFile(path.join(output, 'cleanup.json'), JSON.stringify(cleanup, null, 2));
    }
  } finally { fixture.kill(); }
}
