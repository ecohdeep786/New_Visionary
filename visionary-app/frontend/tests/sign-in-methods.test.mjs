import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerAuth } from '../src/api/firebase/serverAuth.js';
import { popupProviderId } from '../src/api/firebase/signInMethods.js';

const profile = { id: 'fictional-adult', onboarding_complete: true };
const user = { uid: profile.id, emailVerified: true, getIdToken: async () => 'fictional-token' };

test('unavailable and malformed providers never invoke identity or exchange and retain the loaded profile', async () => {
  let identities = 0;
  const requests = [];
  const auth = createServerAuth({
    request: async path => { requests.push(path); return profile; },
    identity: { provider: async () => { identities++; return user; } },
  });
  await auth.me();
  for (const provider of ['microsoft', 'mobile', 'organization', 'phone', 'google.com', 'Google', '__proto__', 'constructor', '', null, {}, ['google']]) {
    await assert.rejects(auth.loginWithProvider(provider), error => error.code === 'auth/operation-not-allowed');
    assert.equal(auth.currentProfile(), profile);
  }
  assert.equal(identities, 0);
  assert.deepEqual(requests, ['/me']);
});

for (const provider of ['google', 'apple']) {
  test(`${provider} still requires verified identity and an owner-matched server profile`, async () => {
    const calls = [];
    const auth = createServerAuth({
      request: async (path, options) => { calls.push({ path, body: options.body }); return profile; },
      identity: { provider: async name => { assert.equal(name, provider); return user; } },
    });
    assert.equal(popupProviderId(provider), `${provider}.com`);
    assert.equal(await auth.loginWithProvider(provider), profile);
    assert.deepEqual(calls, [{ path: '/session', body: { idToken: 'fictional-token' } }]);

    const unverified = createServerAuth({ request: async () => assert.fail('Unverified token exchanged'), identity: { provider: async () => ({ ...user, emailVerified: false }) } });
    await assert.rejects(unverified.loginWithProvider(provider), error => error.code === 'auth/email-not-verified');

    const mismatch = createServerAuth({ request: async () => ({ ...profile, id: 'other-account' }), identity: { provider: async () => user } });
    await assert.rejects(mismatch.loginWithProvider(provider), error => error.code === 'auth/profile-unavailable');
    assert.equal(mismatch.currentProfile(), null);
  });
}

test('cancelled OAuth can retry without an exchange or duplicate identity request', async () => {
  let attempts = 0, exchanges = 0, finish;
  const auth = createServerAuth({
    request: async () => { exchanges++; return profile; },
    identity: { provider: async () => {
      if (++attempts === 1) throw Object.assign(new Error('Cancelled'), { code: 'auth/popup-closed-by-user' });
      return new Promise(resolve => { finish = resolve; });
    } },
  });
  await assert.rejects(auth.loginWithProvider('google'), error => error.code === 'auth/popup-closed-by-user');
  assert.equal(exchanges, 0);
  const retry = auth.loginWithProvider('apple');
  await assert.rejects(auth.loginWithProvider('google'), error => error.code === 'auth/operation-in-progress');
  finish(user);
  assert.equal(await retry, profile);
  assert.equal(attempts, 2);
  assert.equal(exchanges, 1);
});
