const test = require('node:test'), assert = require('node:assert/strict'), { randomUUID, createHmac } = require('node:crypto');
const path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config'), { UnauthorizedException } = req('@nestjs/common');
const { BillingService } = req('./dist/src/billing/billing.service.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js');
const { RazorpayProvider, PaymentProviderError, validSignature } = req('./dist/src/billing/razorpay.provider.js');
const { CATALOG_VERSION, offer } = req('./dist/src/billing/catalog.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const secret = 'fixture-only-payment-secret', webhookSecret = 'fixture-only-webhook-secret';
const signature = value => createHmac('sha256', secret).update(value).digest('hex');
const jobToken = 'c'.repeat(64);
function fixture() {
  const memory = billingMemory(), profiles = new Map();
  const auth = { getDatabase: () => memory.db, me: async uid => profiles.get(uid) || { id: uid, email: `${uid}@example.test`, full_name: uid, age_band: 'adult', onboarding_complete: true },
    authenticate: async (cookie, device) => { if (!cookie || device !== 'device') throw new UnauthorizedException(); return { uid: cookie }; }, rateLimit: async () => {} };
  const config = new ConfigService({ BILLING_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: webhookSecret, BILLING_RECONCILE_TOKEN: jobToken, RAZORPAY_PLAN_PERSONAL_MONTHLY: 'plan_monthly', RAZORPAY_PLAN_PERSONAL_ANNUAL: 'plan_yearly', RAZORPAY_PLAN_FAMILY_MONTHLY: 'plan_family', RAZORPAY_PLAN_FAMILY_ANNUAL: 'plan_familyyear', AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' });
  const provider = new RazorpayProvider(config), repo = new BillingRepository(auth);
  const subscriptions = new Map(), payments = new Map(), invoices = new Map();
  let creates = 0, creationFailure = false, pauseSync = null;
  provider.request = async (method, resource, body) => {
    if (method === 'POST' && resource === 'subscriptions') {
      ++creates; const sub = { id: `sub_fixture${creates}`, plan_id: body.plan_id, notes: body.notes, status: 'created', quantity: 1 };
      subscriptions.set(sub.id, sub); invoices.set(sub.id, []);
      if (creationFailure) throw new PaymentProviderError(true);
      return structuredClone(sub);
    }
    if (resource.startsWith('subscriptions?')) return { items: [...subscriptions.values()] };
    const id = resource.split('/')[1];
    if (method === 'POST' && resource.endsWith('/cancel')) { const sub = subscriptions.get(id); if (body.cancel_at_cycle_end) sub.scheduled = true; else sub.status = 'cancelled'; return structuredClone(sub); }
    if (method === 'GET' && resource.startsWith('subscriptions/')) { if (pauseSync) await pauseSync; return structuredClone(subscriptions.get(id)); }
    if (resource.startsWith('invoices?')) return { items: structuredClone(invoices.get(new URLSearchParams(resource.split('?')[1]).get('subscription_id')) || []) };
    if (resource.startsWith('payments/')) return structuredClone(payments.get(id));
    throw Error('Unexpected provider operation');
  };
  const service = new BillingService(repo, provider, auth);
  const create = (uid = 'adult', plan = 'personal', interval = 'monthly', commandId = randomUUID()) => service.checkout(uid, { plan, interval, commandId, catalogVersion: CATALOG_VERSION });
  const pay = (subId, amount = 29900) => {
    const start = Math.floor(Date.now() / 1000) - 60, end = start + 86400 * 30;
    Object.assign(subscriptions.get(subId), { status: 'active', current_start: start, current_end: end, charge_at: end, payment_method: 'card' });
    const number = subId.replace('sub_', '');
    const invoice = { id: `inv_${number}`, subscription_id: subId, status: 'paid', currency: 'INR', amount, amount_paid: amount, billing_start: start, billing_end: end, paid_at: start, payment_id: `pay_${number}` };
    invoices.set(subId, [invoice]); payments.set(invoice.payment_id, { id: invoice.payment_id, invoice_id: invoice.id, status: 'captured', captured: true, currency: 'INR', amount, amount_refunded: 0 }); return invoice;
  };
  return { service, repo, provider, config, auth, profiles, ...memory, create, pay, subscriptions, invoices, payments, creates: () => creates, failCreation: () => { creationFailure = true; }, pause: promise => { pauseSync = promise; } };
}

test('catalog uses exact annual totals, strict input and test-only provider configuration', async () => {
  assert.equal(offer('personal', 'annual').amount, 299000); assert.equal(offer('family', 'annual').amount, 499000);
  assert.throws(() => offer('institution', 'annual')); assert.throws(() => offer('personal', 'weekly'));
  const f = fixture(); await assert.rejects(f.service.checkout('adult', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), amount: 1, catalogVersion: CATALOG_VERSION }), e => e.getStatus() === 400);
  const live = new RazorpayProvider(new ConfigService({ BILLING_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_live_fixture', RAZORPAY_KEY_SECRET: secret })); assert.throws(() => live.settings(), e => e.getStatus() === 503);
});
test('only completed adult setup can create a provider subscription', async () => {
  const f = fixture(); f.profiles.set('minor', { age_band: 'minor', onboarding_complete: true }); f.profiles.set('pending', { age_band: 'adult', onboarding_complete: false });
  for (const uid of ['minor', 'pending']) await assert.rejects(f.create(uid), e => e.getStatus() === 403);
  assert.equal(f.creates(), 0);
});

test('unmigrated billing cannot create a second subscription or an empty Free account', async () => {
  const f = fixture(); f.rows.set('visionary_billing_test_accounts/adult', { uid: 'adult', subscription: { id: 'sub_legacy' } });
  await assert.rejects(f.create(), error => error.getStatus() === 503);
  await assert.rejects(f.service.account('adult'), error => error.getStatus() === 503);
  assert.equal(f.creates(), 0); assert.equal(f.rows.has('visionary_accounts/adult/billing/test'), false);
});

test('the global due index reconciles canonical nested billing and webhook intake updates both atomically', async () => {
  const f = fixture(), checkout = await f.create(); f.pay(checkout.subscriptionId);
  f.rows.get('visionary_billing_test_queue/adult').nextSyncAt = Date.now() - 1;
  assert.equal((await f.service.reconcileDue(true)).processed, 1);
  assert.equal((await f.service.account('adult')).plan, 'personal');
  const raw = Buffer.from(JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { id: checkout.subscriptionId } } } }));
  await f.service.webhook(raw, createHmac('sha256', webhookSecret).update(raw).digest('hex'), 'event_queue');
  assert.equal(f.rows.get('visionary_billing_test_queue/adult').nextSyncAt, f.rows.get('visionary_accounts/adult/billing/test').nextSyncAt);
});

