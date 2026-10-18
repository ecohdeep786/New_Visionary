const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { accountDirectory, directoryNeedsUpdate, reconcileAccountDirectory } = req('./dist/src/auth/firebase-product/account-directory.js');
const { verifyAccountTree } = req('./dist/src/auth/firebase-product/account-tree-verifier.js');
const { deviceRecord } = req('./dist/src/auth/firebase-product/account-storage.js');
const { Timestamp } = req('firebase-admin/firestore');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const { BillingService } = req('./dist/src/billing/billing.service.js');
const { BillingRepository } = req('./dist/src/billing/billing.repository.js');

function fixture() {
  const f = billingMemory(), uid = 'owner', root = `visionary_accounts/${uid}`;
  f.rows.set(root, { uid, identity: { uid }, storageVersion: 2, profile: { full_name: 'Keep this' }, onboarding: { status: 'complete' } });
  f.rows.set(`${root}/billing/test`, { uid, basePlan: 'start', revision: 8, subscription: { id: 'sub_retained' }, nextSyncAt: 500 });
  f.rows.set('visionary_billing_test_queue/owner', { uid, revision: 8, nextSyncAt: 500 });
  f.rows.set('visionary_billing_test_accounts/owner', { uid, revision: 1 });
  f.rows.set(`${root}/billing/test/commands/cmd`, { uid });
  f.rows.set(`${root}/billing/test/invoices/inv`, { uid, billingAccountId: uid });
  const session = { uid, cookieHash: 'operational-only', createdAt: Timestamp.fromMillis(1000), lastSeen: 2000, expires: 5000, provider: 'password' };
  f.rows.set('visionary_auth_sessions/device', session);
  f.rows.set(`${root}/devices/device`, deviceRecord(uid, 'device', session));
  const event = { uid, sessionId: 'device', type: 'sign_in' };
  f.rows.set('visionary_auth_events/event', event); f.rows.set(`${root}/authEvents/event`, event);
  return { ...f, uid, root };
}

test('one UID directory groups native sections and labels future domains without creating fictional activity', async () => {
  const f = fixture(), directory = accountDirectory(f.uid);
  assert.equal(directory.accountPath, f.root);
  assert.equal(Object.keys(directory.sections).length, 16);
  assert.equal(directory.sections.billing.paths.account, `${f.root}/billing/test`);
  assert.equal(directory.sections.authentication.paths.devices, `${f.root}/devices`);
  for (const section of Object.values(directory.sections)) {
    for (const recordPath of Object.values(section.paths || { link: section.linkPath })) assert.ok(recordPath === f.root || recordPath.startsWith(f.root + '/'));
    if (section.store === 'domain-service') assert.equal(section.availability, 'not-connected');
  }
  await reconcileAccountDirectory(f.db, f.uid, true);
  assert.equal([...f.rows.keys()].some(key => key.includes('/domainLinks/')), false);
  assert.notEqual(accountDirectory('other').accountPath, directory.accountPath);
  for (const uid of ['', 'a/b', '..', '__reserved__', 'x'.repeat(129), null]) assert.throws(() => accountDirectory(uid));
});

test('directory inspect/backfill is additive, idempotent and preserves paid state and every existing record', async () => {
  const f = fixture(), before = new Map(f.rows);
  assert.deepEqual(await reconcileAccountDirectory(f.db, f.uid), { changed: true, written: false });
  assert.deepEqual(f.rows, before);
  assert.deepEqual(await reconcileAccountDirectory(f.db, f.uid, true), { changed: true, written: true });
  assert.equal(f.rows.size, before.size + 1);
  for (const [key, data] of before) assert.deepEqual(f.rows.get(key), data);
  assert.deepEqual(await reconcileAccountDirectory(f.db, f.uid, true), { changed: false, written: false });
});

test('foreign ownership, unfinished migration and newer directory schema stop without overwriting data', async () => {
  for (const change of [f => { f.rows.get(f.root).uid = 'other'; }, f => { f.rows.get(f.root).identity.uid = 'other'; }, f => { f.rows.get(f.root).storageMigration = { status: 'copying' }; }, f => { f.rows.set(`${f.root}/structure/account`, { uid: 'other', schemaVersion: 1 }); }, f => { f.rows.set(`${f.root}/structure/account`, { uid: f.uid, schemaVersion: 2 }); }]) {
    const f = fixture(); change(f); const before = new Map(f.rows);
    await assert.rejects(reconcileAccountDirectory(f.db, f.uid, true));
    assert.deepEqual(f.rows, before);
  }
  assert.throws(() => directoryNeedsUpdate('owner', { uid: 'owner' }));
});

test('current-tree audit ignores historical billing drift but detects current ownership, directory and mirrored-record defects', async () => {
  const f = fixture(); await reconcileAccountDirectory(f.db, f.uid, true);
  const pass = await verifyAccountTree(f.db, f.uid);
  assert.deepEqual(pass, { accounts: 1, devices: 1, events: 1, invoices: 1, commands: 1, directoryDifferences: 0, ownershipConflicts: 0, recordDifferences: 0 });
  const before = new Map(f.rows); await verifyAccountTree(f.db, f.uid); assert.deepEqual(f.rows, before);
  f.rows.get(`${f.root}/billing/test/invoices/inv`).uid = 'other';
  f.rows.get(`${f.root}/structure/account`).sections.projects.availability = 'connected';
  f.rows.get(`${f.root}/authEvents/event`).type = 'changed';
  f.rows.get(`${f.root}/devices/device`).cookieHash = 'must-be-rejected';
  f.rows.get('visionary_billing_test_queue/owner').nextSyncAt = 501;
  const failed = await verifyAccountTree(f.db, f.uid);
  assert.ok(failed.ownershipConflicts >= 2); assert.equal(failed.directoryDifferences, 1); assert.ok(failed.recordDifferences >= 3);
});

test('real Family departure may advance billing revision without invalidating the unchanged due queue', async () => {
  const f = fixture(); await reconcileAccountDirectory(f.db, f.uid, true);
  const saved = f.rows.get(`${f.root}/billing/test`); saved.familyMembers = [{ uid: 'member' }];
  f.rows.set('visionary_billing_test_memberships/member', { owner: f.uid });
  const service = new BillingService(new BillingRepository({ getDatabase: () => f.db }), {}, {});
  service.account = async () => ({}); // Response projection only; run the real mutation.
  await service.leaveFamily('member');
  assert.equal(f.rows.get(`${f.root}/billing/test`).revision, 9);
  assert.equal(f.rows.get('visionary_billing_test_queue/owner').revision, 8);
  assert.equal((await verifyAccountTree(f.db, f.uid)).recordDifferences, 0);
});
