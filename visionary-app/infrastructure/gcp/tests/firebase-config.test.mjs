import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { production } from '../release.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const publicFields = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID'];

test('committed Firebase Web config is the exact public project configuration', () => {
  const config = JSON.parse(read('infrastructure/gcp/firebase-web-config.json'));
  assert.deepEqual(Object.keys(config).sort(), [...publicFields].sort());
  assert.equal(config.PROJECT_ID, production.project);
  assert.equal(config.AUTH_DOMAIN, production.authDomain);
  assert.equal(config.MESSAGING_SENDER_ID, production.projectNumber);
  for (const value of Object.values(config)) assert.match(value, /^[A-Za-z0-9_:.\-]+$/);
  assert.equal('PRIVATE_KEY' in config || 'CLIENT_EMAIL' in config, false);
});

test('Firebase CLI config targets the named default Firestore database and tracked rules', () => {
  const firebase = JSON.parse(read('firebase.json'));
  const rc = JSON.parse(read('.firebaserc'));
  assert.equal(rc.projects.default, production.project);
  assert.deepEqual(firebase.firestore, [{ database: 'default', rules: 'infrastructure/firebase/firestore.rules' }]);
  assert.equal(existsSync(resolve(root, firebase.firestore[0].rules)), true);
});