test('pending or halted payments do not advertise a saved checkout the server cannot reopen', async () => {
  for (const status of ['pending', 'halted']) {
    const f = fixture(), c = await f.create(); f.subscriptions.get(c.subscriptionId).status = status;
    const account = await f.service.sync('adult', true);
    assert.equal(account.pending.recoverable, false);
    await assert.rejects(f.create(), error => error.getStatus() === 409);
    assert.equal(f.creates(), 1);
  }
});

test('Free is persisted once under the verified account ID; concurrent reads never create a provider subscription', async () => {
  const f = fixture();
  const values = await Promise.all([f.service.account('adult'), f.service.account('adult')]);
  assert.equal(values[0].plan, 'start'); assert.deepEqual(values[0].entitlement, values[1].entitlement);
  const saved = f.rows.get('visionary_accounts/adult/billing/test');
  assert.equal(saved.uid, 'adult'); assert.equal(saved.basePlan, 'start'); assert.equal(saved.revision, 0);
  assert.equal(f.creates(), 0); assert.equal(saved.subscription, null); assert.deepEqual(saved.invoices, []);
  const other = await f.service.account('other'); assert.equal(other.uid, 'other'); assert.equal(other.plan, 'start');
  assert.equal(f.rows.get('visionary_accounts/other/billing/test').uid, 'other');
});

