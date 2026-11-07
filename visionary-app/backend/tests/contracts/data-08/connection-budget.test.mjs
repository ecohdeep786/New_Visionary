import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../upstream/backend/package.json', import.meta.url));
const { connectionBudget, verifyPostgresConnectionBudget } = require('./dist/src/concurrency/connection-budget.js');
const plan = () => ({ databaseConnections: 100, reservedConnections: 20, workloads: [
  { role: 'product_runtime', maxInstances: 2, revisionOverlap: 2, poolsPerInstance: [3, 3, 3, 3], roleConnectionLimit: 48 },
] });
test('capacity includes all four product pools, instances and overlapping revisions plus reserve', () => {
  assert.deepEqual(connectionBudget(plan()), { plannedConnections: 48, cappedConnections: 48, reservedConnections: 20, databaseConnections: 100 });
  const p = plan(); p.workloads.push({ role: 'worker_runtime', maxInstances: 2, revisionOverlap: 1, poolsPerInstance: [4], roleConnectionLimit: 8 });
  assert.equal(connectionBudget(p).cappedConnections, 56);
});
for (const [name, change] of [
  ['fleet demand exceeds role cap', p => p.workloads[0].maxInstances = 3],
  ['server reserve exhausted', p => p.reservedConnections = 60],
  ['duplicate role would double-count its cap', p => p.workloads.push({ ...p.workloads[0] })],
  ['unlimited role', p => p.workloads[0].roleConnectionLimit = -1],
  ['unknown pool count', p => p.workloads[0].poolsPerInstance = []],
  ['unknown plan field', p => p.extra = true], ['string count', p => p.workloads[0].maxInstances = '2'],
  ['infinite count', p => p.workloads[0].revisionOverlap = Infinity],
  ['unsafe multiplication', p => p.workloads[0].maxInstances = Number.MAX_SAFE_INTEGER],
  ['zero reserve', p => p.reservedConnections = 0], ['unknown role field', p => p.workloads[0].extra = true],
]) test(`capacity rejects ${name}`, () => { const p = plan(); change(p); assert.throws(() => connectionBudget(p), /INVALID_CONNECTION_BUDGET/); });

test('capacity preflight rejects a plan changed while database observations are in flight', async () => {
  const p = plan();
  const db = { async $transaction(fn) { return fn(db); }, async $queryRawUnsafe(sql) {
    if (sql.includes('set_config')) return [];
    if (sql.includes('max_connections')) { p.reservedConnections = 90; return [{ maximum: 100, reserved: 3 }]; }
    return [{ connection_limit: 48, can_login: true, privileged: false }];
  } };
  await assert.rejects(verifyPostgresConnectionBudget(db, p), /CONNECTION_BUDGET_CHANGED/);
});

test('capacity preflight bounds transactions and redacts transport errors', async () => {
  let options;
  const db = { async $transaction(_fn, value) { options = value; throw Error('private connection URL'); } };
  await assert.rejects(verifyPostgresConnectionBudget(db, plan()), e => e.message === 'DATABASE_CAPACITY_UNAVAILABLE');
  assert.deepEqual(options, { isolationLevel: 'RepeatableRead', maxWait: 2000, timeout: 5000 });
});
