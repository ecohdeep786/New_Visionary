import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, isCredentialError, passwordRequirements } from '../src/lib/authErrors.js';
import { firebaseEmulatorFromEnvironment } from '../src/api/firebase/config.js';

test('SDK errors have recovery messages without vendor codes, stacks or response secrets', () => {
  for (const code of ['auth/invalid-credential', 'auth/email-already-in-use', 'auth/too-many-requests', 'auth/popup-blocked', 'auth/account-exists-with-different-credential', 'auth/invalid-action-code']) {
    const result = authErrorMessage({ code, message: 'Firebase: auth/internal-error secret-token', stack: 'private-key-fixture' });
    assert.ok(result.length > 20); assert.doesNotMatch(result, /Firebase|auth\/|secret-token|private-key/);
  }
  assert.equal(authErrorMessage({ code: 'unknown', message: '<script>secret-token</script>' }), 'We could not finish that request. Please try again.');
});
test('service failures do not become incorrect-password messages', () => {
  assert.equal(isCredentialError({ status: 503 }), false);
  assert.match(authErrorMessage({ status: 503 }), /temporarily unavailable/);
  assert.match(authErrorMessage({ status: 409 }), /account changed/);
  assert.match(authErrorMessage({ name: 'TimeoutError' }), /internet connection/);
});
test('password requirements reflect the actual returned Firebase policy', () => {
  assert.deepEqual(passwordRequirements({ meetsMinPasswordLength: false, containsNumericCharacter: false, passwordPolicy: { customStrengthOptions: { minPasswordLength: 12 } } }), ['Use at least 12 characters.', 'Include a number.']);
});
test('demo auth tests cannot silently fall back to production or remote emulators', () => {
  const config = { projectId: 'demo-visionary-auth' };
  assert.throws(() => firebaseEmulatorFromEnvironment({ DEV: true }, config));
  assert.throws(() => firebaseEmulatorFromEnvironment({ DEV: false, VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099' }, config));
  assert.throws(() => firebaseEmulatorFromEnvironment({ DEV: true, VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://attacker.test:9099' }, config));
  assert.throws(() => firebaseEmulatorFromEnvironment({ DEV: true, VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099' }, { projectId: 'visionary-fd6d2' }));
  assert.equal(firebaseEmulatorFromEnvironment({ DEV: true, VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099' }, config), 'http://127.0.0.1:9099');
});