test('legacy account backfill preserves paid history and rejects mismatched persisted identity', async () => {
  const f = fixture(), c = await f.create(); f.pay(c.subscriptionId); await f.service.sync('adult', true);
  const saved = f.rows.get('visionary_accounts/adult/billing/test'), original = structuredClone(saved.subscription);
  delete saved.uid; delete saved.basePlan;
  assert.equal((await f.service.account('adult')).plan, 'personal');
  assert.deepEqual(f.rows.get('visionary_accounts/adult/billing/test').subscription, original);
  f.rows.get('visionary_accounts/adult/billing/test').uid = 'foreign';
  await assert.rejects(f.service.account('adult'), error => error.getStatus() === 503);
});
test('concurrent submits create one subscription and recover the same checkout on another device', async () => {
  const f = fixture(), results = await Promise.allSettled([f.create(), f.create()]);
  assert.equal(f.creates(), 1); assert.equal(results.filter(row => row.status === 'fulfilled').length, 1);
  const again = await f.create(); assert.equal(again.subscriptionId, 'sub_fixture1'); assert.equal(f.creates(), 1);
  await assert.rejects(f.create('adult', 'personal', 'annual'), e => e.getStatus() === 409);
});
test('timeout after provider creation is reconciled by saved attempt and never repeats the POST', async () => {
  const f = fixture(); f.failCreation(); await assert.rejects(f.create()); assert.equal(f.creates(), 1);
  const record = f.rows.get('visionary_accounts/adult/billing/test'); record.attempt.createdAt -= 31000;
  const recovered = await f.create(); assert.equal(recovered.subscriptionId, 'sub_fixture1'); assert.equal(f.creates(), 1);
});
test('a closed checkout command cannot create another subscription when replayed later', async () => {
  const f = fixture(), command = randomUUID(), created = await f.create('adult', 'personal', 'monthly', command);
  const current = await f.service.account('adult'); await f.service.cancel('adult', { subscriptionId: created.subscriptionId, revision: current.revision });
  await assert.rejects(f.create('adult', 'personal', 'monthly', command), error => error.getStatus() === 409);
  assert.equal(f.creates(), 1);
  await f.create('adult'); assert.equal(f.creates(), 2);
});
test('mandate authorization and browser callback alone do not activate paid access', async () => {
  const f = fixture(), checkout = await f.create(); f.subscriptions.get(checkout.subscriptionId).status = 'authenticated';
  const result = await f.service.verify('adult', { attemptId: checkout.attemptId, razorpay_payment_id: 'pay_fixture1', razorpay_subscription_id: checkout.subscriptionId, razorpay_signature: signature(`pay_fixture1|${checkout.subscriptionId}`) });
  assert.equal(result.plan, 'start'); assert.equal(result.invoices.length, 0);
  await assert.rejects(f.service.verify('adult', { attemptId: checkout.attemptId, razorpay_payment_id: 'pay_fixture1', razorpay_subscription_id: checkout.subscriptionId, razorpay_signature: '0'.repeat(64) }), e => e.getStatus() === 403);
});
test('verified charge and paid period sync across service instances and produce owner-only invoices', async () => {
  const f = fixture(), checkout = await f.create(); const inv = f.pay(checkout.subscriptionId);
  inv.issued_at = inv.paid_at - 86400;
  const first = await f.service.sync('adult', true); assert.equal(first.plan, 'personal'); assert.equal(first.invoices.length, 1);
  const otherDevice = new BillingService(f.repo, f.provider, f.auth); assert.deepEqual((await otherDevice.account('adult')).entitlement, first.entitlement);
  assert.equal((await otherDevice.invoice('adult', inv.id)).paymentId, inv.payment_id);
  const document = await otherDevice.invoice('adult', inv.id);
  assert.equal(document.uid, 'adult'); assert.equal(document.billingAccountId, 'adult'); assert.equal(document.documentVersion, 1);
  assert.equal(document.lineItems[0].quantity, 1); assert.equal(document.lineItems[0].amount, 29900); assert.equal(document.totals.total, 29900); assert.equal(document.totals.tax, null);
  assert.equal(document.billedTo.email, 'adult@example.test'); assert.equal(document.issuedAt, new Date(inv.issued_at * 1000).toISOString());
  assert.notEqual(document.issuedAt, document.paidAt);
  f.profiles.set('adult', { id: 'adult', full_name: 'Changed profile', email: 'changed@example.test', onboarding_complete: true, age_band: 'adult' });
  await otherDevice.sync('adult', true);
  assert.deepEqual((await otherDevice.invoice('adult', inv.id)).billedTo, document.billedTo);
  await assert.rejects(otherDevice.invoice('other', inv.id), e => e.getStatus() === 404);
  await assert.rejects(f.create(), e => e.getStatus() === 409);
});
test('wrong amount/currency/payment-to-invoice mapping cannot grant paid access', async () => {
  for (const change of [f => { f.invoices.get('sub_fixture1')[0].currency = 'USD'; }, f => { f.payments.get('pay_fixture1').invoice_id = 'inv_other'; }, f => { f.payments.get('pay_fixture1').amount = 1; }]) {
    const f = fixture(), c = await f.create(); f.pay(c.subscriptionId); change(f); assert.equal((await f.service.sync('adult', true)).plan, 'start');
  }
});
test('partial refunds retain the paid period; full refunds remove that grant without deleting receipts', async () => {
  const f = fixture(), c = await f.create(); f.pay(c.subscriptionId);
  f.payments.get('pay_fixture1').amount_refunded = 1000; assert.equal((await f.service.sync('adult', true)).plan, 'personal');
  f.payments.get('pay_fixture1').amount_refunded = 29900; const result = await f.service.sync('adult', true); assert.equal(result.plan, 'start'); assert.equal(result.invoices[0].status, 'refunded');
});
test('cancellation is revision-bound and retains paid access after provider confirmation', async () => {
  const f = fixture(), c = await f.create(); f.pay(c.subscriptionId); const current = await f.service.sync('adult', true);
  await assert.rejects(f.service.cancel('adult', { subscriptionId: c.subscriptionId, revision: current.revision - 1 }), e => e.getStatus() === 409);
  const result = await f.service.cancel('adult', { subscriptionId: c.subscriptionId, revision: current.revision }); assert.equal(result.subscription.cancelAtPeriodEnd, true); assert.equal(result.plan, 'personal');
  assert.equal((await f.service.cancel('adult', { subscriptionId: c.subscriptionId, revision: current.revision })).plan, 'personal');
});
test('a transaction lease serializes concurrent reconciliation and cancellation', async () => {
  const f = fixture(), c = await f.create(); f.pay(c.subscriptionId);
  let release; f.pause(new Promise(resolve => { release = resolve; })); const pending = f.service.sync('adult', true);
  await new Promise(resolve => setTimeout(resolve, 10)); const record = await f.service.account('adult');
  const other = await f.service.sync('adult', true); assert.equal(other.plan, 'start');
  await assert.rejects(f.service.cancel('adult', { subscriptionId: c.subscriptionId, revision: record.revision }), e => e.getStatus() === 409);
  release(); assert.equal((await pending).plan, 'personal');
});

