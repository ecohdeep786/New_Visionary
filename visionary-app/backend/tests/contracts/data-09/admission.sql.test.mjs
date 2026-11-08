import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { AdmissionRepository } = req('./dist/src/admission/admission.repository.js');
const { PrismaClient } = req('@prisma/client');
let f, repo, second, otherRepo, target;
const reviewer = 'reviewer_' + randomUUID().replaceAll('-', ''), reviewer2 = 'reviewer_' + randomUUID().replaceAll('-', '');
const proof = () => 'proof_' + randomUUID().replaceAll('-', '');
const expiry = (days = 1) => new Date(Date.now() + days * 86400_000).toISOString();
const command = (subjectUid, operation, expectedRevision, payload = {}, commandId = randomUUID()) => ({ commandId, subjectUid, operation, expectedRevision, payload });
const denied = error => error.code === 'unauthorized';
before(async () => {
  f = await stagingDatabase(); await new MigrationRunner(f.store(), canonicalMigrations(backend)).applyAll(); await f.grantRuntime();
  await f.db.person.createMany({ data: [{ uid: reviewer }, { uid: reviewer2 }] });
  target = { role: f.runtimeRole, schema: f.schema, database: new URL(f.config.runtimeUrl).pathname.slice(1) };
  repo = new AdmissionRepository(f.runtime, target, new Set([reviewer, reviewer2]));
  second = new PrismaClient({ datasources: { db: { url: f.config.runtimeUrl } } });
  otherRepo = new AdmissionRepository(second, target, new Set([reviewer, reviewer2]));
});
after(async () => { await second?.$disconnect(); await f?.close(); });
async function person(label = 'person') {
  const uid = label + '_' + randomUUID().replaceAll('-', ''); await f.db.person.create({ data: { uid } }); return uid;
}
async function assure(uid, classification, expectedRevision = 0) {
  return repo.execute(reviewer, command(uid, 'age.assure', expectedRevision, { classification, evidenceRef: proof(), expiresAt: expiry(3) }));
}
async function family(link = false) {
  const child = await person('child'), guardian = await person('guardian');
  await assure(child, 'minor'); await assure(guardian, 'adult');
  await repo.execute(guardian, command(child, 'link.request', 0));
  if (link) { await repo.execute(reviewer, command(child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() })); await repo.execute(guardian, command(child, 'link.confirm', 2)); }
  return { child, guardian };
}
test('unknown assurance and forged age/role/policy never establish admission', async () => {
  const uid = await person(); assert.equal((await repo.admission(uid)).status, 'blocked');
  await assert.rejects(repo.withAdmission(uid, async () => assert.fail('denied callback ran')), denied);
  for (const payload of [{ birthYear: 2000 }, { claimedAge: 30, roleHint: 'parent' }, { classification: 'adult', reviewerUid: reviewer }, { policy: 'approved' }])
    await assert.rejects(repo.execute(uid, command(uid, 'age.assure', 0, payload)), e => e.code === 'invalid_command');
  await assert.rejects(repo.admission('unknown_uid'), denied);
  assert.equal(await f.db.admissionAssurance.count({ where: { uid } }), 0);
});
test('only configured independent reviewers can record current age assurance; caller cannot mutate trust', async () => {
  const uid = await person(), settings = new Set([reviewer]), pinned = new AdmissionRepository(f.runtime, target, settings);
  settings.add(uid);
  const c = command(uid, 'age.assure', 0, { classification: 'adult', evidenceRef: proof(), expiresAt: expiry() });
  await assert.rejects(pinned.execute(uid, c), denied);
  await assert.rejects(pinned.execute(reviewer, command(reviewer, 'age.assure', 0, c.payload)), denied);
  const adult = await person(); await assure(adult, 'adult');
  assert.equal((await repo.admission(adult)).status, 'admitted');
  const untrusted = new AdmissionRepository(f.runtime, target, new Set());
  assert.equal((await untrusted.admission(adult)).status, 'blocked');
});
test('all-age eligibility includes young children but requires reviewed guardian-first consent', async () => {
  const { child, guardian } = await family();
  assert.equal((await repo.admission(child)).status, 'pending_guardian');
  await assert.rejects(repo.execute(guardian, command(child, 'link.confirm', 1)), denied);
  await assert.rejects(repo.execute(guardian, command(child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() })), denied);
  await assert.rejects(repo.execute(child, command(child, 'link.confirm', 1)), denied);
  await repo.execute(reviewer, command(child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() }));
  assert.equal((await repo.admission(child)).status, 'pending_guardian');
  await repo.execute(guardian, command(child, 'link.confirm', 2));
  assert.equal((await repo.admission(child)).status, 'admitted');
  const result = await repo.withAdmission(child, tx => tx.auditEvent.count({ where: { uid: child } })); assert.equal(result, 4);
  const projection = await repo.admission(child);
  assert.deepEqual(Object.keys(projection).sort(), ['policy', 'status', 'uid']);
});
test('self links, arbitrary guardians, wrong accounts and adult-as-child targets are denied', async () => {
  const child = await person(), guardian = await person(), wrong = await person();
  await assure(child, 'minor'); await assure(guardian, 'adult'); await assure(wrong, 'adult');
  await assert.rejects(repo.execute(child, command(child, 'link.request', 0)), denied);
  await assert.rejects(repo.execute('unknown_guardian', command(child, 'link.request', 0)), denied);
  await assert.rejects(repo.execute(wrong, command(guardian, 'link.request', 0)), denied);
  await repo.execute(guardian, command(child, 'link.request', 0));
  await assert.rejects(repo.execute(wrong, command(child, 'link.confirm', 1)), denied);
  await assert.rejects(repo.execute(wrong, command(child, 'link.revoke', 1)), denied);
});
test('database clock rejects expired, unbounded and malformed assurance without writes', async () => {
  const uid = await person();
  for (const expiresAt of ['not-a-date', new Date(Date.now() - 1000).toISOString(), expiry(91)])
    await assert.rejects(repo.execute(reviewer, command(uid, 'age.assure', 0, { classification: 'adult', evidenceRef: proof(), expiresAt })), e => e.code === 'invalid_command');
  for (const classification of ['parent', '13+', { toString: () => 'adult' }])
    await assert.rejects(repo.execute(reviewer, command(uid, 'age.assure', 0, { classification, evidenceRef: proof(), expiresAt: expiry() })), e => e.code === 'invalid_command');
  assert.equal(await f.db.commandResult.count({ where: { uid } }), 0);
});
test('expired assurance/link, reviewer removal and revoked guardian proof deny current admission', async () => {
  const x = await family(true);
  const noReviewer = new AdmissionRepository(f.runtime, target, new Set([reviewer2]));
  assert.equal((await noReviewer.admission(x.child)).status, 'blocked');
  const z = await family();
  await repo.execute(reviewer2, command(z.child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() }));
  await repo.execute(z.guardian, command(z.child, 'link.confirm', 2));
  assert.equal((await new AdmissionRepository(f.runtime, target, new Set([reviewer])).admission(z.child)).status, 'pending_guardian');
  await repo.execute(reviewer, command(x.guardian, 'age.revoke', 1));
  assert.equal((await repo.admission(x.child)).status, 'pending_guardian');
  await assure(x.guardian, 'adult', 2);
  assert.equal((await repo.admission(x.child)).status, 'pending_guardian'); // Renewed evidence never revives old consent.
  const y = await family(true);
  await f.db.guardianAdmissionLink.update({ where: { minorUid: y.child }, data: { expiresAt: new Date(Date.now() - 1000), confirmedAt: new Date(Date.now() - 2000) } });
  assert.equal((await repo.admission(y.child)).status, 'pending_guardian');
  const adult = await person(); await assure(adult, 'adult');
  await f.db.admissionAssurance.update({ where: { uid: adult }, data: { issuedAt: new Date(Date.now() - 3000), expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await repo.admission(adult)).status, 'blocked');
});
test('proof tombstones for child or guardian cannot be bypassed with retained admission records', async () => {
  for (const whom of ['child', 'guardian']) {
    const x = await family(true);
    await f.db.deletionTombstone.create({ data: { uid: x[whom], resourceType: 'person', resourceId: x[whom] } });
    await assert.rejects(repo.withAdmission(x.child, async () => assert.fail('erased callback')), denied);
  }
});
test('duplicate command replay is single commit; changed payload/account and stale revisions fail', async () => {
  const uid = await person(), c = command(uid, 'age.assure', 0, { classification: 'adult', evidenceRef: proof(), expiresAt: expiry() });
  const results = await Promise.all([repo.execute(reviewer, c), otherRepo.execute(reviewer, c)]);
  assert.equal(results.filter(x => x.replayed).length, 1);
  await assert.rejects(repo.execute(reviewer2, c), e => e.code === 'conflict');
  await assert.rejects(repo.execute(reviewer, { ...c, payload: { ...c.payload, classification: 'minor' } }), e => e.code === 'conflict');
  await assert.rejects(repo.execute(reviewer, command(uid, 'age.revoke', 0)), e => e.code === 'stale_revision');
  assert.equal(await f.db.commandResult.count({ where: { uid } }), 1);
  assert.equal(await f.db.auditEvent.count({ where: { uid } }), 1);
  assert.equal(await f.db.outboxEvent.count({ where: { uid } }), 1);
});
test('competing guardian requests and stale confirmations commit one canonical version', async () => {
  const child = await person(), a = await person(), b = await person();
  await assure(child, 'minor'); await assure(a, 'adult'); await assure(b, 'adult');
  const race = await Promise.allSettled([repo.execute(a, command(child, 'link.request', 0)), otherRepo.execute(b, command(child, 'link.request', 0))]);
  assert.equal(race.filter(x => x.status === 'fulfilled').length, 1);
  const link = await f.db.guardianAdmissionLink.findUnique({ where: { minorUid: child } });
  assert.equal(link.revision, 1);
  await repo.execute(reviewer, command(child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() }));
  await assert.rejects(repo.execute(link.guardianUid, command(child, 'link.confirm', 1)), e => e.code === 'stale_revision');
  await repo.execute(link.guardianUid, command(child, 'link.revoke', 2));
  await assert.rejects(repo.execute(link.guardianUid, command(child, 'link.confirm', 3)), denied);
  assert.equal((await repo.admission(child)).status, 'pending_guardian');
});
test('revocation cannot be undone by stale replay and replacement consent requires new review', async () => {
  const x = await family(true), c = command(x.child, 'link.revoke', 3);
  await repo.execute(x.guardian, c);
  assert.equal((await repo.admission(x.child)).status, 'pending_guardian');
  assert.equal((await repo.execute(x.guardian, c)).replayed, true);
  await repo.execute(x.guardian, command(x.child, 'link.request', 4));
  await assert.rejects(repo.execute(x.guardian, c), e => e.code === 'stale_revision');
  await assert.rejects(repo.execute(x.guardian, command(x.child, 'link.confirm', 5)), denied);
});
test('owning-domain write failure rolls back admission state, receipt, audit and outbox together', async () => {
  const uid = await person(), c = command(uid, 'age.assure', 0, { classification: 'adult', evidenceRef: proof(), expiresAt: expiry() });
  await f.admin.$executeRawUnsafe('REVOKE INSERT ON "' + f.schema + '"."outbox_events" FROM "' + f.runtimeRole + '"');
  try { await assert.rejects(repo.execute(reviewer, c), e => e.code === 'unavailable' && e.message === 'unavailable'); }
  finally { await f.admin.$executeRawUnsafe('GRANT INSERT ON "' + f.schema + '"."outbox_events" TO "' + f.runtimeRole + '"'); }
  for (const model of ['admissionAssurance', 'auditEvent', 'commandResult']) assert.equal(await f.db[model].count({ where: { uid } }), 0);
  await repo.execute(reviewer, c); assert.equal((await repo.admission(uid)).status, 'admitted');
});
test('DML target drift, migration identity and table outage fail closed; restore recovers', async () => {
  const uid = await person(); await assure(uid, 'adult');
  const wrong = new AdmissionRepository(f.runtime, { ...target, database: 'wrong' }, new Set([reviewer]));
  await assert.rejects(wrong.admission(uid), e => e.code === 'unavailable');
  const privileged = new AdmissionRepository(f.db, { ...target, role: f.migrationRole }, new Set([reviewer]));
  await assert.rejects(privileged.admission(uid), e => e.code === 'unavailable');
  await f.admin.$executeRawUnsafe('REVOKE SELECT ON "' + f.schema + '"."admission_assurances" FROM "' + f.runtimeRole + '"');
  try { await assert.rejects(repo.admission(uid), e => e.code === 'unavailable'); }
  finally { await f.admin.$executeRawUnsafe('GRANT SELECT ON "' + f.schema + '"."admission_assurances" TO "' + f.runtimeRole + '"'); }
  assert.equal((await otherRepo.admission(uid)).status, 'admitted');
});
test('reopening the actual pool retains current consent and revocation', async () => {
  const x = await family(true); await second.$disconnect(); await second.$connect();
  assert.equal((await otherRepo.admission(x.child)).status, 'admitted');
  await repo.execute(x.guardian, command(x.child, 'link.revoke', 3));
  await second.$disconnect(); await second.$connect();
  assert.equal((await otherRepo.admission(x.child)).status, 'pending_guardian');
});

