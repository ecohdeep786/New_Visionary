const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const backend = path.resolve(__dirname, '../upstream/backend');
const backendRequire = createRequire(path.join(backend, 'package.json'));
const { ConfigService } = backendRequire('@nestjs/config');
const { FirebaseAdminService, firebaseAdminSettings } = require(path.join(backend, 'dist/src/auth/firebase/firebase-admin.service.js'));
const base = { FIREBASE_PROJECT_ID: 'demo-visionary-local', FIREBASE_PROJECT_KIND: 'staging', NODE_ENV: 'test', GOOGLE_APPLICATION_CREDENTIALS: '' };
function config(values = {}) { return new ConfigService({ ...base, ...values }); }
function withEmulatorHost(host, callback) {
  const previous = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (host) process.env.FIREBASE_AUTH_EMULATOR_HOST = host;
  else delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  try { return callback(); }
  finally {
    if (previous === undefined) delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    else process.env.FIREBASE_AUTH_EMULATOR_HOST = previous;
  }
}
test('production and staging identities reject injected emulator configuration', () => {
  withEmulatorHost('127.0.0.1:9099', () => {
    assert.throws(() => firebaseAdminSettings(config()), /cannot be used with a live project/);
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_KIND: 'emulator', NODE_ENV: 'production' })), /production runtime/);
  });
});
test('staging Firebase refuses the production realm before initializing Admin', () => {
  withEmulatorHost(null, () => {
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_ID: 'visionary-research' })), /separate from production/);
    assert.equal(firebaseAdminSettings(config({ FIREBASE_PROJECT_ID: 'visionary-uat' })).projectId, 'visionary-uat');
    assert.equal(firebaseAdminSettings(config({ FIREBASE_PROJECT_ID: 'visionary-research', FIREBASE_PROJECT_KIND: 'production' })).kind, 'production');
  });
});
test('emulator setup cannot fall back to live APIs or load production keys', () => {
  withEmulatorHost(null, () => {
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_KIND: 'emulator' })), /live fallback/);
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_KIND: 'emulator', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' })), /process environment/);
  });
  withEmulatorHost('127.0.0.1:9099', () => {
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_KIND: 'emulator', GOOGLE_APPLICATION_CREDENTIALS: path.resolve('private.json') })), /must not load a production credential/);
  });
});
test('project and credential-path mistakes fail before authentication', () => {
  withEmulatorHost(null, () => {
    assert.throws(() => firebaseAdminSettings(config({ FIREBASE_PROJECT_ID: '' })), /FIREBASE_PROJECT_ID/);
    assert.throws(() => firebaseAdminSettings(config({ GOOGLE_APPLICATION_CREDENTIALS: 'path/to/serviceAccountKey.json' })), /absolute local file path/);
  });
});
test('constructing the injectable service does not read credential material', () => {
  const service = new FirebaseAdminService(config({ GOOGLE_APPLICATION_CREDENTIALS: path.resolve('missing-credential.json') }));
  assert.ok(service);
});
test('wrong-project credential JSON is rejected with a redacted error', () => {
  withEmulatorHost(null, () => {
    const filename = path.join(__dirname, 'fixtures', 'wrong-project.json');
    const service = new FirebaseAdminService(config({ GOOGLE_APPLICATION_CREDENTIALS: filename }));
    assert.throws(() => service.getAuth(), error => {
      assert.equal(error.name, 'FirebaseAdminConfigurationError');
      assert.match(error.message, /does not match/);
      assert.ok(!error.message.includes('synthetic-private-material'));
      assert.ok(!error.message.includes(filename));
      return true;
    });
  });
});
test('one provider cannot silently reuse another provider credential context', async () => {
  let owner;
  withEmulatorHost('127.0.0.1:9099', () => {
    const emulatorConfig = config({ FIREBASE_PROJECT_KIND: 'emulator' });
    owner = new FirebaseAdminService(emulatorConfig);
    assert.equal(typeof owner.getAuth().verifyIdToken, 'function');
    const other = new FirebaseAdminService(emulatorConfig);
    assert.throws(() => other.getAuth(), /outside this provider/);
  });
  await owner.onModuleDestroy();
});

test('emulator Firestore initializes without discovering host credentials', { timeout: 10000 }, async () => {
  const firestoreRequire = createRequire(backendRequire.resolve('@google-cloud/firestore'));
  const gaxRequire = createRequire(firestoreRequire.resolve('google-gax'));
  const { GoogleAuth } = gaxRequire('google-auth-library');
  const { getFirestore } = backendRequire('firebase-admin/firestore');
  const discovery = { environment: 0, wellKnown: 0, metadata: 0 };
  const methods = {
    _tryGetApplicationCredentialsFromEnvironmentVariable: 'environment',
    _tryGetApplicationCredentialsFromWellKnownFile: 'wellKnown',
    _checkIsGCE: 'metadata',
  };
  const originals = new Map(Object.keys(methods).map(name => [name, GoogleAuth.prototype[name]]));
  const environment = {
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:59099',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:59080',
    GOOGLE_APPLICATION_CREDENTIALS: '',
  };
  const previous = new Map(Object.keys(environment).map(name => [name, process.env[name]]));
  const service = new FirebaseAdminService(config({ FIREBASE_PROJECT_KIND: 'emulator' }));
  let db;
  try {
    Object.assign(process.env, environment);
    for (const [name, counter] of Object.entries(methods)) {
      // Stop discovery before it reads a file or probes metadata.
      GoogleAuth.prototype[name] = async () => { discovery[counter]++; return counter === 'metadata' ? false : null; };
    }
    db = getFirestore(service.getAuth().app);
    let failure;
    try {
      // Initialize the real SDK stub without issuing a document or network RPC.
      await db._clientPool.run('emulator-credential-regression', false, client => client.initialize());
    } catch (error) { failure = error; }
    assert.deepEqual(discovery, { environment: 0, wellKnown: 0, metadata: 0 });
    if (failure) throw failure;
    assert.equal(db._settings.servicePath, '127.0.0.1');
    assert.equal(db._settings.ssl, false);
  } finally {
    if (db) await db.terminate();
    await service.onModuleDestroy();
    for (const [name, original] of originals) GoogleAuth.prototype[name] = original;
    for (const [name, original] of previous) {
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    }
  }
});
