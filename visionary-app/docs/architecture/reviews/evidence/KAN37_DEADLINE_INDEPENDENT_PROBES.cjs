// Independent probes execute the review checkout's separately compiled source.
// The first three use explicit inert Prisma interfaces; the last two use only
// the guarded synthetic PostgreSQL fixture selected by DATA_TEST_DATABASE_URL.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const fixture = require(path.join(root, 'backend/tests/contracts/data-02/postgres-fixture.cjs'));
const { PostgresMigrationStore } = fixture.req('./dist/src/data/migration-store.js');
const { BackfillRunner } = fixture.req('./dist/src/data/backfill-runner.js');
const { MigrationRunner } = fixture.req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const definition = 'c'.repeat(64);

test('independent policy: current expired identity result cannot open the migration transaction', async () => {
  const store = Object.create(PostgresMigrationStore.prototype);
  let active = true, opened = 0;
  const failure = Error('REVIEW_EXPIRED_AFTER_IDENTITY');
  const bounds = { remainingMs: () => 200, assertActive() { if (!active) throw failure; } };
  store.runtimeIdentity = async () => { active = false; };
  store.migration = { async $transaction() { opened++; throw Error('MUST_NOT_OPEN'); } };
  await assert.rejects(store.transaction(async () => 1, 200, bounds), error => error === failure);
  assert.equal(opened, 0);
});

test('independent policy: current deadline is checked again after a raw SQL result resolves', async () => {
  const store = Object.create(PostgresMigrationStore.prototype);
  let active = true, executed = 0;
  const failure = Error('REVIEW_EXPIRED_DURING_SQL');
  const bounds = { remainingMs: () => 200, assertActive() { if (!active) throw failure; } };
  const guarded = store.guardTransaction({ async $queryRawUnsafe() { executed++; active = false; return [{ safe: true }]; } }, bounds);
  await assert.rejects(guarded.$queryRawUnsafe('SELECT synthetic'), error => error === failure);
  assert.equal(executed, 1);
});

test('independent policy: post-admission deadline is explicitly uncertain instead of claiming rollback', async () => {
  let admitted = false;
  const store = { async transaction(work, timeout, bounds) {
    assert.ok(timeout <= 200);
    bounds.beforeCommit(); admitted = true;
    return new Promise(() => {});
  } };
  await assert.rejects(new BackfillRunner(store, { next() { throw Error('MUST_NOT_ENTER'); } }, async () => {})
    .run({ name: 'review_commit_unknown', definition, maxDurationMs: 200 }), /BACKFILL_DEADLINE_COMMIT_UNKNOWN/);
  assert.equal(admitted, true);
});

async function isolated(work) {
  const f = await fixture.stagingDatabase();
  try {
    await new MigrationRunner(f.store(), canonicalMigrations(fixture.backend)).applyAll();
    await f.db.$executeRawUnsafe('CREATE TABLE review_deadline_target(key TEXT PRIMARY KEY)');
    f.write = (tx, row) => tx.$executeRawUnsafe('INSERT INTO review_deadline_target(key) VALUES($1)', row.key);
    f.rows = () => f.db.$queryRawUnsafe('SELECT * FROM review_deadline_target ORDER BY key');
    await work(f);
  } finally { await f.close(); }
}
const one = { async next() { return { rows: [{ key: 'review-row' }], nextCursor: null, done: true }; } };

test('independent actual SQL: unrelated division error retains SQL identity and rolls back prior row before cold retry', () => isolated(async f => {
  let observed;
  try {
    await new BackfillRunner(f.store(), one, async (tx, row) => {
      await f.write(tx, row);
      await tx.$queryRawUnsafe('SELECT 1 / 0');
    }).run({ name: 'review_division', definition, maxDurationMs: 5000 });
  } catch (error) { observed = error; }
  assert.equal(observed?.code, 'P2010');
  assert.equal(observed?.meta?.code, '22012');
  assert.equal(/BACKFILL_DEADLINE/.test(String(observed)), false);
  assert.equal((await f.rows()).length, 0);
  const recovered = await new BackfillRunner(f.store(), one, f.write).run({ name: 'review_division', definition });
  assert.equal(recovered.done, true); assert.equal(recovered.processed, 1);
  assert.equal((await f.rows()).length, 1);
}));

test('independent actual SQL: explicit user query cancellation remains 57014 user-request and cold retry commits once', () => isolated(async f => {
  let release, sourceReady = new Promise(resolve => { release = resolve; });
  let pid, observed;
  const run = new BackfillRunner(f.store(), one, async (tx, row) => {
    await f.write(tx, row);
    pid = (await tx.$queryRawUnsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
    release();
    await tx.$executeRawUnsafe('SELECT pg_sleep(3)');
  }).run({ name: 'review_user_cancel', definition, maxDurationMs: 10000 });
  const caught = run.catch(error => { observed = error; });
  const timer = setTimeout(() => release(), 8000);
  try {
    await sourceReady;
    assert.ok(Number.isInteger(pid), 'Actual writer reached its PostgreSQL connection');
    // Wait until the actual selected backend is executing the selected sleep,
    // not merely between publishing its PID and starting the statement.
    const until = Date.now() + 2000;
    let sleeping = false;
    while (Date.now() < until) {
      const state = await f.admin.$queryRawUnsafe('SELECT query,state FROM pg_stat_activity WHERE pid=$1', pid);
      if (state[0]?.state === 'active' && state[0]?.query.includes('pg_sleep')) { sleeping = true; break; }
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.equal(sleeping, true);
    const result = await f.admin.$queryRawUnsafe('SELECT pg_cancel_backend($1::integer) AS cancelled', pid);
    assert.equal(result[0].cancelled, true);
    await caught;
    assert.equal(observed?.code, 'P2010'); assert.equal(observed?.meta?.code, '57014');
    assert.match(observed.meta.message, /canceling statement due to user request/);
    assert.equal(/BACKFILL_DEADLINE/.test(String(observed)), false);
    assert.equal((await f.rows()).length, 0);
    const recovered = await new BackfillRunner(f.store(), one, f.write).run({ name: 'review_user_cancel', definition });
    assert.equal(recovered.done, true); assert.equal(recovered.processed, 1);
    assert.equal((await f.rows()).length, 1);
  } finally { clearTimeout(timer); await caught; }
}));