test('relationship approval cannot outlive assurance, and confirmation replay rechecks current guardian proof', async () => {
  const x = await family();
  await assert.rejects(repo.execute(reviewer, command(x.child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry(4) })), e => e.code === 'invalid_command');
  await repo.execute(reviewer, command(x.child, 'link.review', 1, { evidenceRef: proof(), expiresAt: expiry() }));
  const confirm = command(x.child, 'link.confirm', 2); await repo.execute(x.guardian, confirm);
  await repo.execute(reviewer, command(x.guardian, 'age.revoke', 1));
  await assert.rejects(repo.execute(x.guardian, confirm), denied);
});

test('superseded assurance retains historical minimal review metadata without disclosing it in receipt', async () => {
  const uid = await person(), c = command(uid, 'age.assure', 0, { classification: 'adult', evidenceRef: proof(), expiresAt: expiry() });
  assert.deepEqual(Object.keys(await repo.execute(reviewer, c)).sort(), ['replayed', 'revision']);
  const reorder = { payload: { expiresAt: c.payload.expiresAt, evidenceRef: c.payload.evidenceRef, classification: 'adult' },
    operation: c.operation, subjectUid: uid, expectedRevision: 0, commandId: c.commandId };
  assert.equal((await repo.execute(reviewer, reorder)).replayed, true);
  await assure(uid, 'minor', 1);
  const original = await f.db.commandResult.findUnique({ where: { commandId: c.commandId } });
  assert.equal(original.resultJson.review.classification, 'adult');
  assert.equal(original.resultJson.review.evidenceRef, c.payload.evidenceRef);
  assert.equal((await repo.admission(uid)).status, 'pending_guardian');
});