test('reconciliation resolves an uncertain cancellation when Razorpay confirms a terminal state', async () => {
  const f = fixture(), c = await f.create(), current = await f.service.account('adult');
  const request = f.provider.request;
  f.provider.request = async (...args) => {
    const value = await request(...args);
    if (args[0] === 'POST' && args[1].endsWith('/cancel')) throw new PaymentProviderError(true);
    return value;
  };
  await assert.rejects(f.service.cancel('adult', { subscriptionId: c.subscriptionId, revision: current.revision }));
  assert.equal((await f.service.account('adult')).cancellationPending, true);
  const confirmed = await f.service.sync('adult', true);
  assert.equal(confirmed.subscription.status, 'cancelled'); assert.equal(confirmed.cancellationPending, false);
  assert.equal(confirmed.plan, 'start');
});
test('verified webhooks are durably deduplicated; tampering and identity collisions are rejected', async () => {
  const f = fixture(), c = await f.create(), raw = Buffer.from(JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { id: c.subscriptionId } } } }));
  const sig = createHmac('sha256', webhookSecret).update(raw).digest('hex');
  assert.equal(validSignature(raw, sig, webhookSecret), true);
  await f.service.webhook(raw, sig, 'event_fixture'); await f.service.webhook(raw, sig, 'event_fixture'); assert.equal([...f.rows.keys()].filter(key => key.startsWith('visionary_billing_test_events/')).length, 1);
  await assert.rejects(f.service.webhook(Buffer.from('{}'), sig, 'event_fixture'), e => e.getStatus() === 403);
  const changed = Buffer.from('{}'), changedSig = createHmac('sha256', webhookSecret).update(changed).digest('hex');
  await assert.rejects(f.service.webhook(changed, changedSig, 'event_fixture'), e => e.getStatus() === 409);
});
test('a later refund notification updates an expired invoice without losing the historical adjustment', async t => {
  const f = fixture(), c = await f.create(), inv = f.pay(c.subscriptionId); await f.service.sync('adult', true);
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() + 31 * 86400000 });
  f.payments.get(inv.payment_id).amount_refunded = inv.amount;
  const raw = Buffer.from(JSON.stringify({ event: 'payment.refunded', payload: { payment: { entity: { id: inv.payment_id } } } }));
  await f.service.webhook(raw, createHmac('sha256', webhookSecret).update(raw).digest('hex'), 'event_oldrefund');
  assert.equal((await f.service.sync('adult', true)).invoices[0].status, 'refunded');
  assert.equal((await f.service.sync('adult', true)).invoices[0].status, 'refunded');
});
test('Family invitations require the addressed account, reserve capacity, and preserve privacy', async () => {
  const f = fixture(), c = await f.create('owner', 'family'); f.pay(c.subscriptionId, 49900); await f.service.sync('owner', true);
  const invites = await Promise.allSettled(Array.from({ length: 6 }, (_, n) => f.service.inviteFamily('owner', { email: `member${n}@example.test` })));
  assert.equal(invites.filter(row => row.status === 'fulfilled').length, 5);
  const invitation = invites[0].value; await assert.rejects(f.service.familyInvitation('wrong', invitation.id), e => e.getStatus() === 404);
  const joined = await f.service.acceptFamily('member0', { invitationId: invitation.id }); assert.equal(joined.plan, 'family'); assert.equal(joined.invoices.length, 0); assert.equal(joined.family.owner, false);
  await assert.rejects(f.create('member0'), e => e.getStatus() === 409);
  await f.service.removeFamily('owner', { memberUid: 'member0' }); assert.equal((await f.service.account('member0')).plan, 'start');
});

