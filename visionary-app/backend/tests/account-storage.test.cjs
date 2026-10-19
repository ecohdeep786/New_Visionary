const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Timestamp } = req('firebase-admin/firestore');
const { ConfigService } = req('@nestjs/config');
const { UnauthorizedException, Module } = req('@nestjs/common'), { NestFactory } = req('@nestjs/core');
const { migrateAccount } = req('./dist/src/auth/firebase-product/account-migration.js');
const { AccountController } = req('./dist/src/auth/firebase-product/account.controller.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { BillingService } = req('./dist/src/billing/billing.service.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');

function legacy() {
  const f = billingMemory(), uid = 'one-user', root = `visionary_accounts/${uid}`;
  const profile = { full_name: 'Same name', version: 4, createdAt: Timestamp.fromMillis(1000), lastSignInAt: Timestamp.fromMillis(2000), profile: { identity: 'professional', career_goal: 'Keep this' }, onboarding: { status: 'complete' } };
  const billing = { uid, basePlan: 'start', schemaVersion: 1, revision: 8, nextSyncAt: Date.now() - 1000, subscription: { id: 'sub_retained', billedTo: { name: 'Original name' }, paidThrough: 9999999999 }, invoices: [{ id: 'inv_retained' }] };
  f.rows.set(root, profile); f.rows.set(`visionary_billing_test_accounts/${uid}`, billing);
  f.rows.set(`visionary_billing_test_accounts/${uid}/commands/saved-command`, { uid, status: 'reserved' });
  for (let n = 0; n < 135; n++) f.rows.set(`visionary_billing_test_accounts/${uid}/invoices/inv_${String(n).padStart(4, '0')}`, { uid, billingAccountId: uid, amount: n, billedTo: { name: 'Original name' } });
  f.rows.set('visionary_auth_sessions/device-hash', { uid, cookieHash: 'private-operational-hash', lastSeen: 2000, expires: 28801000 });
  f.rows.set('visionary_auth_events/sign-in', { uid, sessionId: 'device-hash', type: 'sign_in', provider: 'password', ip: '127.0.0.1', userAgent: 'Fixture browser', createdAt: Timestamp.fromMillis(1000) });
  f.rows.set('visionary_auth_events/sign-out', { uid, sessionId: 'device-hash', type: 'sign_out', ip: '127.0.0.1', createdAt: Timestamp.fromMillis(2000) });
  return { ...f, uid, root, profile, billing, identity: { uid, email: 'fixture@example.test', emailVerified: true, providerData: [{ providerId: 'password' }] } };
}

test('UID-tree migration inspects without writes and copies every invoice over page boundaries without deleting history', async () => {
  const f = legacy(), before = new Map(f.rows);
  const plan = await migrateAccount(f.db, f.uid, f.identity);
  assert.equal(plan.completed, 1); assert.equal(plan.copied, 140); assert.deepEqual(f.rows, before);
  const result = await migrateAccount(f.db, f.uid, f.identity, true);
  assert.equal(result.copied, 140); assert.equal(result.completed, 1);
  for (const [key, value] of before) if (key !== f.root) assert.deepEqual(f.rows.get(key), value);
  const saved = f.rows.get(f.root); assert.equal(saved.uid, f.uid); assert.equal(saved.storageVersion, 2);
  assert.deepEqual(saved.profile, f.profile.profile); assert.deepEqual(saved.onboarding, f.profile.onboarding);
  assert.deepEqual(f.rows.get(`${f.root}/billing/test`), f.billing);
  assert.equal(f.rows.get(`${f.root}/devices/device-hash`).cookieHash, undefined);
  assert.equal(f.rows.get(`${f.root}/devices/device-hash`).provider, 'password');
  assert.equal(f.rows.get(`${f.root}/authEvents/sign-out`).uid, f.uid);
  assert.equal(f.rows.get(`visionary_billing_test_queue/${f.uid}`).nextSyncAt, f.billing.nextSyncAt);
  f.rows.get(`${f.root}/billing/test`).revision++;
  assert.equal((await migrateAccount(f.db, f.uid, f.identity, true)).alreadyMigrated, 1);
  assert.equal(f.rows.get(`${f.root}/billing/test`).revision, 9);
});

test('migration rejects foreign ownership and destination conflicts while retaining original documents', async () => {
  const f = legacy();
  await assert.rejects(migrateAccount(f.db, f.uid, { uid: 'foreign' }, true));
  assert.equal(f.rows.get(f.root).storageMigration, undefined);
  f.rows.set(`${f.root}/billing/test`, { ...f.billing, revision: 99 });
  await assert.rejects(migrateAccount(f.db, f.uid, f.identity, true));
  assert.equal(f.rows.get(`visionary_billing_test_accounts/${f.uid}`).revision, 8);
  assert.equal(f.rows.get(`${f.root}/billing/test`).revision, 99);
  assert.equal(f.rows.get(f.root).storageMigration.status, 'copying');
});

test('an interrupted additive migration resumes without replacing the paid subscription or losing child records', async () => {
  const f = legacy(), transaction = f.db.runTransaction; let calls = 0;
  f.db.runTransaction = action => { if (++calls === 9) throw Error('Simulated outage'); return transaction(action); };
  await assert.rejects(migrateAccount(f.db, f.uid, f.identity, true));
  assert.equal(f.rows.get(f.root).storageMigration.status, 'copying');
  f.db.runTransaction = transaction;
  const resumed = await migrateAccount(f.db, f.uid, f.identity, true);
  assert.ok(resumed.existing > 0); assert.equal(resumed.completed, 1);
  assert.deepEqual(f.rows.get(`${f.root}/billing/test`).subscription, f.billing.subscription);
  assert.equal([...f.rows.keys()].filter(key => key.startsWith(`${f.root}/billing/test/invoices/`)).length, 135);
});

test('account HTTP overview and paginated records are owner-bound, strip security fields and do not expose a Family payer invoice', async () => {
  const memory = billingMemory(), now = Date.now();
  const auth = { getDatabase: () => memory.db, authenticate: async cookie => { if (cookie !== 'owner-cookie') throw new UnauthorizedException(); return { uid: 'owner', sessionId: 'device_a' }; }, me: async uid => ({ id: uid, full_name: 'Owner', onboarding_complete: true, getting_started_complete: true }) };
  const billing = { account: async uid => ({ uid, plan: 'start', invoices: [] }) };
  auth.accountDetails = async uid => ({ profile: await auth.me(uid), identity: { uid }, onboarding: { status: 'complete' } });
  for (const id of ['device_a', 'device_b']) memory.rows.set(`visionary_accounts/owner/devices/${id}`, { uid: 'owner', firstSeenAt: Timestamp.fromMillis(now), lastSeenAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + 3600000), cookieHash: 'must-not-escape', userAgent: 'Fixture browser', observedIp: '127.0.0.1' });
  memory.rows.set('visionary_accounts/owner/billing/test/invoices/inv_a', { uid: 'owner', amount: 29900, status: 'paid', cookieHash: 'must-not-escape' });
  memory.rows.set('visionary_accounts/payer/billing/test/invoices/inv_secret', { uid: 'payer', amount: 49900 });
  class FixtureModule {}
  Module({ controllers: [AccountController], providers: [{ provide: FirebaseProductService, useValue: auth }, { provide: BillingService, useValue: billing }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const url = await app.getUrl(), headers = { Cookie: 'visionary-session=owner-cookie; visionary-device=device', 'X-Visionary-Account': 'owner' };
    assert.equal((await fetch(url + '/api/account/overview')).status, 401);
    assert.equal((await fetch(url + '/api/account/overview', { headers: { ...headers, 'X-Visionary-Account': 'payer' } })).status, 409);
    const overview = await (await fetch(url + '/api/account/overview', { headers })).json(); assert.equal(overview.uid, 'owner'); assert.equal(overview.profile.id, overview.billing.uid);
    assert.equal(overview.structure.uid, overview.uid); assert.equal(overview.structure.sections.billing.paths.account, 'visionary_accounts/owner/billing/test');
    assert.equal(overview.structure.sections.learning.availability, 'not-connected');
    const first = await (await fetch(url + '/api/account/devices?limit=1', { headers })).json(); assert.equal(first.items.length, 1); assert.equal(first.items[0].current, true); assert.equal(first.items[0].status, 'active'); assert.equal(first.nextCursor, 'device_a');
    const second = await (await fetch(url + '/api/account/devices?limit=1&after=' + first.nextCursor, { headers })).json(); assert.equal(second.items[0].id, 'device_b'); assert.equal(second.nextCursor, null);
    assert.doesNotMatch(JSON.stringify([first, second]), /cookieHash|must-not-escape/);
    const invoices = await (await fetch(url + '/api/account/invoices', { headers })).json(); assert.equal(invoices.items.length, 1); assert.equal(invoices.items[0].id, 'inv_a'); assert.doesNotMatch(JSON.stringify(invoices), /secret|cookieHash/);
    assert.equal((await fetch(url + '/api/account/devices?limit=1000', { headers })).status, 400);
    assert.equal((await fetch(url + '/api/account/invoices?after=..%2Fpayer', { headers })).status, 400);
    assert.equal((await fetch(url + '/api/account/devices?uid=payer', { headers })).status, 200);
  } finally { await app.close(); }
});
