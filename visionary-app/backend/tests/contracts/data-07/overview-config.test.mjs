import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../upstream/backend/package.json', import.meta.url));
const { ProductOverviewStore } = require('./dist/src/overview/product-overview.store.js');
const base = () => ({ DATA_OVERVIEW_ENABLED: 'true', NODE_ENV: 'development', FIREBASE_PROJECT_ID: 'visionary-research',
  FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default', DATA_WORKSPACE_DATABASE_MODE: 'synthetic',
  DATA_WORKSPACE_ENVIRONMENT_ID: 'isolated-overview-check', DATA_WORKSPACE_SCHEMA: 'synthetic_overview', DATA_WORKSPACE_RUNTIME_ROLE: 'overview_reader',
  DATA_WORKSPACE_RUNTIME_URL: 'postgresql://overview_reader:synthetic@127.0.0.1:55442/visionary_data_test_kan42?schema=synthetic_overview&connection_limit=3&pool_timeout=5&connect_timeout=5' });
for (const [label, change] of [
  ['disabled', { DATA_OVERVIEW_ENABLED: 'false' }], ['foreign project', { FIREBASE_PROJECT_ID: 'foreign-project' }],
  ['different Firestore database', { FIRESTORE_DATABASE_ID: '(default)' }], ['no environment', { NODE_ENV: '' }],
  ['no environment binding', { DATA_WORKSPACE_ENVIRONMENT_ID: '' }], ['wrong SQL role', { DATA_WORKSPACE_RUNTIME_ROLE: 'other' }],
  ['wrong schema', { DATA_WORKSPACE_SCHEMA: 'other' }], ['unbounded pool', { DATA_WORKSPACE_RUNTIME_URL: base().DATA_WORKSPACE_RUNTIME_URL.replace('connection_limit=3', 'connection_limit=30') }],
  ['production synthetic SQL', { NODE_ENV: 'production' }], ['production test switch', { NODE_ENV: 'production', DATA_OVERVIEW_TEST_ENABLED: 'true' }],
]) test(`product overview configuration denies ${label} before client creation`, async () => {
  const values = { ...base(), ...change }, store = new ProductOverviewStore({}, {}, { get: key => values[key] });
  assert.throws(() => store.store(), e => e.getStatus?.() === 503);
  assert.equal(store.client, undefined); await store.onModuleDestroy();
});
test('valid binding is lazy; configuration drift and disabling cannot reuse the cached SQL client', async () => {
  const values = base(), store = new ProductOverviewStore({}, {}, { get: key => values[key] });
  const first = store.store(); assert.ok(first); assert.equal(store.store(), first);
  values.DATA_WORKSPACE_ENVIRONMENT_ID = 'changed';
  assert.throws(() => store.store(), e => e.getStatus?.() === 503);
  values.DATA_WORKSPACE_ENVIRONMENT_ID = 'isolated-overview-check'; values.DATA_OVERVIEW_ENABLED = 'false';
  assert.throws(() => store.store(), e => e.getStatus?.() === 503);
  await store.onModuleDestroy();
});
