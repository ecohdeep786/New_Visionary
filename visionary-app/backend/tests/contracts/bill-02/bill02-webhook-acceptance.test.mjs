// BILL-02 (KAN-103) — payment webhook acceptance over the canonical ingress.
//
// Drives the REAL product webhook surface (`POST /api/billing/webhooks/razorpay`
// through the real TLS terminator on the canonical origin, real signature
// verification over the exact raw signed bytes, real durable Firestore event
// records) with locally-minted provider-shaped events. Proves: a real provider
// POST (no origin header, no cookies, no CSRF) is accepted; tampered signatures
// and malformed notifications fail closed; the raw-byte size limit holds;
// duplicate delivery never double-applies; an event-id identity conflict is a
// 409; reordered/late/unmapped notifications are recorded honestly without
// touching accounts; mapped refund/dispute notifications queue adjustments and
// the scheduled reconciliation job (after a FULL product restart) converges the
// account from the provider's own records — never the other way round.
// The actual Razorpay-registered webhook URL and provider-sent test events
// remain an external gate recorded in the runbook; this suite never contacts
// the provider network.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

import stack from '../bill-01/stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendPackage = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir;
let adminApp;
const state = { users: {}, devices: {}, providerState: null };
const WEBHOOK_SECRET = stack.FIXTURE_SECRETS.webhook;
const RECONCILE_TOKEN = stack.FIXTURE_SECRETS.reconcile;

function fixtureControl(pathname, body, method = 'POST') {
  return new Promise((resolve, reject) => {
    const payload = method === 'GET' ? null : JSON.stringify(body || {});
    const request = http.request({ host: '127.0.0.1', port: stack.PORTS.control, path: method === 'GET' ? pathname : pathname, method, headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload || '') } }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null, text: data }));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function billingSnapshot(uid) {
  const response = await fixtureControl(`/fixture/billing?uid=${encodeURIComponent(uid)}`, null, 'GET');
  assert.equal(response.status, 200, `Billing snapshot failed: ${response.text}`);
  return response.body;
}

async function createEmulatorUser(email) {
  const { getAuth } = backendPackage('firebase-admin/auth');
  const user = await getAuth(adminApp).createUser({ email, password: 'webhook-acceptance-Pass1', emailVerified: true });
  return user.uid;
}

async function emulatorSignInToken(email) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'webhook-acceptance-Pass1', returnSecureToken: true }),
  });
  assert.equal(response.status, 200, `Auth Emulator sign-in failed for ${email}`);
  return (await response.json()).idToken;
}

// A full browser device through the canonical ingress (same discipline as BILL-01).
async function establishDevice(email, deviceIp, { onboard = false } = {}) {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  assert.equal(csrf.status, 200);
  jar.capture(csrf);
  const token = await emulatorSignInToken(email);
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `Session exchange failed for ${email}: ${session.text}`);
  jar.capture(session);
  const profile = session.body;
  const post = async (pathname, body, extraHeaders = {}) => {
    const fresh = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp, jar });
    jar.capture(fresh);
    return stack.ingressRequest({ pathname, method: 'POST', deviceIp, jar, body, headers: { 'x-csrf-token': fresh.body.token, 'x-visionary-account': profile.id, ...extraHeaders } });
  };
  const get = async (pathname, extraHeaders = {}) =>
    stack.ingressRequest({ pathname, deviceIp, jar, headers: { 'x-visionary-account': profile.id, ...extraHeaders } });
  if (onboard) {
    const completed = await post('/api/auth/onboarding', { identity: 'professional', age_band: 'adult', full_name: 'QA Webhook Acceptance', preferred_language: 'English' });
    assert.equal(completed.status, 201, `Onboarding failed: ${completed.text}`);
  }
  return { jar, deviceIp, profile, post, get };
}

// The exact paid state a webhook event can later reference: an active test
// subscription with verified payment records on the durable account.
async function establishPaidSubscription(device) {
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: device.deviceIp, jar: device.jar });
  assert.equal(catalog.status, 200);
  const checkout = await device.post('/api/billing/checkouts', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: catalog.body.version });
  assert.equal(checkout.status, 201, `Checkout failed: ${checkout.text}`);
  const control = await fixtureControl('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.equal(control.status, 200, `Fixture completion failed: ${control.text}`);
  const verify = await device.post('/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: control.body.razorpay_payment_id,
    razorpay_subscription_id: control.body.razorpay_subscription_id,
    razorpay_signature: control.body.razorpay_signature,
  });
  assert.equal(verify.status, 201, `Verify failed: ${verify.text}`);
  assert.equal(verify.body.subscription.status, 'active');
  return { subscriptionId: control.body.razorpay_subscription_id, paymentId: control.body.razorpay_payment_id, invoiceId: verify.body.invoices[0]?.id, verifiedAt: Date.now() };
}

