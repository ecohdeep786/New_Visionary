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
