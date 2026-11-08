// BILL-07 (KAN-108) — explicit live-mode separation proof.
//
// Proves the recorded law (docs/architecture/BACKEND_LAUNCH_CHECKLIST.md § P09):
// "production-money capability is explicitly separated from current test mode" /
// "Implement explicit separately configured live mode/records/secrets/plan
// provisioning and acceptance. Retain UID but never convert test transactions
// into live history; startup/scaling cannot provision plans or charges."
//
// Emulator-free and provider-free by construction: a fictional in-memory
// provider over the real BillingService/BillingRepository, and the shared
// in-memory Firestore double (backend/tests/fixtures/billing-memory.cjs). Both
// modes run against the SAME memory store, which is what makes the isolation
// laws meaningful — a shared store would reveal any namespace leak.
//
// What this suite does NOT prove (recorded as external gates): real live-merchant
// money acceptance needs actual live credentials, approved seller/tax invoice
// data and provider live-plan provisioning. No live key is used or accepted here.

const test = require('node:test'), assert = require('node:assert/strict'), { randomUUID, createHmac } = require('node:crypto');
const path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config');
const { BillingService } = req('./dist/src/billing/billing.service.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js');
const { RazorpayProvider, PaymentProviderError } = req('./dist/src/billing/razorpay.provider.js');
const { resolveMode, isLiveOperable, modePaths } = req('./dist/src/billing/billing-mode.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');

const secret = 'fixture-only-payment-secret', webhookSecret = 'fixture-only-webhook-secret';
const jobToken = 'c'.repeat(64);
const TEST_KEY = 'rzp_test_fixture', LIVE_KEY = 'rzp_live_fixture';

// One shared memory store; two mode-bound services over it. `mode` selects the
// environment; `liveEnabled`/`keyId` drive the credential + double-opt-in laws.
function pairing({ mode = 'test', liveEnabled = true, keyId = TEST_KEY, extra = {} } = {}) {
  const memory = billingMemory(), profiles = new Map();
  const auth = { getDatabase: () => memory.db, me: async uid => profiles.get(uid) || { id: uid, email: `${uid}@example.invalid`, full_name: uid, age_band: 'adult', onboarding_complete: true },
    authenticate: async (cookie, device) => { if (!cookie || device !== 'device') throw new Error('unauthenticated'); return { uid: cookie }; }, rateLimit: async () => {} };
  const config = new ConfigService({ BILLING_MODE: mode, BILLING_LIVE_ENABLED: liveEnabled ? 'true' : 'false',
    RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: webhookSecret, BILLING_RECONCILE_TOKEN: jobToken,
    RAZORPAY_PLAN_PERSONAL_MONTHLY: 'plan_personalmonth', RAZORPAY_PLAN_PERSONAL_ANNUAL: 'plan_personalyear',
    RAZORPAY_PLAN_FAMILY_MONTHLY: 'plan_familymonth', RAZORPAY_PLAN_FAMILY_ANNUAL: 'plan_familyyear',
    RAZORPAY_PLAN_PERSONAL_MONTHLY_LIVE: 'plan_LIVEPERSONALMONTH', ...extra });
  const provider = new RazorpayProvider(config);
  const subscriptions = new Map(), invoices = new Map(), payments = new Map();
  let creates = 0, providerCalls = 0;
  provider.request = async (method, resource, body) => {
    providerCalls += 1;
    if (method === 'POST' && resource === 'subscriptions') {
      creates += 1; const sub = { id: `sub_fixture${creates}`, plan_id: body.plan_id, notes: body.notes, status: 'created', quantity: 1 };
      subscriptions.set(sub.id, sub); invoices.set(sub.id, []); return structuredClone(sub);
    }
    if (resource.startsWith('subscriptions?')) return { items: [...subscriptions.values()] };
    const id = resource.split('/')[1];
    if (method === 'POST' && resource.endsWith('/cancel')) { const sub = subscriptions.get(id); if (body.cancel_at_cycle_end) sub.scheduled = true; else sub.status = 'cancelled'; return structuredClone(sub); }
    if (resource.startsWith('subscriptions/')) return structuredClone(subscriptions.get(id));
    if (resource.startsWith('invoices?')) return { items: structuredClone(invoices.get(new URLSearchParams(resource.split('?')[1]).get('subscription_id')) || []) };
    if (resource.startsWith('payments/')) return structuredClone(payments.get(id));
    throw Error('Unexpected provider operation');
  };
  const repo = new BillingRepository(auth, config);
  const service = new BillingService(repo, provider, auth);
  const create = (uid = 'adult', plan = 'personal', interval = 'monthly', commandId = randomUUID()) => service.checkout(uid, { plan, interval, commandId, catalogVersion: repo.paths.catalogVersion });
  const pay = (subId, amount = 29900) => {
    const start = Math.floor(Date.now() / 1000) - 60, end = start + 86400 * 30;
    Object.assign(subscriptions.get(subId), { status: 'active', current_start: start, current_end: end, charge_at: end, payment_method: 'card' });
    const number = subId.replace('sub_', '');
    const invoice = { id: `inv_${number}`, subscription_id: subId, status: 'paid', currency: 'INR', amount, amount_paid: amount, billing_start: start, billing_end: end, paid_at: start, payment_id: `pay_${number}` };
    invoices.set(subId, [invoice]); payments.set(invoice.payment_id, { id: invoice.payment_id, invoice_id: invoice.id, status: 'captured', captured: true, currency: 'INR', amount, amount_refunded: 0 });
    return invoice;
  };
  return { service, repo, provider, config, memory, profiles, create, pay, calls: () => providerCalls, creates: () => creates };
}