// A provider-shaped webhook POST: HMAC over the exact raw bytes, no Origin
// header and no cookies — precisely what a real payment provider sends.
function providerWebhook({ eventId, payload, rawBody, signature = null, headers = {} }) {
  const raw = Buffer.from(rawBody !== undefined ? rawBody : JSON.stringify(payload), 'utf8');
  const sign = signature === null ? createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex') : signature;
  return stack.ingressRequest({
    pathname: '/api/billing/webhooks/razorpay', method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': sign,
      'x-razorpay-event-id': eventId,
      ...headers,
    },
    body: raw,
  });
}

const capturedEvent = (eventId, paymentId, subscriptionId) => ({
  eventId,
  payload: { event: 'payment.captured', payload: { payment: { entity: { id: paymentId, subscription_id: subscriptionId, amount: 29900, currency: 'INR', status: 'captured' } } } },
});

const refundedEvent = (eventId, paymentId) => ({
  eventId,
  payload: { event: 'payment.refunded', payload: { refund: { entity: { id: 'rfnd_' + eventId.slice(-6), payment_id: paymentId, amount: 100 } }, payment: { entity: { id: paymentId } } } },
});

const disputeEvent = (eventId, paymentId) => ({
  eventId,
  payload: { event: 'payment.dispute.paid', payload: { dispute: { entity: { id: 'disp_' + eventId.slice(-6), payment_id: paymentId, amount: 29900, status: 'open' } } } },
});

