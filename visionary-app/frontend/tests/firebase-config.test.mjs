import test from 'node:test';
import assert from 'node:assert/strict';
import { firebaseConfigFromEnvironment } from '../src/api/firebase/config.js';

const environment = {
  VITE_FIREBASE_API_KEY: 'synthetic-web-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-visionary-local.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-visionary-local',
  VITE_FIREBASE_APP_ID: 'synthetic-app-id',
};

test('missing required settings report names without exposing configuration values', () => {
  assert.throws(() => firebaseConfigFromEnvironment({ ...environment, VITE_FIREBASE_APP_ID: '' }), error => {
    assert.equal(error.name, 'FirebaseConfigurationError');
    assert.match(error.message, /VITE_FIREBASE_APP_ID/);
    assert.ok(!error.message.includes('synthetic-web-key'));
    return true;
  });
});
test('only approved public app configuration fields reach Firebase', () => {
  const config = firebaseConfigFromEnvironment({ ...environment, GOOGLE_APPLICATION_CREDENTIALS: 'private-file.json', VITE_FIREBASE_MEASUREMENT_ID: 'unused-analytics' });
  assert.deepEqual(config, { apiKey: 'synthetic-web-key', authDomain: 'demo-visionary-local.firebaseapp.com', projectId: 'demo-visionary-local', appId: 'synthetic-app-id' });
  assert.ok(Object.isFrozen(config));
});
test('malformed project IDs and auth domain URLs are rejected before SDK initialization', () => {
  assert.throws(() => firebaseConfigFromEnvironment({ ...environment, VITE_FIREBASE_PROJECT_ID: 'wrong/project' }), /project ID/);
  assert.throws(() => firebaseConfigFromEnvironment({ ...environment, VITE_FIREBASE_AUTH_DOMAIN: 'https://example.com/path' }), /hostname/);
});