test('admission migration extends empty accepted chain and never rewrites historical receipts', async () => {
  const isolated = await stagingDatabase();
  try {
    const registry = canonicalMigrations(backend), store = isolated.store();
    assert.deepEqual(registry.map(x => x.version), [1, 2, 3, 4, 5, 6]);
    await new MigrationRunner(store, registry.slice(0, 5)).applyAll();
    const original = await isolated.db.$queryRawUnsafe('SELECT * FROM "_visionary_migrations" ORDER BY version');
    const result = await new MigrationRunner(store, registry).applyAll();
    assert.equal(result.applied, 1); assert.equal(result.skipped, 5);
    assert.deepEqual(await isolated.db.$queryRawUnsafe('SELECT * FROM "_visionary_migrations" WHERE version<6 ORDER BY version'), original);
    assert.equal(await isolated.db.admissionAssurance.count(), 0);
    assert.equal(await isolated.db.guardianAdmissionLink.count(), 0);
  } finally { await isolated.close(); }
});

test('revocation wins the actual SQL lock race and denied domain callback leaves no write', async () => {
  const x = await family(true); let enter, release, timer;
  const entered = new Promise(ok => enter = ok), gate = new Promise(ok => release = ok);
  const client = new Proxy(f.runtime, { get(object, key) {
    if (key === '$transaction') return (fn, options) => object.$transaction(tx => fn(new Proxy(tx, { get(t, name) {
      if (name === '$queryRawUnsafe') return async (sql, ...args) => {
        const rows = await t.$queryRawUnsafe(sql, ...args);
        if (sql.includes('ORDER BY uid FOR UPDATE')) { enter(); await gate; } return rows;
      };
      const value = t[name]; return typeof value === 'function' ? value.bind(t) : value;
    } })), options);
    const value = object[key]; return typeof value === 'function' ? value.bind(object) : value;
  } });
  const revoker = new AdmissionRepository(client, target, new Set([reviewer]));
  const revocation = revoker.execute(x.guardian, command(x.child, 'link.revoke', 3)); void revocation.catch(() => {});
  let outcome;
  try {
    await Promise.race([entered, new Promise((_, fail) => timer = setTimeout(() => fail(Error('Revocation lock deadline')), 2000))]);
    clearTimeout(timer);
    outcome = otherRepo.withAdmission(x.child, tx => tx.auditEvent.create({ data: { uid: x.child,
      operation: 'must-not-commit', actorType: 'user', resourceType: 'test', outcome: 'SUCCESS' } })).catch(e => e);
    const deadline = Date.now() + 2000; let observed = false;
    while (Date.now() < deadline) {
      const [row] = await f.admin.$queryRawUnsafe("SELECT count(*)::int AS n FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock'", f.runtimeRole);
      if (row.n) { observed = true; break; } await new Promise(ok => setTimeout(ok, 10));
    }
    assert.equal(observed, true, 'Actual database lock waiter required');
  } finally { clearTimeout(timer); release(); await revocation; }
  assert.equal((await outcome).code, 'unauthorized');
  assert.equal(await f.db.auditEvent.count({ where: { uid: x.child, operation: 'must-not-commit' } }), 0);
});

test('native constraints reject unsupported classification, self guardian and missing relationship review', async () => {
  const x = await family();
  await assert.rejects(f.db.admissionAssurance.update({ where: { uid: x.child }, data: { classification: 'parent' } }));
  await assert.rejects(f.db.guardianAdmissionLink.update({ where: { minorUid: x.child }, data: { guardianUid: x.child } }));
  await assert.rejects(f.db.guardianAdmissionLink.update({ where: { minorUid: x.child }, data: { state: 'linked', confirmedAt: new Date() } }));
  assert.equal((await repo.admission(x.child)).status, 'pending_guardian');
});
