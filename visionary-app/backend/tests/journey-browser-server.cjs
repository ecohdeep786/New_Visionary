// Whole journey fixture: real demo Auth Emulator; transactional memory data and fake payments.
// Never reads .env or credentials, initializes live Firestore, or contacts a payment provider.
const path = require('node:path'), { createRequire } = require('node:module'), { createHmac } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const { ConfigService } = req('@nestjs/config'), { Module } = req('@nestjs/common'), { NestFactory } = req('@nestjs/core');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { FirebaseProductController } = req('./dist/src/auth/firebase-product/firebase-product.controller.js');
const { BillingService } = req('./dist/src/billing/billing.service.js'), { BillingController } = req('./dist/src/billing/billing.controller.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js'), { RazorpayProvider } = req('./dist/src/billing/razorpay.provider.js');
const { AccountController } = req('./dist/src/auth/firebase-product/account.controller.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const secret = 'whole-journey-only-payment-secret';
const config = new ConfigService({ FIREBASE_PROJECT_ID: 'demo-visionary-auth', FIREBASE_PROJECT_KIND: 'emulator', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', AUTH_PUBLIC_ORIGIN: 'http://127.0.0.1:5175', AUTH_RATE_LIMIT_KEY: 'whole-journey-only-rate-limit-secret', BILLING_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_test_journey', RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: 'whole-journey-only-webhook', RAZORPAY_PLAN_PERSONAL_MONTHLY: 'plan_personalmonth', RAZORPAY_PLAN_PERSONAL_ANNUAL: 'plan_personalyear', RAZORPAY_PLAN_FAMILY_MONTHLY: 'plan_familymonth', RAZORPAY_PLAN_FAMILY_ANNUAL: 'plan_familyyear' });
const admin = new FirebaseAdminService(config), auth = new FirebaseProductService(admin, config), memory = billingMemory();
auth.db = () => memory.db;
const provider = new RazorpayProvider(config), subscriptions = new Map(), invoices = new Map(), payments = new Map(), unavailable = new Set(); let sequence = 0;
provider.request = async (method, resource, body) => {
  if (method === 'POST' && resource === 'subscriptions') { const sub = { id: `sub_journey${++sequence}`, status: 'created', quantity: 1, plan_id: body.plan_id, notes: body.notes }; subscriptions.set(sub.id, sub); return structuredClone(sub); }
  const id = resource.split('/')[1];
  if (method === 'POST' && resource.endsWith('/cancel')) { const sub = subscriptions.get(id); if (!body.cancel_at_cycle_end) sub.status = 'cancelled'; return structuredClone(sub); }
  if (resource.startsWith('subscriptions/')) return structuredClone(subscriptions.get(id));
  if (resource.startsWith('invoices?')) return { items: structuredClone(invoices.get(new URLSearchParams(resource.split('?')[1]).get('subscription_id')) || []) };
  if (resource.startsWith('payments/')) return structuredClone(payments.get(id));
  if (resource.startsWith('subscriptions?')) return { items: [...subscriptions.values()] };
  throw Error('Unexpected isolated provider operation');
};
const repo = new BillingRepository(auth), billing = new BillingService(repo, provider, auth);
class FixtureModule {}
Module({ controllers: [FirebaseProductController, BillingController, AccountController], providers: [{ provide: FirebaseAdminService, useValue: admin }, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: config }, { provide: BillingService, useValue: billing }] })(FixtureModule);
(async () => {
  const app = await NestFactory.create(FixtureModule, { logger: false, bodyParser: false });
  const { raw, json } = req('express'); app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' })); app.use(json({ limit: '24kb' })); app.use(req('cookie-parser')());
  const current = request => auth.authenticate(request.cookies?.['visionary-session'], request.cookies?.['visionary-device'], false);
  const endpoint = handler => async (request, response, next) => { try { await handler(request, response, next); } catch (error) { response.status(error.getStatus?.() || 500).json({ message: 'Isolated journey request failed.' }); } };
  app.use('/__test/status', (_request, response) => {
    const rows = [...memory.rows];
    response.json({ accounts: rows.filter(([key]) => /^visionary_accounts\/[^/]+$/.test(key)).length, providerCreates: sequence,
      events: rows.filter(([key]) => key.startsWith('visionary_auth_events/')).map(([, value]) => ({ type: value.type, hasIp: !!value.ip, hasBrowser: !!value.userAgent })),
      sessions: rows.filter(([key]) => key.startsWith('visionary_auth_sessions/')).map(([, value]) => ({ revoked: !!value.revokedAt })) });
  });
  app.use('/api/__test/record-check', endpoint(async (request, response) => {
    const { uid } = await current(request), data = memory.rows.get(`visionary_accounts/${uid}/billing/test`);
    const documents = [...memory.rows].filter(([key]) => key.startsWith(`visionary_accounts/${uid}/billing/test/invoices/`));
    response.json({ sameAuthUid: data?.uid === uid && memory.rows.has(`visionary_accounts/${uid}`), basePlan: data?.basePlan, subscribed: !!data?.subscription, invoices: documents.length, invoiceUidMatches: documents.every(([, value]) => value.uid === uid && value.billingAccountId === uid), providerCreates: sequence });
  }));
  app.use('/api/__test/expire-session', endpoint(async (request, response) => { const identity = await current(request); memory.rows.get(`visionary_auth_sessions/${identity.sessionId}`).lastSeen = 0; response.json({ expired: true }); }));
  app.use('/api/__test/verify-outage', endpoint(async (request, response) => { unavailable.add((await current(request)).uid); response.json({ enabled: true }); }));
  app.use('/api/billing/verify', endpoint(async (request, response, next) => {
    const { uid } = await current(request);
    if (unavailable.delete(uid)) return response.status(503).json({ message: 'Payment confirmation is temporarily unavailable. Refresh status before retrying.' });
    // Continue into the real controller below, preserving its CSRF/account checks.
    next();
  }));
  app.use('/api/__test/complete', endpoint(async (request, response) => {
    const { uid } = await current(request), id = request.body.subscriptionId, sub = subscriptions.get(id);
    if (!sub || memory.rows.get(`visionary_billing_test_subscriptions/${id}`)?.uid !== uid) return response.status(404).end();
    const yearly = sub.plan_id.endsWith('year'), family = sub.plan_id.includes('family'), amount = family ? yearly ? 499000 : 49900 : yearly ? 299000 : 29900;
    const start = Math.floor(Date.now() / 1000) - 1, end = start + (yearly ? 365 : 30) * 86400;
    const invoice = { id: `inv_${id.slice(4)}`, subscription_id: id, status: 'paid', currency: 'INR', amount, amount_paid: amount, billing_start: start, billing_end: end, issued_at: start, paid_at: start, payment_id: `pay_${id.slice(4)}` };
    invoices.set(id, [invoice]); Object.assign(sub, { status: 'active', current_start: start, current_end: end, charge_at: end }); payments.set(invoice.payment_id, { id: invoice.payment_id, invoice_id: invoice.id, amount, currency: 'INR', status: 'captured', captured: true, amount_refunded: 0 });
    response.json({ razorpay_subscription_id: id, razorpay_payment_id: invoice.payment_id, razorpay_signature: createHmac('sha256', secret).update(`${invoice.payment_id}|${id}`).digest('hex') });
  }));
  app.setGlobalPrefix('api'); app.enableShutdownHooks(); await app.listen(3035, '127.0.0.1'); console.log('Whole journey harness ready: demo Auth, memory data, fictional provider.');
})().catch(() => { console.error('Whole journey fixture could not start.'); process.exitCode = 1; });