before(async () => {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.BILL01_RUN_DIR || path.join(productRoot, 'artifacts/qa/bill02-webhook-acceptance', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  state.providerState = { subscriptions: new Map(), invoices: new Map(), payments: new Map(), creates: 0 };
  await stack.startStack({ runDir, providerState: state.providerState });

  const { initializeApp, deleteApp } = backendPackage('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'bill02-driver');
  state.deleteDriverApp = () => deleteApp(adminApp);

  state.users.payerA = await createEmulatorUser('payer-a@webhook.example');
  state.users.payerB = await createEmulatorUser('payer-b@webhook.example');
  state.devices.payerA = await establishDevice('payer-a@webhook.example', '203.0.113.21', { onboard: true });
  state.devices.payerB = await establishDevice('payer-b@webhook.example', '203.0.113.22', { onboard: true });
  state.paid = {};
});

after(async () => {
  await stack.stopStack();
  await stack.stopEmulators();
  if (state.deleteDriverApp) await state.deleteDriverApp();
});

test('a real provider-shaped webhook (no origin header, no cookies) is accepted and durably recorded', async () => {
  // No session, no CSRF, no Origin: exactly the provider's ingress surface.
  const eventId = 'evt_provider_probe_0001';
  const payload = { event: 'payment.authorized', payload: { payment: { entity: { id: 'pay_unmapped_probe', amount: 29900 } } } };
  const response = await providerWebhook({ eventId, payload });
  assert.equal(response.status, 201, `Provider-shaped webhook failed: ${response.text}`);
  assert.equal(response.body.received, true);

  const snapshot = await billingSnapshot(state.users.payerA);
  const recorded = snapshot.events.find(row => row.event === 'payment.authorized');
  assert.ok(recorded, 'The event must be durably recorded.');
  assert.equal(recorded.state, 'unmapped', 'An event with no local mapping is recorded, never guessed.');
});

test('webhook security envelope: tampered signature, missing event identity, malformed body and oversize fail closed', async () => {
  const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_tampered' } } } };

  const tampered = await providerWebhook({ eventId: 'evt_tampered_1', payload, signature: 'a'.repeat(64) });
  assert.equal(tampered.status, 403, 'A wrong signature must be refused.');

  const missingId = await providerWebhook({ eventId: '', payload });
  assert.equal(missingId.status, 400, 'A missing event identity must be refused.');

  const malformedRaw = '{"event": "payment.captured", BROKEN';
  const malformed = await providerWebhook({ eventId: 'evt_malformed_1', payload: null, rawBody: malformedRaw });
  assert.equal(malformed.status, 400, 'A malformed notification body must be refused.');

  const oversize = await providerWebhook({ eventId: 'evt_oversize_1', payload: null, rawBody: 'a'.repeat(300 * 1024) });
  assert.equal(oversize.status, 413, `The raw-byte webhook limit must hold (${oversize.status}).`);
});

test('duplicate delivery of the same signed bytes never double-applies; a same-id different-body event is a 409 conflict', async () => {
  const device = state.devices.payerA;
  state.paid.a = await establishPaidSubscription(device);
  const { subscriptionId, paymentId } = state.paid.a;

  const before = await billingSnapshot(state.users.payerA);
  const adjustmentsBefore = (before.account?.paymentAdjustments || []).length;

  const first = await providerWebhook({ ...capturedEvent('evt_dup_0001', paymentId, subscriptionId) });
  assert.equal(first.status, 201, `First delivery failed: ${first.text}`);
  const afterFirst = await billingSnapshot(state.users.payerA);
  const recorded = afterFirst.events.find(row => row.event === 'payment.captured');
  assert.ok(recorded, 'The captured event must be durably recorded.');
  assert.equal(recorded.state, 'accepted', 'A mapped event must be accepted.');

  const duplicate = await providerWebhook({ ...capturedEvent('evt_dup_0001', paymentId, subscriptionId) });
  assert.equal(duplicate.status, 201, 'A duplicate delivery must be acknowledged (idempotent), not an error.');
  const afterDuplicate = await billingSnapshot(state.users.payerA);
  const adjustments = afterDuplicate.account?.paymentAdjustments || [];
  assert.equal(adjustments.filter(id => id === paymentId).length, 1, 'The payment adjustment must be queued exactly once.');

  const conflicting = await providerWebhook({ eventId: 'evt_dup_0001', payload: { event: 'payment.captured', payload: { payment: { entity: { id: paymentId, subscription_id: subscriptionId, amount: 999 } } } } });
  assert.equal(conflicting.status, 409, 'The same event identity with different bytes must be a conflict.');

  const afterConflict = await billingSnapshot(state.users.payerA);
  assert.equal((afterConflict.account?.paymentAdjustments || []).filter(id => id === paymentId).length, 1, 'A rejected conflicting event must not change state.');
  assert.ok(adjustmentsBefore >= 0); // snapshot sanity
});

test('reordered and late notifications are recorded honestly without inventing state', async () => {
  // A refund notification for a payment the store has never seen: recorded as
  // unmapped, no account change, no fabricated refund.
  const before = await billingSnapshot(state.users.payerA);
  const adjustmentsBefore = (before.account?.paymentAdjustments || []).length;

  const early = await providerWebhook(refundedEvent('evt_early_refund_1', 'pay_never_seen_1'));
  assert.equal(early.status, 201, `Unmapped notification failed: ${early.text}`);
  const after = await billingSnapshot(state.users.payerA);
  const recorded = after.events.find(row => row.event === 'payment.refunded');
  assert.equal(recorded?.state, 'unmapped', 'The early refund must be recorded as unmapped.');
  assert.equal((after.account?.paymentAdjustments || []).length, adjustmentsBefore, 'An unmapped refund must not queue an account adjustment.');

  // A late subscription event for a subscription id that has no local mapping.
  const late = await providerWebhook({ eventId: 'evt_late_sub_1', payload: { event: 'subscription.charged', payload: { subscription: { entity: { id: 'sub_never_seen_1', status: 'active' } } } } });
  assert.equal(late.status, 201);
  const finalSnapshot = await billingSnapshot(state.users.payerA);
  const lateRecorded = finalSnapshot.events.find(row => row.event === 'subscription.charged');
  assert.equal(lateRecorded?.state, 'unmapped', 'The late subscription event must be recorded as unmapped.');
});

test('a mapped refund notification queues an adjustment; the scheduled reconciliation job converges the account from the provider', async () => {
  const device = state.devices.payerA;
  const { paymentId, invoiceId, verifiedAt } = state.paid.a;

  // The provider itself records a partial refund first; the webhook only
  // triggers the re-check. Provider state is the source of truth.
  const refundFixture = await fixtureControl('/fixture/refund-payment', { paymentId, amountRefunded: 10000 });
  assert.equal(refundFixture.status, 200, `Fixture refund failed: ${refundFixture.text}`);

  const refunded = await providerWebhook(refundedEvent('evt_refund_a_0001', paymentId));
  assert.equal(refunded.status, 201, `Refund webhook failed: ${refunded.text}`);

  // The sync throttle (30s since the verify-time sync) is the product's
  // recorded reconciliation cadence; wait it out honestly.
  const remaining = 30500 - (Date.now() - verifiedAt);
  if (remaining > 0) await stack.delay(remaining);

  const job = await device.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': RECONCILE_TOKEN });
  assert.equal(job.status, 201, `Reconciliation job failed: ${job.text}`);
  assert.equal(job.body.processed >= 1, true, 'The queued adjustment must be processed.');

  const invoice = await device.get(`/api/billing/invoices/${invoiceId}`);
  assert.equal(invoice.status, 200, `Invoice readback failed: ${invoice.text}`);
  assert.equal(invoice.body.status, 'partially_refunded', 'The invoice must reflect the provider-confirmed partial refund.');
  assert.equal(invoice.body.amountRefunded, 10000, 'The refunded amount must come from the provider read-back.');
});

test('a dispute notification queues a re-check but never fabricates a refund state', async () => {
  const device = state.devices.payerA;
  const { paymentId, invoiceId } = state.paid.a;

  const disputed = await providerWebhook(disputeEvent('evt_dispute_a_0001', paymentId));
  assert.equal(disputed.status, 201, `Dispute webhook failed: ${disputed.text}`);

  const job = await device.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': RECONCILE_TOKEN });
  assert.equal(job.status, 201);

  const invoice = await device.get(`/api/billing/invoices/${invoiceId}`);
  assert.equal(invoice.body.status, 'partially_refunded', 'A dispute without a provider-confirmed refund must not change the refund state.');
  assert.equal(invoice.body.amountRefunded, 10000, 'No invented refund amount.');
});

test('the reconciliation job credential is required', async () => {
  const device = state.devices.payerA;
  const missing = await device.post('/api/billing/jobs/reconcile', {});
  assert.equal(missing.status, 403, 'A reconciliation call without the job credential must be refused.');
  const wrong = await device.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': 'f'.repeat(64) });
  assert.equal(wrong.status, 403, 'A wrong job credential must be refused.');
});

test('queued adjustments survive a FULL product restart and reconcile after it', async () => {
  const device = state.devices.payerB;
  const paid = await establishPaidSubscription(device);
  const { paymentId, invoiceId, verifiedAt } = paid;

  // Provider records a full refund; the webhook queues the adjustment.
  const refundFixture = await fixtureControl('/fixture/refund-payment', { paymentId, amountRefunded: 29900 });
  assert.equal(refundFixture.status, 200);
  const refunded = await providerWebhook(refundedEvent('evt_restart_refund_1', paymentId));
  assert.equal(refunded.status, 201);

  // Full product restart: app, TLS terminator and control plane all stop and
  // return; the emulator (the durable store) and the provider state survive —
  // exactly the hosted topology.
  await stack.stopStack();
  await stack.startStack({ runDir, providerState: state.providerState });

  const remaining = 30500 - (Date.now() - verifiedAt);
  if (remaining > 0) await stack.delay(remaining);

  const job = await stack.ingressRequest({
    pathname: '/api/billing/jobs/reconcile', method: 'POST', deviceIp: '203.0.113.22',
    headers: { 'x-visionary-billing-job': RECONCILE_TOKEN }, body: {},
  });
  assert.equal(job.status, 201, `Post-restart reconciliation failed: ${job.text}`);

  const invoice = await device.get(`/api/billing/invoices/${invoiceId}`);
  assert.equal(invoice.status, 200, `Invoice readback after restart failed: ${invoice.text}`);
  assert.equal(invoice.body.status, 'refunded', 'The queued adjustment must survive the restart and converge from the provider.');
  assert.equal(invoice.body.amountRefunded, 29900);
});

// Fail-fast law proof (KAN-60): with BILL02_SELF_TEST_FAIL=1 exactly one
// deliberate assertion failure must fail this suite and the registered command.
test('deliberate self-test failure proof (only when BILL02_SELF_TEST_FAIL=1)', { skip: process.env.BILL02_SELF_TEST_FAIL !== '1' }, () => {
  assert.equal('self-test', 'failing', 'The deliberate BILL-02 self-test failure.');
});
