import test from 'node:test';
import assert from 'node:assert/strict';
import { billingPath, billingSelection } from '../src/lib/billingIntent.js';
import { safeReturnTo, authDestination, authLink } from '../src/lib/authReturnTo.js';
import { createBillingClient } from '../src/services/billingClient.js';
import { createAuthTransport } from '../src/api/firebase/authTransport.js';
import { PLANS } from '../src/data/pricingConfig.js';

test('paid selection survives sign-in, account creation and setup without authorizing payment', () => {
  globalThis.window = { location: { origin: 'https://visionary.test', pathname: '/dashboard/subscription', search: '?plan=personal&billing=annual' } };
  const destination = billingPath('personal', 'annual');
  assert.equal(safeReturnTo(), destination);
  assert.equal(authLink('/register'), '/register?returnTo=' + encodeURIComponent(destination));
  assert.equal(authDestination({ id: 'adult', onboarding_complete: false }), '/onboarding?returnTo=' + encodeURIComponent(destination));
  window.location = { ...window.location, pathname: '/onboarding', search: '?returnTo=' + encodeURIComponent(destination) };
  assert.equal(authDestination({ id: 'adult', onboarding_complete: true }), destination);
  assert.equal(billingSelection('?plan=institution&billing=annual'), null);
});
test('payment redirects keep only a same-origin dashboard destination and strip bootstrap credentials', () => {
  for (const path of ['//attacker.test', '/\\attacker.test', 'https://attacker.test/dashboard/subscription']) {
    window.location = { origin: 'https://visionary.test', pathname: '/login', search: '?returnTo=' + encodeURIComponent(path) };
    assert.equal(safeReturnTo(), '/dashboard/home');
  }
  window.location = { origin: 'https://visionary.test', pathname: '/dashboard/subscription', search: '?invite=fixture&access_token=poison&app_base_url=evil' };
  assert.equal(safeReturnTo(), '/dashboard/subscription?invite=fixture');
});
test('published annual totals remain precise independently of rounded monthly display', () => {
  assert.equal(PLANS.find(plan => plan.id === 'personal').annualTotal * 100, 299000);
  assert.equal(PLANS.find(plan => plan.id === 'family').annualTotal * 100, 499000);
});
test('billing commands and safe reads bind expected account and reject stale account responses', async () => {
  let uid = 'adult', release;
  const pending = new Promise(resolve => { release = resolve; });
  const calls = [], client = createBillingClient({ getAccountId: () => uid, request: async (path, options) => { calls.push({ path, options }); await pending; return { uid: 'adult' }; } });
  const response = client.account(); uid = 'another'; release();
  await assert.rejects(response, /account changed/); assert.equal(calls[0].options.accountId, 'adult');
  assert.throws(calls[0].options.beforeSend, /account changed/);
});
test('anonymous billing cannot send any request and mismatched server identity is rejected', async () => {
  let calls = 0;
  const anonymous = createBillingClient({ getAccountId: () => null, request: async () => { ++calls; } });
  await assert.rejects(anonymous.checkout({}), /account changed/); assert.equal(calls, 0);
  const wrong = createBillingClient({ getAccountId: () => 'adult', request: async () => ({ uid: 'other' }) });
  await assert.rejects(wrong.account(), /different account/);
});
test('billing transport uses auth CSRF but keeps mutations on billing routes, without automatic charge retry', async () => {
  const calls = [];
  const request = createAuthTransport({ basePath: '/api/billing', getLocks: () => null, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/auth/csrf') return { ok: true, json: async () => ({ token: 'fixture' }) };
    throw new TypeError('Connection interrupted after request');
  } });
  await assert.rejects(request('/checkouts', { method: 'POST', body: { plan: 'personal' }, accountId: 'adult' }), /Connection interrupted/);
  assert.deepEqual(calls.map(row => row.url), ['/api/auth/csrf', '/api/billing/checkouts']);
  assert.equal(calls[1].options.headers['X-Visionary-Account'], 'adult');
  assert.equal(calls[1].options.headers['X-CSRF-Token'], 'fixture');
});
