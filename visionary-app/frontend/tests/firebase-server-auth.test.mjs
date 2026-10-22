import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerAuth } from '../src/api/firebase/serverAuth.js';
import { authDestination } from '../src/lib/authReturnTo.js';

const user = { emailVerified: true, getIdToken: async () => 'fictional-id-token' };
const first = { id: 'fixture-a', onboarding_complete: false }, complete = { ...first, onboarding_complete: true };
const fixture = request => createServerAuth({ request, identity: { login: async () => user, register: async () => user, provider: async () => user, sendVerification: async () => {}, logout: async () => {}, reloadCurrent: async () => user } });

test('passive observation survives an outage but clears a server-revoked session', async () => {
  let status = 0; const paths = [];
  const auth = fixture(async path => { paths.push(path); if (status) throw Object.assign(new Error('Fixture failure'), { status }); return complete; });
  await auth.me(); status = 503;
  await assert.rejects(auth.me({ passive: true }), e => e.status === 503);
  assert.equal(auth.currentProfile(), complete);
  status = 401;
  await assert.rejects(auth.me({ passive: true }), e => e.status === 401);
  assert.equal(auth.currentProfile(), null);
  assert.deepEqual(paths, ['/me', '/me?passive=1', '/me?passive=1']);
});

test('a delayed passive rejection cannot erase a newly authenticated account', async () => {
  let rejectOld;
  const auth = fixture(path => path === '/me?passive=1' ? new Promise((_, reject) => { rejectOld = reject; }) : Promise.resolve(complete));
  await auth.me(); const old = auth.me({ passive: true });
  await auth.loginViaEmailPassword('fixture@example.test', 'fixture-only');
  rejectOld(Object.assign(new Error('Old revoked session'), { status: 401 }));
  await assert.rejects(old); assert.equal(auth.currentProfile(), complete);
});

test('all-device sign-out coalesces duplicate clicks and never falls back to local logout', async () => {
  const paths = []; let finish;
  const auth = fixture(path => { paths.push(path); return path === '/logout-all' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(complete); });
  await auth.me(); const a = auth.logout({ allDevices: true }), b = auth.logout({ allDevices: true });
  assert.equal(a, b);
  await assert.rejects(auth.loginViaEmailPassword('fixture@example.test', 'fixture-only'), e => e.code === 'auth/operation-in-progress');
  finish({ ok: true }); await a;
  assert.deepEqual(paths, ['/me', '/logout-all']); assert.equal(auth.currentProfile(), null);
});

test('failed all-device sign-out preserves the account for retry', async () => {
  const auth = fixture(async path => { if (path === '/logout-all') throw Object.assign(new Error('Unavailable'), { status: 503 }); return complete; });
  await auth.me(); await assert.rejects(auth.logout({ allDevices: true }), e => e.status === 503);
  assert.equal(auth.currentProfile(), complete);
});

test('a pending local sign-out cannot be reported as successful all-device sign-out', async () => {
  let finish; const paths = [];
  const auth = fixture(path => { paths.push(path); return path === '/logout' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(complete); });
  await auth.me(); const local = auth.logout();
  await assert.rejects(auth.logout({ allDevices: true }), e => e.code === 'auth/operation-in-progress');
  finish({ ok: true }); await local; assert.deepEqual(paths, ['/me', '/logout']);
});

test('overlapping authority reads share one request without treating focus as an account change', async () => {
  let resolve, calls=0;
  const auth=fixture(()=>{calls++;return new Promise(done=>{resolve=done;});});
  const a=auth.me(),b=auth.me(); resolve(complete); assert.deepEqual(await Promise.all([a,b]),[complete,complete]); assert.equal(calls,1);
});
test('an older read cannot replace confirmed setup; a later read remains available', async () => {
  let oldRead, reads=0;
  const auth=fixture(async path=>path==='/onboarding'?complete:++reads===2?new Promise(resolve=>{oldRead=resolve;}):reads>2?complete:first);
  await auth.me(); const pending=auth.me(); await auth.completeOnboarding({full_name:'Adult'}); assert.deepEqual(await auth.me(),complete);
  oldRead(first); await assert.rejects(pending,error=>error.code==='auth/account-changed'); assert.deepEqual(auth.currentProfile(),complete);
});

test('introduction uses a bound account command and preserves completed setup', async () => {
  const calls = [], auth = fixture(async (path, options) => { calls.push({path, options}); return { ...complete, getting_started_complete: path === '/onboarding/introduction' }; });
  await auth.me(); await auth.completeIntroduction();
  assert.equal(calls[1].path, '/onboarding/introduction'); assert.equal(calls[1].options.accountId, first.id); assert.deepEqual(calls[1].options.body, {});
  assert.equal(auth.currentProfile().getting_started_complete, true); assert.equal(auth.currentProfile().onboarding_complete, true);
});
globalThis.window = { location: { search: '?returnTo=/dashboard/learn', origin: 'https://fixture.test' } };

