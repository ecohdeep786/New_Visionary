// Isolated billing browser harness: fictional account + memory repository.
// Real-provider mode reads only the Razorpay TEST fields; never initializes Firebase.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module'), { createHmac } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { ConfigService } = req('@nestjs/config'), { Module, UnauthorizedException } = req('@nestjs/common'), { NestFactory } = req('@nestjs/core');
const { BillingService } = req('./dist/src/billing/billing.service.js'), { BillingController } = req('./dist/src/billing/billing.controller.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js'), { RazorpayProvider } = req('./dist/src/billing/razorpay.provider.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const real = process.argv.includes('--razorpay-test');
const origin = process.env.BILLING_REVIEW_ORIGIN || 'http://localhost:5173', port = Number(process.env.BILLING_REVIEW_PORT || 3037), memory = billingMemory();
if (!/^http:\/\/localhost:(5173|4173)$/.test(origin)) throw Error('Billing browser review requires its explicit local origin.');
const testSettings = real ? req('dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../upstream/backend/.env'))) : {};
const settings = { AUTH_PUBLIC_ORIGIN: origin, BILLING_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: 'fixture-payment-secret', RAZORPAY_WEBHOOK_SECRET: 'fixture-webhook-secret', RAZORPAY_PLAN_PERSONAL_MONTHLY: 'plan_personalmonth', RAZORPAY_PLAN_PERSONAL_ANNUAL: 'plan_personalyear', RAZORPAY_PLAN_FAMILY_MONTHLY: 'plan_familymonth', RAZORPAY_PLAN_FAMILY_ANNUAL: 'plan_familyyear' };
if (real) for (const key of Object.keys(settings).filter(key => key.startsWith('RAZORPAY_'))) settings[key] = testSettings[key];
if (!settings.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) throw Error('Live credentials are prohibited in this harness.');
const config = new ConfigService(settings);
const profile = uid => ({ id: uid, email: 'billing-review@example.test', full_name: 'Billing Review', age_band: 'adult', identity: 'professional', education_stage: 'professional', preferred_language: 'English', onboarding_complete: true, getting_started_complete: true, auth_source: 'firebase' });
const auth = { getDatabase: () => memory.db, me: async uid => profile(uid), rateLimit: async () => {}, authenticate: async (cookie, device) => { if (!/^billing-review-[a-z0-9-]+$/.test(cookie || '') || device !== 'fixture-device') throw new UnauthorizedException(); return { uid: cookie }; } };
const provider = new RazorpayProvider(config), subscriptions = new Map(), invoices = new Map(), payments = new Map(); let sequence = 0;
if (!real) provider.request = async (method, resource, body) => {
  if (method === 'POST' && resource === 'subscriptions') { const sub = { id: `sub_review${++sequence}`, status: 'created', quantity: 1, plan_id: body.plan_id, notes: body.notes }; subscriptions.set(sub.id, sub); return sub; }
  const id = resource.split('/')[1];
  if (method === 'POST' && resource.endsWith('/cancel')) { const sub = subscriptions.get(id); if (!body.cancel_at_cycle_end) sub.status = 'cancelled'; return { ...sub }; }
  if (resource.startsWith('subscriptions/')) return { ...subscriptions.get(id) };
  if (resource.startsWith('invoices?')) return { items: invoices.get(new URLSearchParams(resource.split('?')[1]).get('subscription_id')) || [] };
  if (resource.startsWith('payments/')) return payments.get(id);
  if (resource.startsWith('subscriptions?')) return { items: [...subscriptions.values()] };
  throw Error('Unexpected fixture provider operation');
};
const repo = new BillingRepository(auth), service = new BillingService(repo, provider, auth);
class FixtureModule {}
Module({ controllers: [BillingController], providers: [{ provide: ConfigService, useValue: config }, { provide: FirebaseProductService, useValue: auth }, { provide: BillingService, useValue: service }] })(FixtureModule);
(async () => {
  const { json, raw } = req('express');
  const app = await NestFactory.create(FixtureModule, { logger: false, bodyParser: false });
  app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' })); app.use(json({ limit: '24kb' })); app.use(req('cookie-parser')());
  app.use('/api/auth/me', (request, response) => { const uid = request.cookies?.['visionary-session']; if (!uid) return response.status(401).json({ message: 'Sign in to continue.' }); response.json(profile(uid)); });
  app.use('/api/auth/csrf', (_request, response) => response.json({ token: 'c'.repeat(64) }));
  app.use('/__test/storage-check', (request, response) => {
    const uid = request.cookies?.['visionary-session'];
    if (!/^billing-review-[a-z0-9-]+$/.test(uid || '')) return response.status(401).end();
    const saved = memory.rows.get(`visionary_accounts/${uid}/billing/test`);
    response.json({ uidMatches: saved?.uid === uid, basePlan: saved?.basePlan, hasSubscription: !!saved?.subscription, invoiceCount: saved?.invoices?.length || 0, ...(real ? {} : { providerCreateCount: sequence }) });
  });
  app.use('/__test/complete', (request, response) => {
    if (real) return response.status(404).end();
    const id = request.body.subscriptionId, sub = subscriptions.get(id); if (!sub) return response.status(404).end();
    const yearly = sub.plan_id.endsWith('year'), family = sub.plan_id.includes('family'), amount = family ? yearly ? 499000 : 49900 : yearly ? 299000 : 29900;
    const start = Math.floor(Date.now() / 1000) - 1, end = start + (yearly ? 365 : 30) * 86400;
    const inv = { id: `inv_review${sequence}`, subscription_id: id, status: 'paid', currency: 'INR', amount, amount_paid: amount, billing_start: start, billing_end: end, paid_at: start, payment_id: `pay_review${sequence}` };
    invoices.set(id, [inv]); Object.assign(sub, { status: 'active', current_start: start, current_end: end, charge_at: end });
    payments.set(inv.payment_id, { id: inv.payment_id, invoice_id: inv.id, amount, currency: 'INR', status: 'captured', captured: true, amount_refunded: 0 });
    response.json({ razorpay_subscription_id: id, razorpay_payment_id: inv.payment_id, razorpay_signature: createHmac('sha256', settings.RAZORPAY_KEY_SECRET).update(`${inv.payment_id}|${id}`).digest('hex') });
  });
  app.use('/__test/cleanup', async (_request, response) => {
    let cancelled = 0;
    if (real) for (const [key, value] of memory.rows) {
      if (!/^visionary_accounts\/[^/]+\/billing\/test$/.test(key) || !value.subscription?.id) continue;
      const sub = await provider.getSubscription(value.subscription.id);
      if (sub.notes?.visionary_attempt !== value.attempt?.id) continue;
      if (!['cancelled', 'expired', 'completed'].includes(sub.status)) {
        await provider.request('POST', `subscriptions/${sub.id}/cancel`, { cancel_at_cycle_end: !['created', 'authenticated'].includes(sub.status) }); ++cancelled;
      }
    }
    response.json({ cancelled, testOnly: true });
  });
  app.setGlobalPrefix('api'); await app.listen(port, '127.0.0.1');
  console.log(JSON.stringify({ ready: true, port, mode: real ? 'razorpay-test' : 'fictional-provider', firestore: 'memory', credentialsExposed: false }));
  const shutdown = async () => { await app.close(); process.exit(0); };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
})().catch(() => { console.error('Billing review fixture failed to start; credentials withheld.'); process.exitCode = 1; });