test('scheduled reconciliation requires an independent token and reports durable work failures', async () => {
  const f = fixture();
  for (const token of [undefined, 'bad', 'a'.repeat(64)]) await assert.rejects(f.service.scheduledReconciliation(token), e => e.getStatus() === 403);
  const disabled = new RazorpayProvider(new ConfigService({}));
  assert.throws(() => disabled.authorizeReconciliation(jobToken), e => e.getStatus() === 403);
  const c = await f.create(); f.pay(c.subscriptionId);
  const result = await f.service.scheduledReconciliation(jobToken);
  assert.equal(result.processed, 1); assert.equal((await f.service.account('adult')).plan, 'personal');
  f.repo.db = () => { throw Error('fixture storage outage'); };
  await assert.rejects(f.service.scheduledReconciliation(jobToken), e => e.getStatus() === 503);
  await assert.doesNotReject(f.service.reconcileDue());
});
test('native HTTP billing requires session/device, exact Origin/CSRF and expected UID', async () => {
  const { Module } = req('@nestjs/common'), { NestFactory } = req('@nestjs/core');
  const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
  const { BillingController } = req('./dist/src/billing/billing.controller.js');
  const { raw, json } = req('express'); const f = fixture(); class FixtureModule {}
  Module({ controllers: [BillingController], providers: [{ provide: FirebaseProductService, useValue: f.auth }, { provide: ConfigService, useValue: f.config }, { provide: BillingService, useValue: f.service }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false, bodyParser: false });
  app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' })); app.use(json({ limit: '24kb' })); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const url = await app.getUrl(), csrf = 'a'.repeat(64), cookie = `visionary-session=adult; visionary-device=device; visionary-csrf=${csrf}`;
    assert.equal((await fetch(url + '/api/billing/account')).status, 401);
    assert.equal((await fetch(url + '/api/billing/jobs/reconcile', { method: 'POST' })).status, 403);
    assert.equal((await fetch(url + '/api/billing/jobs/reconcile', { method: 'POST', headers: { 'X-Visionary-Billing-Job': jobToken } })).status, 201);
    assert.equal((await fetch(url + '/api/billing/account', { headers: { Cookie: cookie, 'X-Visionary-Account': 'other' } })).status, 409);
    const post = headers => fetch(url + '/api/billing/checkouts', { method: 'POST', headers: { Cookie: cookie, Origin: 'http://localhost:5173', 'Content-Type': 'application/json', 'X-Visionary-Account': 'adult', 'X-CSRF-Token': csrf, ...headers }, body: JSON.stringify({ plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: CATALOG_VERSION }) });
    assert.equal((await post({ Origin: 'https://attacker.test' })).status, 403); assert.equal(f.creates(), 0);
    assert.equal((await post({ 'X-CSRF-Token': 'bad' })).status, 403); assert.equal(f.creates(), 0);
    assert.equal((await post({})).status, 201);
    const body = JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { id: 'sub_fixture1' } } } });
    const event = await fetch(url + '/api/billing/webhooks/razorpay', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': createHmac('sha256', webhookSecret).update(body).digest('hex'), 'X-Razorpay-Event-Id': 'event_http' }, body }); assert.equal(event.status, 201);
  } finally { await app.close(); }
});