test('first account goes to onboarding; saved account resumes its safe dashboard path', async () => {
  let saved = first;
  const auth = fixture(async () => saved);
  assert.equal(authDestination(await auth.loginViaEmailPassword('adult@example.test', 'not-a-real-password')), '/onboarding');
  saved = complete;
  assert.equal(authDestination(await auth.me()), '/dashboard/learn');
  assert.throws(() => authDestination(null), error => error.code === 'auth/profile-unavailable');
});
test('database failure is propagated and cannot fabricate incomplete onboarding', async () => {
  const auth = fixture(async () => { throw Object.assign(new Error('Storage unavailable'), { status: 503 }); });
  await assert.rejects(auth.me(), error => error.status === 503);
  assert.equal(auth.currentProfile(), null);
});
test('a late profile response after logout cannot restore an account', async () => {
  let finish;
  const auth = fixture(path => path === '/me' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({ ok: true }));
  const pending = auth.me(); await auth.logout(); finish(complete);
  await assert.rejects(pending, /account changed/); assert.equal(auth.currentProfile(), null);
});
test('an unverified email never exchanges a token for a product session', async () => {
  let requests = 0;
  const auth = createServerAuth({ request: async () => { requests++; }, identity: { login: async () => ({ ...user, emailVerified: false }) } });
  await assert.rejects(auth.loginViaEmailPassword('adult@example.test', 'password'), error => error.code === 'auth/email-not-verified');
  assert.equal(requests, 0);
});
test('onboarding is a dedicated server command; account changes reject old profile edits', async () => {
  const calls = [], auth = fixture(async (path, options) => { calls.push({ path, options }); return path === '/onboarding' ? complete : first; });
  await auth.me(); await auth.completeOnboarding({ full_name: 'Fixture adult', age_band: 'adult', identity: 'student' });
  assert.equal(calls[1].path, '/onboarding'); assert.equal(auth.currentProfile().onboarding_complete, true);
  assert.equal(calls[1].options.accountId, first.id);
  await assert.rejects(auth.updateMe({ full_name: 'Other' }, { expectedUserId: 'other-account' }), /account changed/);
  assert.equal(calls.length, 2);
});
test('failed server logout remains recoverable and does not report success', async () => {
  const auth = fixture(async path => { if (path === '/logout') throw new Error('Storage unavailable'); return complete; });
  await auth.me(); await assert.rejects(auth.logout(), /Storage unavailable/); assert.deepEqual(auth.currentProfile(), complete);
});
test('verification delivery failure can recover the newly created identity without a second signup', async () => {
  let registrations = 0;
  const auth = createServerAuth({ request: async () => first, identity: {
    register: async () => { registrations++; return user; }, sendVerification: async () => { throw new Error('Delivery unavailable'); }, reloadCurrent: async () => user,
  } });
  await assert.rejects(auth.register({ email: 'adult@example.test', password: 'fixture-only' }), error => error.registrationCreated === true);
  assert.deepEqual(await auth.verifyEmail(), first); assert.equal(registrations, 1);
});
test('logout cancels a delayed SDK sign-in before it can create a server session', async () => {
  let finish, exchanges = 0;
  const auth = createServerAuth({ request: async path => { if (path === '/session') exchanges++; return { ok: true }; }, identity: { login: () => new Promise(resolve => { finish = resolve; }), logout: async () => {} } });
  const pending = auth.loginViaEmailPassword('adult@example.test', 'fixture-only'); await auth.logout(); finish(user);
  await assert.rejects(pending, error => error.code === 'auth/account-changed'); assert.equal(exchanges, 0);
});
test('duplicate submit cannot create a second identity request', async () => {
  let finish, attempts = 0;
  const auth = createServerAuth({ request: async () => first, identity: { login: () => { attempts++; return new Promise(resolve => { finish = resolve; }); } } });
  const pending = auth.loginViaEmailPassword('adult@example.test', 'fixture-only');
  await assert.rejects(auth.loginViaEmailPassword('adult@example.test', 'fixture-only'), error => error.code === 'auth/operation-in-progress');
  finish(user); await pending; assert.equal(attempts, 1);
});
test('malformed profile cannot authenticate or change saved onboarding state', async () => {
  const auth = fixture(async () => ({ onboarding_complete: 'true' }));
  await assert.rejects(auth.me(), error => error.code === 'auth/profile-unavailable'); assert.equal(auth.currentProfile(), null);
});
test('reset completion remains distinguishable from failed browser-session cleanup', async () => {
  let changes = 0;
  const auth = createServerAuth({ request: async path => { if (path === '/logout') throw Object.assign(new Error('Unavailable'), { status: 503 }); return complete; }, identity: { reset: async () => { changes++; } } });
  await auth.me(); await assert.rejects(auth.resetPassword({ resetToken: 'fixture-action', newPassword: 'fixture-password' }), error => error.resetCompleted === true);
  assert.equal(changes, 1); assert.deepEqual(auth.currentProfile(), complete);
});