test('mode resolution is fail-closed: absent, empty or unknown values are test', () => {
  for (const value of [undefined, '', 'TEST', 'live ', 'production', 'Live']) {
    const config = new ConfigService(value === undefined ? {} : { BILLING_MODE: value });
    assert.equal(resolveMode(config), 'test', `BILLING_MODE=${JSON.stringify(value)} must resolve to test`);
  }
  assert.equal(resolveMode(new ConfigService({ BILLING_MODE: 'live' })), 'live');
});

test('the test namespace is exactly the historical collections and document id', () => {
  const paths = modePaths('test');
  assert.equal(paths.accountDocumentId, 'test');
  assert.equal(paths.legacyAccounts, 'visionary_billing_test_accounts');
  assert.equal(paths.queue, 'visionary_billing_test_queue');
  assert.equal(paths.subscriptions, 'visionary_billing_test_subscriptions');
  assert.equal(paths.events, 'visionary_billing_test_events');
  assert.equal(paths.memberships, 'visionary_billing_test_memberships');
  assert.equal(paths.invitations, 'visionary_billing_test_invitations');
  assert.equal(paths.payments, 'visionary_billing_test_payments');
  assert.equal(paths.invoicePrefix, 'VTEST');
});

test('the live namespace is disjoint from the test namespace', () => {
  const test_ = modePaths('test'), live = modePaths('live');
  for (const key of ['legacyAccounts', 'queue', 'subscriptions', 'events', 'memberships', 'invitations', 'payments', 'invoicePrefix', 'accountDocumentId', 'catalogVersion']) {
    assert.notEqual(live[key], test_[key], `${key} must differ between modes`);
  }
  assert.match(live.accountDocumentId, /^live$/);
  assert.ok(live.payments.startsWith('visionary_billing_live_'), 'live collections carry the live prefix');
  assert.ok(!Object.values(live).some(value => typeof value === 'string' && value.includes('visionary_billing_test_')), 'no live path may reference a test collection');
});

test('test spending writes only test records; live stays empty (no cross-mode history)', async () => {
  const f = pairing({ mode: 'test' });
  const checkout = await f.create('adult'); f.pay(checkout.subscriptionId);
  f.memory.rows.get('visionary_billing_test_queue/adult').nextSyncAt = Date.now() - 1;
  await f.service.sync('adult', true);
  // Test records exist...
  assert.ok(f.memory.rows.has('visionary_accounts/adult/billing/test'), 'the test billing account exists');
  assert.ok(f.memory.rows.has('visionary_billing_test_queue/adult'), 'the test queue exists');
  // ...and NOTHING live was created by test activity.
  const leaked = [...f.memory.rows.keys()].filter(key => key.includes('/billing/live') || key.includes('visionary_billing_live_'));
  assert.deepEqual(leaked, [], `test activity must not create live records: ${JSON.stringify(leaked)}`);
  assert.equal(f.service.catalog().mode, 'test');
});

