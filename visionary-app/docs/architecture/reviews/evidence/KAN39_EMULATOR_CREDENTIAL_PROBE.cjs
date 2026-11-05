// Independent SDK-boundary probe. No emulator server, host credential, or cloud RPC.
// Usage: node <this-file> <exact-git-sha> [--ephemeral-cert]
// Default gate requires zero ambient credential-discovery attempts.
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRequire, Module } = require('node:module');
const { generateKeyPairSync } = require('node:crypto');

const source = process.argv[2];
assert.match(source || '', /^[a-f0-9]{40}$/);
const appRoot = path.resolve(__dirname, '../../../..');
const backend = path.join(appRoot, 'backend/upstream/backend');
const req = createRequire(path.join(backend, 'package.json'));
const firestoreReq = createRequire(req.resolve('@google-cloud/firestore'));
const gaxReq = createRequire(firestoreReq.resolve('google-gax'));
const { GoogleAuth } = gaxReq('google-auth-library');
const counts = { environment: 0, wellKnown: 0, metadata: 0 };
// Replace discovery before initialization. These counters prevent all actual
// credential reads and metadata probes rather than observing real credentials.
GoogleAuth.prototype._tryGetApplicationCredentialsFromEnvironmentVariable = async () => {
  counts.environment++; return null;
};
GoogleAuth.prototype._tryGetApplicationCredentialsFromWellKnownFile = async () => {
  counts.wellKnown++; return null;
};
GoogleAuth.prototype._checkIsGCE = async () => {
  counts.metadata++; return false;
};
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:59099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:59080';
process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
process.env.NODE_ENV = 'development';

const { cert, initializeApp, deleteApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
let service, app;
if (process.argv.includes('--ephemeral-cert')) {
  // SDK compatibility experiment only; does not alter or approve candidate code.
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  app = initializeApp({ projectId: 'demo-visionary-review', credential: cert({
    projectId: 'demo-visionary-review',
    clientEmail: 'emulator@demo-visionary-review.iam.gserviceaccount.com',
    privateKey,
  }) }, 'kan39-independent-credential-review');
} else {
  const input = execFileSync('git', ['-C', appRoot, 'show',
    `${source}:visionary-app/backend/upstream/backend/src/auth/firebase/firebase-admin.service.ts`], { encoding: 'utf8' });
  const ts = req('typescript');
  const filename = path.join(backend, 'src/auth/firebase/firebase-admin.service.ts');
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(ts.transpileModule(input, { compilerOptions: {
    target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true, emitDecoratorMetadata: true,
  } }).outputText, filename);
  const { ConfigService } = req('@nestjs/config');
  service = new loaded.exports.FirebaseAdminService(new ConfigService({
    FIREBASE_PROJECT_ID: 'demo-visionary-review', FIREBASE_PROJECT_KIND: 'emulator',
    NODE_ENV: 'development', GOOGLE_APPLICATION_CREDENTIALS: '',
  }));
  app = service.getAuth().app;
}
const db = getFirestore(app);
const timer = setTimeout(() => { console.error('SDK initialization timed out'); process.exit(2); }, 7000);
(async () => {
  try {
    // Initialize the real Google SDK stub with its normal emulator settings.
    // No document/RPC operation is invoked and no loopback listener is needed.
    await db._clientPool.run('independent-review', false, async client => { await client.initialize(); });
    console.log(JSON.stringify({ source, experiment: process.argv.includes('--ephemeral-cert'),
      counts, host: db._settings.servicePath, ssl: db._settings.ssl }));
    assert.deepEqual(counts, { environment: 0, wellKnown: 0, metadata: 0 },
      'Emulator SDK initialization must not discover ambient credentials');
  } finally {
    clearTimeout(timer);
    await db.terminate();
    if (service) await service.onModuleDestroy();
    else await deleteApp(app);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
