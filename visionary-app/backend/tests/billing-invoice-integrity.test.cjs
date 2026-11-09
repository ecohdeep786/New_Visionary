// BILL-06 (KAN-107) — invoice immutability, accurate refunds, no invented legal
// fields.
//
// Records the engineering half of the launch checklist ("Preserve immutable
// original invoices and accurate refunds; do not invent legal fields"). The
// "obtain reviewed seller/tax/invoice/refund/commercial policy" half is an owner
// gate recorded in the task receipt, not claimed here.
//
// Emulator-free: the fictional in-memory provider over the real service and the
// in-memory Firestore double. The stored invoice DOCUMENT (records) is checked
// directly; the account view is checked for the projected refund state.
const test = require('node:test'), assert = require('node:assert/strict'), { randomUUID, createHmac } = require('node:crypto');
const path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config'), { UnauthorizedException } = req('@nestjs/common');
const { BillingService } = req('./dist/src/billing/billing.service.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js');
const { RazorpayProvider, PaymentProviderError } = req('./dist/src/billing/razorpay.provider.js');
const { CATALOG_VERSION } = req('./dist/src/billing/catalog.js');
const { chargeDocument, assertNoInventedLegalFields, INVOICE_IMMUTABLE_FIELDS } = req('./dist/src/billing/invoice.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const secret = 'fixture-only-payment-secret', webhookSecret = 'fixture-only-webhook-secret';
const jobToken = 'c'.repeat(64);

function fixture() {
  const memory = billingMemory(), profiles = new Map();
  const auth = { getDatabase: () => memory.db, me: async uid => profiles.get(uid) || { id: uid, email: `${uid}@example.test`, full_name: uid, age_band: 'adult', onboarding_complete: true },
    authenticate: async (cookie, device) => { if (!cookie || device !== 'device') throw new UnauthorizedException(); return { uid: cookie }; }, rateLimit: async () => {} };
  const config = new ConfigService({ BILLING_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: webhookSecret, BILLING_RECONCILE_TOKEN: jobToken, RAZORPAY_PLAN_PERSONAL_MONTHLY: 'plan_monthly', RAZORPAY_PLAN_PERSONAL_ANNUAL: 'plan_yearly', RAZORPAY_PLAN_FAMILY_MONTHLY: 'plan_family', RAZORPAY_PLAN_FAMILY_ANNUAL: 'plan_familyyear' });
  const provider = new RazorpayProvider(config), repo = new BillingRepository(auth);
  const subscriptions = new Map(), payments = new Map(), invoices = new Map();
  let creates = 0;
  provider.request = async (method, resource, body) => {
    if (method === 'POST' && resource === 'subscriptions') {
      ++creates; const sub = { id: `sub_fixture${creates}`, plan_id: body.plan_id, notes: body.notes, status: 'created', quantity: 1 };
      subscriptions.set(sub.id, sub); invoices.set(sub.id, []); return structuredClone(sub);
    }
    if (resource.startsWith('subscriptions?')) return { items: [...subscriptions.values()] };
    const id = resource.split('/')[1];
    if (method === 'POST' && resource.endsWith('/cancel')) { const sub = subscriptions.get(id); if (body.cancel_at_cycle_end) sub.scheduled = true; else sub.status = 'cancelled'; return structuredClone(sub); }
    if (method === 'GET' && resource.startsWith('subscriptions/')) return structuredClone(subscriptions.get(id));
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
  const refundNotice = (paymentId, eventId = 'event_refund') => {
    const raw = Buffer.from(JSON.stringify({ event: 'payment.refunded', payload: { payment: { entity: { id: paymentId } } } }));
    return service.webhook(raw, createHmac('sha256', webhookSecret).update(raw).digest('hex'), eventId);
  };
  const storedInvoice = (uid, invoiceId) => memory.rows.get(`visionary_accounts/${uid}/billing/test/invoices/${invoiceId}`);
  const storedAdjustments = (uid, invoiceId) => [...memory.rows.keys()].filter(key => key.startsWith(`visionary_accounts/${uid}/billing/test/invoices/${invoiceId}/adjustments/`)).map(key => ({ key, value: memory.rows.get(key) }));
  return { service, repo, provider, auth, profiles, memory, create, pay, refundNotice, storedInvoice, storedAdjustments, invoices, payments, creates: () => creates };
}

test('chargeDocument strips derived display state so no refund can mutate the original', () => {
  const doc = chargeDocument('adult', { id: 'inv_1', number: 'VTEST-1', mode: 'test', plan: 'personal', interval: 'monthly', amount: 29900, billedTo: { name: 'A', email: 'a@x' }, currency: 'INR', issuedAt: 't', paidAt: 't', periodStart: 1, periodEnd: 2, subscriptionId: 'sub_1', paymentId: 'pay_1', status: 'refunded', amountRefunded: 29900 });
  assert.equal(doc.amount, 29900);
  assert.equal(doc.recordKind, 'charge');
  assert.ok(!('status' in doc), 'display status must not be stored on the charge document');
  assert.ok(!('amountRefunded' in doc), 'display refund state must not be stored on the charge document');
  assert.equal(doc.totals.tax, null);
  assert.equal(doc.seller.name, 'Visionary');
});

test('an invoice document is written once and a rewrite mutating a charge fact is refused', async () => {
  const f = fixture(); const c = await f.create(); f.pay(c.subscriptionId); await f.service.sync('adult', true);
  const invId = f.invoices.get(c.subscriptionId)[0].id;
  const first = f.storedInvoice('adult', invId);
  assert.ok(first, 'the charge document exists');
  assert.equal(first.amount, 29900);
  // Rewrite with an identical charge document is accepted (no mutation, no error).
  f.service.sync('adult', true);
  const after = f.storedInvoice('adult', invId);
  assert.equal(after.amount, 29900);
  assert.equal(JSON.stringify(after), JSON.stringify(first), 'a no-op re-sync must not change the document');
  // A direct rewrite that would change an immutable field is refused, not silent.
  assert.throws(() => f.repo.assertImmutableInvoice(first, { ...first, amount: 1 }), error => /immutable/i.test(error.message));
  assert.throws(() => f.repo.assertImmutableInvoice(first, { ...first, number: 'VTEST-forged' }), error => /immutable/i.test(error.message));
  assert.throws(() => f.repo.assertImmutableInvoice(first, { ...first, subscriptionId: 'sub_other' }), error => /immutable/i.test(error.message));
});

test('a full refund never mutates the original document; the refund is a separate adjustment and the view projects refunded', async () => {
  const f = fixture(); const c = await f.create(); const inv = f.pay(c.subscriptionId); await f.service.sync('adult', true);
  const invId = inv.id, paymentId = inv.payment_id;
  const original = f.storedInvoice('adult', invId);
  assert.equal(original.amountRefunded, undefined);
  assert.equal(original.status, undefined);
  // Drive a refund through the webhook -> paymentAdjustments -> adjustment path.
  f.payments.get(paymentId).amount_refunded = 29900;
  await f.refundNotice(paymentId);
  const view = await f.service.sync('adult', true);
  assert.equal(view.invoices[0].status, 'refunded', 'the displayed invoice is refunded');
  assert.equal(view.invoices[0].amountRefunded, 29900);
  // The original document is untouched: exact amount, still no derived state.
  const after = f.storedInvoice('adult', invId);
  assert.deepEqual(after, original, 'the charge document must be byte-identical after a refund');
  assert.equal(after.amount, 29900);
  // The refund lives on the separate ledger.
  const adjustments = f.storedAdjustments('adult', invId);
  assert.equal(adjustments.length, 1);
  assert.equal(adjustments[0].value.invoiceId, invId);
  assert.equal(adjustments[0].value.paymentId, paymentId);
  assert.equal(adjustments[0].value.amountRefunded, 29900);
});

test('a partial refund keeps the original and the projection shows partially_refunded', async () => {
  const f = fixture(); const c = await f.create(); const inv = f.pay(c.subscriptionId); await f.service.sync('adult', true);
  f.payments.get(inv.payment_id).amount_refunded = 500;
  await f.refundNotice(inv.payment_id);
  const view = await f.service.sync('adult', true);
  assert.equal(view.invoices[0].status, 'partially_refunded');
  assert.equal(view.invoices[0].amountRefunded, 500);
  assert.equal(f.storedInvoice('adult', inv.id).amount, 29900, 'original amount preserved');
  assert.equal(f.storedAdjustments('adult', inv.id).length, 1);
  assert.equal(f.storedAdjustments('adult', inv.id)[0].value.amountRefunded, 500);
});

test('repeated refund notifications are idempotent: one adjustment record per payment', async () => {
  const f = fixture(); const c = await f.create(); const inv = f.pay(c.subscriptionId); await f.service.sync('adult', true);
  f.payments.get(inv.payment_id).amount_refunded = 29900;
  await f.refundNotice(inv.payment_id, 'event_1');
  await f.service.sync('adult', true);
  // Same refund redelivered (duplicate webhook).
  await f.refundNotice(inv.payment_id, 'event_2');
  const view = await f.service.sync('adult', true);
  assert.equal(view.invoices[0].status, 'refunded');
  const adjustments = f.storedAdjustments('adult', inv.id);
  assert.equal(adjustments.length, 1, 'a redelivered refund must not duplicate the adjustment');
  assert.equal(adjustments[0].key.endsWith(inv.payment_id), true);
  // The original remains intact across duplicates.
  assert.equal(f.storedInvoice('adult', inv.id).amount, 29900);
});

test('accurate refund bounds: an out-of-range refunded amount is refused, never applied', async () => {
  const f = fixture(); const c = await f.create(); const inv = f.pay(c.subscriptionId); await f.service.sync('adult', true);
  // More than the original amount.
  f.payments.get(inv.payment_id).amount_refunded = inv.amount + 1;
  await f.refundNotice(inv.payment_id, 'event_over');
  await assert.rejects(f.service.sync('adult', true), error => /confirm/i.test(error.message));
  // Nothing was applied: the original is intact and no adjustment was recorded.
  assert.equal(f.storedInvoice('adult', inv.id).amount, 29900);
  assert.equal(f.storedAdjustments('adult', inv.id).length, 0);
  // A negative refund is likewise refused.
  const f2 = fixture(); const c2 = await f2.create(); const inv2 = f2.pay(c2.subscriptionId); await f2.service.sync('adult', true);
  f2.payments.get(inv2.payment_id).amount_refunded = -1;
  await f2.refundNotice(inv2.payment_id, 'event_neg');
  await assert.rejects(f2.service.sync('adult', true), error => /confirm/i.test(error.message));
});

test('no legal field is invented: the guard refuses tax, seller registration and legal-invoice claims', () => {
  const base = chargeDocument('adult', { id: 'inv_9', number: 'VTEST-9', mode: 'test', plan: 'personal', interval: 'monthly', amount: 29900, billedTo: { name: 'A', email: 'a@x' }, currency: 'INR', issuedAt: 't', paidAt: 't', periodStart: 1, periodEnd: 2, subscriptionId: 'sub_1', paymentId: 'pay_1' });
  assert.doesNotThrow(() => assertNoInventedLegalFields(base));
  assert.equal(base.totals.tax, null);
  assert.throws(() => assertNoInventedLegalFields({ ...base, totals: { ...base.totals, tax: 18 } }), /tax field refused/);
  assert.throws(() => assertNoInventedLegalFields({ ...base, totals: { ...base.totals, tax: 0 } }), /tax field refused/);
  assert.throws(() => assertNoInventedLegalFields({ ...base, seller: { name: 'Visionary', gstin: 'X' } }), /gstin.*refused/);
  assert.throws(() => assertNoInventedLegalFields({ ...base, seller: { name: 'Visionary', registrationNumber: 'R' } }), /registrationNumber.*refused/);
  assert.throws(() => assertNoInventedLegalFields({ ...base, legalTaxInvoice: true }), /legal-tax claim refused/);
});

test('no reviewed merchant policy exists, so no stored invoice carries a legal field', async () => {
  const f = fixture(); const c = await f.create(); f.pay(c.subscriptionId); await f.service.sync('adult', true);
  const invId = f.invoices.get(c.subscriptionId)[0].id;
  const doc = f.storedInvoice('adult', invId);
  assert.equal(doc.totals.tax, null);
  assert.deepEqual(doc.seller, { name: 'Visionary' });
  assert.ok(!('gstin' in (doc.seller || {})), 'no seller registration may appear');
  assert.ok(!('legalTaxInvoice' in doc), 'no legal-invoice claim may appear');
});

test('every immutable field on a stored document is covered by the guard list', async () => {
  const f = fixture(); const c = await f.create(); f.pay(c.subscriptionId); await f.service.sync('adult', true);
  const invId = f.invoices.get(c.subscriptionId)[0].id;
  const doc = f.storedInvoice('adult', invId);
  for (const key of INVOICE_IMMUTABLE_FIELDS) {
    if (key === 'recordKind') { assert.equal(doc[key], 'charge'); continue; }
    assert.ok(key in doc, `immutable field ${key} must be present on the stored charge document`);
  }
});
