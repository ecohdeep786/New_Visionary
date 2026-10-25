// Independent review evidence; requires the candidate's focused compiled dist.
// Usage: node this-file.cjs <backend-source-root>. No database/network access.
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2], 'dist/src/data');
const { MigrationRunner } = require(path.join(root, 'migration-runner.js'));
const { InMemoryMigrationStore } = require(path.join(root, 'migration-store.js'));
const { MIGRATIONS, migrationChecksum } = require(path.join(root, 'migration-registry.js'));
const { BackfillRunner, InMemoryCheckpointStore } = require(path.join(root, 'backfill-runner.js'));
let failures = 0;
async function check(name, body) {
  try { await body(); console.log('PASS:', name); }
  catch (error) { failures++; console.log('FAIL:', name, '-', error.message); }
}
(async () => {
  await check('control: applied version is skipped on ordinary retry', async () => {
    const runner = new MigrationRunner(new InMemoryMigrationStore(), MIGRATIONS);
    await runner.applyAll({ appliedBy: 'migration-review' });
    assert.equal((await runner.applyAll({ appliedBy: 'migration-review' })).applied, 0);
  });
  await check('runner must refuse runtime identity before statements', async () => {
    const store = new InMemoryMigrationStore();
    const runner = new MigrationRunner(store, MIGRATIONS);
    await assert.rejects(runner.applyAll({ appliedBy: 'app-runtime' }), /IDENTITY/);
    assert.equal(store.executed.length, 0);
  });
  await check('outage must not repeat a completed non-idempotent step', async () => {
    const store = new InMemoryMigrationStore();
    const statements = ['INSERT INTO synthetic_effect VALUES (1);', 'SELECT simulated_failure;'];
    const migration = { version: 1, name: 'outage-probe', statements,
      checksum: migrationChecksum(statements), requires: [], reversible: false };
    store.failOn = 'simulated_failure';
    const runner = new MigrationRunner(store, [migration]);
    await assert.rejects(runner.applyAll({ appliedBy: 'migration-review' }));
    await runner.applyAll({ appliedBy: 'migration-review' });
    assert.equal(store.executed.filter((sql) => sql.startsWith('INSERT')).length, 1,
      'completed INSERT was executed twice');
  });
  await check('verify must detect changed SQL with a stale stored checksum', async () => {
    const store = new InMemoryMigrationStore();
    await new MigrationRunner(store, MIGRATIONS).applyAll({ appliedBy: 'migration-review' });
    const changed = MIGRATIONS.map((m, i) => i ? m : { ...m,
      statements: [...m.statements, 'ALTER TABLE persons ADD COLUMN unexpected TEXT;'] });
    assert.equal((await new MigrationRunner(store, changed).verify()).consistent, false);
  });
  await check('rollback must refuse unreviewed changed down statements', async () => {
    const store = new InMemoryMigrationStore();
    await new MigrationRunner(store, MIGRATIONS).applyAll({ appliedBy: 'migration-review' });
    const changed = MIGRATIONS.map((m) => m.version === 2 ? { ...m, down: ['DROP TABLE persons;'] } : m);
    await assert.rejects(new MigrationRunner(store, changed).rollbackLast({ appliedBy: 'migration-review' }), /DRIFT|drift|checksum|integrity/i);
  });
  await check('backfill must reject oversized source pages before writes', async () => {
    let writes = 0;
    const runner = new BackfillRunner({ next: async () => ({ rows: [{ key: 'a' }, { key: 'b' }],
      nextCursor: '2', done: true }) }, new InMemoryCheckpointStore(), async () => { writes++; });
    await assert.rejects(runner.run({ name: 'oversize', appliedBy: 'migration-review', batchSize: 1 }), /BOUNDS|PAGE|LIMIT/i);
    assert.equal(writes, 0);
  });
  await check('backfill must refuse no-progress cursor before unbounded polling', async () => {
    let pages = 0;
    const runner = new BackfillRunner({ next: async () => {
      if (++pages === 3) throw Error('PROBE_STOP_AFTER_THREE_PAGES');
      return { rows: [], nextCursor: null, done: false };
    } }, new InMemoryCheckpointStore(), async () => {});
    await assert.rejects(runner.run({ name: 'stalled', appliedBy: 'migration-review', batchSize: 1 }), /NO_PROGRESS|CURSOR|STALLED/i);
  });
  console.log(JSON.stringify({ cases: 7, passed: 7 - failures, failed: failures }));
  process.exitCode = failures ? 1 : 0;
})();