test('a live account retains the same UID but never inherits test subscription history', async () => {
  const f = pairing({ mode: 'test' });
  // Build test history: a paid subscription + a retained invoice for 'adult'.
  const checkout = await f.create('adult'); f.pay(checkout.subscriptionId);
  f.memory.rows.get('visionary_billing_test_queue/adult').nextSyncAt = Date.now() - 1;
  const testAccount = await f.service.sync('adult', true);
  assert.equal(testAccount.plan, 'personal', 'precondition: the test account is paid');
  assert.ok(testAccount.invoices.length >= 1, 'precondition: the test account has an invoice');
  const testInvoiceId = testAccount.invoices[0].id;

  // The SAME uid in a live service over the SAME store: live must start empty.
  const liveConfig = new ConfigService({ BILLING_MODE: 'live', BILLING_LIVE_ENABLED: 'true', RAZORPAY_KEY_ID: LIVE_KEY, RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: webhookSecret, BILLING_RECONCILE_TOKEN: jobToken });
  const liveRepo = new BillingRepository(f.memory.db ? { getDatabase: () => f.memory.db } : f.repo.db, liveConfig);
  const liveAccount = await liveRepo.read('adult');
  assert.equal(liveAccount.uid, 'adult', 'live retains the UID');
  assert.equal(liveAccount.mode, 'live', 'the live account records live mode');
  assert.equal(liveAccount.subscription, null, 'live must NOT inherit the test subscription');
  assert.deepEqual(liveAccount.invoices, [], 'live must NOT inherit test invoices');
  // The test invoice is unreadable through the live receipt path (different tree).
  const liveInvoice = await liveRepo.receipt('adult', testInvoiceId).get();
  assert.equal(liveInvoice.exists, false, 'a test invoice must not exist under the live account');
});

test('live mode without the explicit second opt-in is refused with a typed 503 and no provider call', async () => {
  const f = pairing({ mode: 'live', liveEnabled: false, keyId: LIVE_KEY });
  assert.equal(isLiveOperable(f.config), false);
  await assert.rejects(f.service.checkout('adult', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: f.repo.paths.catalogVersion }),
    error => error.getStatus() === 503 && /not enabled/i.test(error.message));
  assert.throws(() => f.service.catalog(), error => error.getStatus() === 503);
  assert.equal(f.calls(), 0, 'a disabled live deployment must make zero provider calls');
  assert.equal(f.creates(), 0, 'no subscription may be created');
});

test('credentials are mode-typed: a test key is refused live and a live key is refused in test', () => {
  // Live mode + a test key: refused (and the double opt-in alone is not enough).
  const liveBadKey = new RazorpayProvider(new ConfigService({ BILLING_MODE: 'live', BILLING_LIVE_ENABLED: 'true', RAZORPAY_KEY_ID: TEST_KEY, RAZORPAY_KEY_SECRET: secret }));
  assert.throws(() => liveBadKey.settings(), error => error.getStatus() === 503);
  // Test mode + a live key: refused, exactly as before this change.
  const testBadKey = new RazorpayProvider(new ConfigService({ BILLING_MODE: 'test', RAZORPAY_KEY_ID: LIVE_KEY, RAZORPAY_KEY_SECRET: secret }));
  assert.throws(() => testBadKey.settings(), error => error.getStatus() === 503);
  // Correct pairings are accepted.
  assert.equal(new RazorpayProvider(new ConfigService({ BILLING_MODE: 'test', RAZORPAY_KEY_ID: TEST_KEY, RAZORPAY_KEY_SECRET: secret })).settings().keyId, TEST_KEY);
  assert.equal(liveBadKey && new RazorpayProvider(new ConfigService({ BILLING_MODE: 'live', BILLING_LIVE_ENABLED: 'true', RAZORPAY_KEY_ID: LIVE_KEY, RAZORPAY_KEY_SECRET: secret })).settings().keyId, LIVE_KEY);
});

test('startup, catalogue and account reads perform no provider call (no provisioning, no charge)', async () => {
  const f = pairing({ mode: 'live', keyId: LIVE_KEY });
  // Module bootstrap must not provision plans, charge, or contact the provider.
  f.service.onModuleInit();
  f.service.onModuleDestroy();
  assert.equal(f.calls(), 0, 'onModuleInit must make zero provider calls');
  assert.equal(f.creates(), 0, 'onModuleInit must not create subscriptions or plans');
  // The catalogue and an account read are likewise provider-free.
  const catalog = f.service.catalog();
  await f.service.account('adult');
  assert.equal(f.calls(), 0, 'catalogue and account reads must not contact the provider');
  assert.equal(catalog.mode, 'live');
  // A missing live plan id is a typed error, never an invented plan: live mode
  // reads the live-provisioned variable, so blanking it must refuse while the
  // test plan id its deployment also carries stays untouched.
  // ConfigService.set writes through to process.env and an empty internal value
  // falls back to it, so the blanking is undone by deleting the variable rather
  // than restoring a value — a stale environment value would silently satisfy the
  // later "no live plan configured" fixture.
  try {
    f.config.set('RAZORPAY_PLAN_PERSONAL_MONTHLY_LIVE', '');
    await assert.rejects(f.service.checkout('adult', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: f.repo.paths.catalogVersion }),
      error => error.getStatus() === 503 && /not available yet/i.test(error.message));
    assert.equal(f.creates(), 0, 'a missing plan must not create anything');
    assert.equal(f.calls(), 0, 'a missing plan must not contact the provider');
  } finally {
    delete process.env.RAZORPAY_PLAN_PERSONAL_MONTHLY_LIVE;
  }
  assert.equal(process.env.RAZORPAY_PLAN_PERSONAL_MONTHLY_LIVE, undefined, 'the fixture live plan id leaves no environment residue');
});

