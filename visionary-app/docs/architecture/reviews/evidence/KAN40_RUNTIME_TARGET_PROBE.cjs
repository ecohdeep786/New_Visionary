// Exact-source configuration probe. Prisma is a recording sentinel: this
// program cannot connect to any database or provider. No candidate file changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRequire, Module } = require('node:module');
const source = 'c6928a2ba84fed214f24164876d3dae7c33dde40';
const root = path.resolve(__dirname, '../../../..');
const dependencyBackend = process.env.KAN40_REVIEW_BACKEND;
assert.ok(dependencyBackend && path.isAbsolute(dependencyBackend));
const req = createRequire(path.join(dependencyBackend, 'package.json'));
const ts = req('typescript');
const git = file => execFileSync('git', ['-C', root, 'show', `${source}:visionary-app/backend/upstream/backend/${file}`], { encoding: 'utf8' });
const lock = JSON.parse(git('package-lock.json'));
const installed = JSON.parse(fs.readFileSync(path.join(dependencyBackend, 'node_modules/.package-lock.json')));
let verified = 0, constructions = 0;
for (const [key, value] of Object.entries(lock.packages)) {
  if (!key || value.link || value.optional && ((value.os && !value.os.includes(process.platform)) || (value.cpu && !value.cpu.includes(process.arch)))) continue;
  assert.equal(installed.packages[key]?.version, value.version);
  if (value.integrity) assert.equal(installed.packages[key]?.integrity, value.integrity);
  assert.ok(fs.existsSync(path.join(dependencyBackend, key, 'package.json'))); verified++;
}
class NoNetworkPrisma {
  constructor() { constructions++; }
  async $connect() { throw Error('Provider I/O forbidden by independent probe'); }
  async $transaction() { throw Error('Provider I/O forbidden by independent probe'); }
  async $disconnect() {}
}
const cache = new Map();
function exact(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const filename = path.join(dependencyBackend, file), mod = new Module(filename);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename)); cache.set(file, mod);
  mod.require = id => id === '@prisma/client' ? { ...req(id), PrismaClient: NoNetworkPrisma }
    : id.startsWith('.') ? exact(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)) + '.ts') : req(id);
  mod._compile(ts.transpileModule(git(file), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, emitDecoratorMetadata: false,
  } }).outputText, filename);
  return mod.exports;
}
const { ConfigService } = req('@nestjs/config');
const { ProductConsentService } = exact('src/consent/product-consent.service.ts');
const { firebaseAdminSettings } = exact('src/auth/firebase/firebase-admin.service.ts');
const config = {
  DATA_CONSENT_ENABLED: 'true', AUTH_RATE_LIMIT_KEY: 'synthetic-review-key-that-is-not-a-live-credential',
  NODE_ENV: 'development', FIREBASE_PROJECT_KIND: 'emulator', FIREBASE_PROJECT_ID: 'demo-qa-review',
  FIRESTORE_DATABASE_ID: '(default)', DATA_WORKSPACE_DATABASE_MODE: 'cloud-sql', DATA_WORKSPACE_RUNTIME_ROLE: 'qa_runtime',
  DATA_WORKSPACE_SCHEMA: 'public', DATA_WORKSPACE_SQL_INSTANCE: 'qa-dev-sql', DATA_WORKSPACE_DATABASE_NAME: 'visionary_data_staging_review',
};
const sqlUrl = database => {
  const url = new URL(`postgresql://qa_runtime:synthetic-only@localhost/${database}`);
  for (const [key, value] of Object.entries({ host: '/cloudsql/visionary-research:asia-south1:qa-dev-sql', schema: 'public', connection_limit: '1', pool_timeout: '5', connect_timeout: '5' })) url.searchParams.set(key, value);
  return String(url);
};
const accounts = { rateLimit: async () => {} };
(async () => {
  const previousEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  try {
    const disabled = new ProductConsentService(accounts, new ConfigService({}));
    assert.equal((await disabled.list('synthetic_uid')).available, false); assert.equal(constructions, 0);
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    const emulatorConfig = new ConfigService({ ...config, DATA_WORKSPACE_RUNTIME_URL: sqlUrl(config.DATA_WORKSPACE_DATABASE_NAME) });
    assert.equal(firebaseAdminSettings(emulatorConfig).kind, 'emulator');
    const emulator = new ProductConsentService(accounts, emulatorConfig);
    assert.ok(emulator.store()); assert.equal(constructions, 1); await emulator.onModuleDestroy();
    console.log(JSON.stringify({ probe: 'valid-demo-emulator-to-real-staging-cloudsql', firebaseSettingsAccepted: true,
      consentSqlClientConstructed: true, providerConnectionAttempted: false, unsafeTargetAccepted: true }));
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const productionConfig = new ConfigService({ ...config, NODE_ENV: 'production', FIREBASE_PROJECT_KIND: 'production',
      FIREBASE_PROJECT_ID: 'other-live-review', DATA_WORKSPACE_DATABASE_NAME: 'visionary_data_production_review',
      DATA_WORKSPACE_RUNTIME_URL: sqlUrl('visionary_data_production_review') });
    assert.equal(firebaseAdminSettings(productionConfig).projectId, 'other-live-review');
    const production = new ProductConsentService(accounts, productionConfig);
    assert.ok(production.store()); assert.equal(constructions, 2); await production.onModuleDestroy();
    console.log(JSON.stringify({ probe: 'foreign-live-firebase-to-production-cloudsql', firebaseSettingsAccepted: true,
      consentSqlClientConstructed: true, providerConnectionAttempted: false, unsafeTargetAccepted: true }));
    console.log(JSON.stringify({ source, verifiedInstalledRecords: verified, defaultOffPassed: true,
      providerConnections: 0, decision: 'changes requested' }));
  } finally {
    if (previousEmulator === undefined) delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    else process.env.FIREBASE_AUTH_EMULATOR_HOST = previousEmulator;
  }
})().catch(error => { console.error(JSON.stringify({ failure: error.name, detail: error instanceof assert.AssertionError ? error.message : 'Unexpected setup/runtime failure; inspect privately' })); process.exitCode = 1; });
