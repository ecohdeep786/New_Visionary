/**
 * DATA-02 — versioned migrations, identity separation, bounded resumable
 * backfills, compatibility checks and rollback.
 *
 * Tests exercise the machinery against the in-memory synthetic store (the same
 * fixture style the repo uses for Firestore). Positive, failure/deny and
 * recovery/rollback cases are covered. No live database is touched.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const {
  MIGRATIONS,
  migrationChecksum,
  orderedMigrations,
  byVersion,
  missingPrerequisites,
  hasDuplicateVersions,
} = req('./dist/src/data/migration-registry.js');
const { InMemoryMigrationStore } = req('./dist/src/data/migration-store.js');
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const {
  parseIdentity,
  assertSeparateIdentities,
  assertMigrationPurpose,
} = req('./dist/src/data/migration-identities.js');
const {
  BackfillRunner,
  InMemoryCheckpointStore,
  DEFAULT_BATCH,
  MAX_BATCH,
  MIN_BATCH,
} = req('./dist/src/data/backfill-runner.js');

test('DATA-02 registry: migrations are unique, ascending and checksummed', () => {
  assert.equal(hasDuplicateVersions(MIGRATIONS), false);
  const ordered = orderedMigrations();
  assert.ok(ordered.length >= 2);
  for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i].version > ordered[i - 1].version);
  for (const m of MIGRATIONS) {
    assert.equal(m.checksum, migrationChecksum(m.statements), m.name);
    assert.ok(m.statements.length > 0, m.name);
  }
});

test('DATA-02 applyAll: applies every pending migration in order with ledger receipts', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, MIGRATIONS);
  const result = await runner.applyAll({ appliedBy: 'migration-visionary' });
  assert.equal(result.applied, MIGRATIONS.length);
  assert.equal(result.receipts.length, MIGRATIONS.length);
  assert.equal(await store.schemaVersion(), Math.max(...MIGRATIONS.map((m) => m.version)));
  for (const table of ['persons', 'workspaces', 'workspace_memberships', 'command_results', 'outbox_events']) {
    assert.ok(store.tables.has(table), `table ${table} created`);
  }
  const verify = await runner.verify();
  assert.equal(verify.consistent, true);
});

test('DATA-02 applyAll is idempotent: re-running records zero new applies and stays consistent', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, MIGRATIONS);
  await runner.applyAll({ appliedBy: 'migration-visionary' });
  const second = await runner.applyAll({ appliedBy: 'migration-visionary' });
  assert.equal(second.applied, 0);
  assert.equal(second.skipped, MIGRATIONS.length);
  assert.equal(await store.schemaVersion(), Math.max(...MIGRATIONS.map((m) => m.version)));
});

test('DATA-02 deny: first apply refuses a non-empty domain without staged confirmation', async () => {
  const store = new InMemoryMigrationStore();
  store.tables.get('persons').push({ uid: 'existing-user' });
  const runner = new MigrationRunner(store, MIGRATIONS);
  await assert.rejects(
    runner.applyAll({ appliedBy: 'migration-visionary' }),
    (e) => e.message.includes('NON_EMPTY_REQUIRES_CONFIRMATION'),
  );
  assert.equal(await store.schemaVersion(), 0);
  // Explicit confirmation (reviewed empty synthetic staging decision) allows it
  const ok = await runner.applyAll({ appliedBy: 'migration-visionary', stagingConfirmed: true });
  assert.equal(ok.applied, MIGRATIONS.length);
});

test('DATA-02 deny: a changed past migration is detected as checksum drift', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, MIGRATIONS);
  await runner.applyAll({ appliedBy: 'migration-visionary' });
  // Operator edits the version-1 registry (simulated) → drift must be refused
  const drifted = [
    { ...MIGRATIONS[0], statements: [...MIGRATIONS[0].statements, 'ALTER TABLE persons ADD COLUMN drifted BOOLEAN;'] },
    ...MIGRATIONS.slice(1),
  ];
  const driftedCfg = drifted.map((m) => ({ ...m, checksum: migrationChecksum(m.statements) }));
  const driftedRunner = new MigrationRunner(store, driftedCfg);
  await assert.rejects(
    driftedRunner.applyAll({ appliedBy: 'migration-visionary' }),
    (e) => e.message.includes('checksum drift'),
  );
});

test('DATA-02 deny: missing prerequisite is refused before applying', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, [MIGRATIONS[1]]); // v2 requires v1, v1 missing
  await assert.rejects(
    runner.applyAll({ appliedBy: 'migration-visionary' }),
    (e) => e.message.includes('MIGRATION_PREFLIGHT_FAILED') && e.message.includes('missing prerequisite'),
  );
  assert.equal(missingPrerequisites(MIGRATIONS, 2).length, 0);
  assert.equal(missingPrerequisites(MIGRATIONS, 99).join(','), '99');
});

test('DATA-02 applyAll: a mid-run outage resumes and completes with no double-apply', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, MIGRATIONS);
  store.failOn = 'ADD COLUMN'; // fails inside version 2
  await assert.rejects(runner.applyAll({ appliedBy: 'migration-visionary' }));
  assert.equal(await store.schemaVersion(), 1, 'version 1 applied, version 2 interrupted');
  const resume = await runner.applyAll({ appliedBy: 'migration-visionary' });
  assert.equal(resume.applied, 1);
  assert.equal(await store.schemaVersion(), Math.max(...MIGRATIONS.map((m) => m.version)));
  assert.equal((await store.appliedReceipts()).filter((r) => r.status === 'applied').length, MIGRATIONS.length);
});

test('DATA-02 rollback: newest reversible migration rolls back; non-reversible or skipped is denied', async () => {
  const store = new InMemoryMigrationStore();
  const runner = new MigrationRunner(store, MIGRATIONS);
  await runner.applyAll({ appliedBy: 'migration-visionary' });
  const revoked = await runner.rollbackLast({ appliedBy: 'migration-visionary' });
  assert.equal(revoked.status, 'rolled_back');
  assert.equal(revoked.version, 2);
  assert.equal(await store.schemaVersion(), 1, 'version 2 undone, version 1 retained (no destructive step)');
  // The outcome is recorded in the append-only history ledger
  assert.equal(store.history.filter((r) => r.status === 'rolled_back').length, 1);
  // v1 is not reversible → refused
  await assert.rejects(
    runner.rollbackLast({ appliedBy: 'migration-visionary' }),
    (e) => e.message.includes('ROLLBACK_DENIED'),
  );
});

test('DATA-02 rollback: refuses destructive rollback over existing records without confirmation', async () => {
  const store = new InMemoryMigrationStore();
  const destructive = [
    MIGRATIONS[0],
    { ...MIGRATIONS[1], down: ['DROP TABLE workspaces;'], reversible: true },
  ];
  const runner = new MigrationRunner(store, destructive);
  await runner.applyAll({ appliedBy: 'migration-visionary', stagingConfirmed: true });
  store.tables.get('persons').push({ uid: 'existing-user' });
  await assert.rejects(
    runner.rollbackLast({ appliedBy: 'migration-visionary' }),
    (e) => e.message.includes('NON_EMPTY_REQUIRES_CONFIRMATION'),
  );
});

test('DATA-02 identity separation: migration and runtime must use separate connections and roles', () => {
  const good = { migrationUrl: 'postgres://migration-visionary@db', runtimeUrl: 'postgres://app-runtime@db', migrationRole: 'migration-visionary', runtimeRole: 'app-runtime', env: 'production' };
  assert.doesNotThrow(() => assertSeparateIdentities(good));
  assert.throws(() => assertSeparateIdentities({ ...good, migrationUrl: good.runtimeUrl }), /IDENTITY_CONFLICT/);
  assert.throws(() => assertSeparateIdentities({ ...good, migrationRole: good.runtimeRole }), /IDENTITY_CONFLICT/);
  assert.throws(() => assertSeparateIdentities({ ...good, migrationUrl: '' }), /MIGRATION_IDENTITY_MISSING/);
  assert.throws(() => assertSeparateIdentities({ ...good, migrationRole: 'app-runtime', runtimeRole: 'app-runtime' }), /IDENTITY_CONFLICT/);
  const migration = parseIdentity(good.migrationUrl, good.migrationRole, 'migration');
  assert.equal(migration.purpose, 'migration');
  assertMigrationPurpose(migration);
  assert.throws(() => assertMigrationPurpose(parseIdentity(good.runtimeUrl, good.runtimeRole, 'runtime')), /IDENTITY_DENIED/);
});

test('DATA-02 backfill: bounded batches, persisted cursor, idempotent resume after failure', async () => {
  const processed = new Set();
  const records = Array.from({ length: 1200 }, (_, i) => ({ key: `uid:row-${i}` }));
  // Cursor-driven source: pages strictly from the persisted cursor so a resumed
  // run re-reads from the last acknowledged offset (no lost or double rows).
  const source = {
    async next(cursor, limit) {
      const start = cursor === null ? 0 : Number(cursor);
      const page = records.slice(start, start + limit);
      const nextCursor = String(start + page.length);
      return { rows: page, nextCursor, done: start + page.length >= records.length };
    },
  };
  const checkpoints = new InMemoryCheckpointStore();
  let markCalls = 0;
  let failOnce = false;
  const runner = new BackfillRunner(source, checkpoints, async (row) => {
    markCalls += 1;
    if (!failOnce && markCalls > 500) { failOnce = true; throw new Error('SIMULATED_OUTAGE'); }
    processed.add(row.key);
  });

  await assert.rejects(runner.run({ name: 'provision-personal-workspaces', appliedBy: 'migration-visionary', batchSize: 500 }));
  const checkpoint = await checkpoints.read('provision-personal-workspaces');
  assert.equal(checkpoint.done, false, 'checkpoint persists progress after interruption');
  assert.ok(checkpoint.processed <= 500);

  // Resume from the checkpoint → completes and never double-applies
  const resumed = await runner.run({ name: 'provision-personal-workspaces', appliedBy: 'migration-visionary', batchSize: 500 });
  assert.equal(resumed.done, true);
  assert.equal(resumed.processed, records.length);
  assert.equal(processed.size, records.length, 'no duplicate processed keys');

  // Running an already-done backfill is a safe no-op (idempotent completion)
  const replay = await runner.run({ name: 'provision-personal-workspaces', appliedBy: 'migration-visionary', batchSize: 500 });
  assert.equal(replay.done, true);
  assert.equal(replay.processed, records.length);
});

test('DATA-02 backfill: batch-size bounds enforce predictable cost (budget guard)', async () => {
  const checkpoints = new InMemoryCheckpointStore();
  const runner = new BackfillRunner({ next: async () => ({ rows: [], nextCursor: null, done: true }) }, checkpoints, async () => {});
  assert.equal(DEFAULT_BATCH, 500);
  assert.equal(MIN_BATCH, 1);
  assert.ok(MAX_BATCH >= 500);
  await assert.rejects(
    runner.run({ name: 'x', appliedBy: 'migration-visionary', batchSize: 0 }),
    /BACKFILL_BOUNDS/,
  );
  await assert.rejects(
    runner.run({ name: 'x', appliedBy: 'migration-visionary', batchSize: MAX_BATCH + 1 }),
    /BACKFILL_BOUNDS/,
  );
});