test('mode is reported truthfully across catalogue, account, checkout and invoice documents', async () => {
  const f = pairing({ mode: 'live', keyId: LIVE_KEY });
  assert.equal(f.service.catalog().mode, 'live');
  assert.equal(f.service.catalog().version, modePaths('live').catalogVersion);
  const checkout = await f.create('adult');
  assert.equal(checkout.mode, 'live', 'the checkout view reports live');
  const account = await f.service.account('adult');
  assert.equal(account.mode, 'live', 'the account view reports live');
  // Drive a paid period and confirm the stored invoice is a live document with
  // a live number prefix and no false legal claim.
  f.pay(checkout.subscriptionId); f.memory.rows.get('visionary_billing_live_queue/adult').nextSyncAt = Date.now() - 1;
  const paid = await f.service.sync('adult', true);
  const invoice = paid.invoices[0];
  assert.equal(invoice.mode, 'live', 'a live invoice records live mode');
  assert.match(invoice.number, /^V-/, 'a live invoice uses the live prefix, never VTEST');
  assert.equal(invoice.legalTaxInvoice, false, 'no invoice claims to be a legal tax invoice');
  assert.equal(invoice.totals.tax, null, 'no tax field is invented');
  const testInvoice = pairing({ mode: 'test' });
  const tc = await testInvoice.create('adult'); testInvoice.pay(tc.subscriptionId);
  testInvoice.memory.rows.get('visionary_billing_test_queue/adult').nextSyncAt = Date.now() - 1;
  const tpaid = await testInvoice.service.sync('adult', true);
  assert.equal(tpaid.invoices[0].mode, 'test');
  assert.match(tpaid.invoices[0].number, /^VTEST-/, 'the test prefix is unchanged');
});

test('plan provisioning is mode-typed: live never charges a test-provisioned plan', async () => {
  // The live fixture carries BOTH names; a live checkout must name the _LIVE plan.
  const f = pairing({ mode: 'live', keyId: LIVE_KEY });
  const provider = f.provider;
  const named = [];
  const original = provider.request.bind(provider);
  provider.request = (method, resource, body) => { if (method === 'POST' && resource === 'subscriptions') named.push(body.plan_id); return original(method, resource, body); };
  const checkout = await f.create('adult');
  assert.deepEqual(named, ['plan_LIVEPERSONALMONTH'], 'a live subscription must name the live-provisioned plan');
  assert.equal(checkout.offer.plan, 'personal');
  // With only the test variable present, live has NO plan and must refuse typed.
  const testOnly = pairing({ mode: 'live', keyId: LIVE_KEY, extra: { RAZORPAY_PLAN_PERSONAL_MONTHLY_LIVE: '' } });
  await assert.rejects(testOnly.create('adult'), error => error.getStatus() === 503 && /not available yet/i.test(error.message));
  assert.equal(testOnly.creates(), 0, 'live without a live plan creates nothing');
  // The same deployment in test mode still resolves the historical variable.
  const testMode = pairing({ mode: 'test' });
  const testNamed = [];
  const testOriginal = testMode.provider.request.bind(testMode.provider);
  testMode.provider.request = (method, resource, body) => { if (method === 'POST' && resource === 'subscriptions') testNamed.push(body.plan_id); return testOriginal(method, resource, body); };
  await testMode.create('adult');
  assert.deepEqual(testNamed, ['plan_personalmonth'], 'test mode keeps the historical plan variable');
});

test('a webhook in one mode never maps a subscription belonging to the other', async () => {
  const f = pairing({ mode: 'test' });
  const checkout = await f.create('adult'); f.pay(checkout.subscriptionId);
  f.memory.rows.get('visionary_billing_test_queue/adult').nextSyncAt = Date.now() - 1;
  await f.service.sync('adult', true);
  const raw = Buffer.from(JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { id: checkout.subscriptionId } } } }));
  const signature = createHmac('sha256', webhookSecret).update(raw).digest('hex');
  // A test webhook lands in the test event intake...
  await f.service.webhook(raw, signature, 'event_mode_test');
  assert.ok([...f.memory.rows.keys()].some(key => key.startsWith('visionary_billing_test_events/')), 'the test event intake records the event');
  // ...and no live event record was written.
  assert.equal([...f.memory.rows.keys()].filter(key => key.startsWith('visionary_billing_live_events/')).length, 0, 'a test webhook must not write a live event');
});
