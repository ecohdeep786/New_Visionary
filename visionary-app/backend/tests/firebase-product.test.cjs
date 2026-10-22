const test = require('node:test'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { onboardingProfile } = req('./dist/src/auth/firebase-product/profile.js');
const hash = v => createHash('sha256').update(v).digest('hex');

function fixture() {
  const rows = new Map(); let queue = Promise.resolve();
  const doc = id => ({ id, get: async () => ({ exists: rows.has(id), data: () => rows.get(id) }), delete: async () => rows.delete(id) });
  let sequence = 0;
  const db = { collection: name => ({ doc: id => doc(`${name}/${id || ++sequence}`) }), runTransaction: action => {
    const result = queue.then(async () => { const writes = []; const tx = { get: ref => ref.get(), set: (ref, value) => writes.push(() => rows.set(ref.id, structuredClone(value))), create: (ref, value) => writes.push(() => { if (rows.has(ref.id)) throw Error('Already exists'); rows.set(ref.id, structuredClone(value)); }), update: (ref, value) => writes.push(() => rows.set(ref.id, { ...rows.get(ref.id), ...value })) };
      const result = await action(tx); for (const write of writes) write(); return result; });
    queue = result.catch(() => {}); return result;
  } };
  const identity = { uid: 'fixture-adult', email: 'adult@example.test', email_verified: true, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'password' } };
  let revoked = false;
  const auth = { verifyIdToken: async () => identity, createSessionCookie: async () => 'fictional-cookie', verifySessionCookie: async () => { if (revoked) throw { code: 'auth/session-cookie-revoked' }; return identity; } };
  const service = new FirebaseProductService({ getAuth: () => auth }, new ConfigService({ AUTH_GLOBAL_LOGOUT_ENABLED: 'true', AUTH_RATE_LIMIT_KEY: 'fixture-only-rate-key-that-is-long-enough' }));
  service.db = () => db;
  return { service, rows, identity, auth, revoke: () => { revoked = true; }, db };
}
const setup = { full_name: 'Fixture Adult', identity: 'student', education_stage: 'higher_ed', age_band: 'adult', subjects: ['Mathematics'], institution_type: 'college', degree_program: 'B.Sc', department: 'Mathematics', semester: 'Semester 1', career_goal: 'research' };
const metadata = { ip: '127.0.0.1', userAgent: 'Fixture browser' };

test('compatibility rollout disables new revocations while continuing to reject revoked sessions and tokens', async t => {
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata), b = await f.service.signIn('fixture-token', metadata);
  assert.equal(a.profile.auth_features.global_sign_out, true);
  await f.service.logoutAll(a.cookie, a.device, f.identity.uid, metadata);
  let currentFlag;
  const get = f.service.config.get.bind(f.service.config);
  t.mock.method(f.service.config, 'get', key => key === 'AUTH_GLOBAL_LOGOUT_ENABLED' ? currentFlag : get(key));
  for (const flag of [undefined, null, false, 'false', 'TRUE']) {
    currentFlag = flag;
    const before = JSON.stringify([...f.rows]);
    await assert.rejects(f.service.logoutAll(b.cookie, b.device, f.identity.uid, metadata), e => e.getStatus() === 503);
    assert.equal(JSON.stringify([...f.rows]), before);
    assert.equal((await f.service.me(f.identity.uid)).auth_features.global_sign_out, false);
    await assert.rejects(f.service.authenticate(b.cookie, b.device, false), e => e.getStatus() === 401);
    await assert.rejects(f.service.signIn('stale-token', metadata), e => e.getStatus() === 401);
  }
  now += 2000; f.identity.auth_time = Math.floor(now / 1000);
  const fresh = await f.service.signIn('fresh-token', metadata);
  assert.equal(fresh.profile.auth_features.global_sign_out, false);
  assert.equal((await f.service.authenticate(fresh.cookie, fresh.device, false)).authSessionVersion, 1);
});

test('global sign-out revokes every device, rejects token replay, and preserves the shared completed profile', async t => {
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata), b = await f.service.signIn('fixture-token', metadata);
  await f.service.completeOnboarding(f.identity.uid, setup);
  await f.service.logoutAll(a.cookie, a.device, f.identity.uid, metadata);
  for (const session of [a, b]) await assert.rejects(f.service.authenticate(session.cookie, session.device, false), e => e.getStatus() === 401);
  await assert.rejects(f.service.updateProfile(f.identity.uid, { full_name: 'Late old-device edit' }, 0), e => e.getStatus() === 401);
  await assert.rejects(f.service.completeOnboarding(f.identity.uid, setup, 0), e => e.getStatus() === 401);
  await assert.rejects(f.service.completeIntroduction(f.identity.uid, {}, 0), e => e.getStatus() === 401);
  await assert.rejects(f.service.signIn('stale-token', metadata), e => e.getStatus() === 401);
  const root = `visionary_accounts/${f.identity.uid}`, cutoff = f.rows.get(root).lastGlobalSignOutSecond;
  now += 2000;
  f.identity.auth_time = cutoff + 1;
  const fresh = await f.service.signIn('new-login-token', metadata);
  assert.equal(fresh.profile.onboarding_complete, true);
  assert.equal(fresh.profile.full_name, setup.full_name);
  assert.equal((await f.service.authenticate(fresh.cookie, fresh.device)).authSessionVersion, 1);
  // A lost-response retry cannot revoke a subsequently created session.
  await f.service.logoutAll(a.cookie, a.device, f.identity.uid, metadata);
  assert.equal(f.rows.get(root).authSessionVersion, 1);
  assert.equal((await f.service.authenticate(fresh.cookie, fresh.device, false)).uid, f.identity.uid);
  assert.equal([...f.rows].filter(([key, row]) => key.startsWith('visionary_auth_events/') && row.type === 'sign_out_all').length, 1);
});

test('a future-dated preexisting token cannot cross the global sign-out cutoff', async () => {
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata);
  f.identity.auth_time = Math.floor(Date.now() / 1000) + 30;
  await assert.rejects(f.service.signIn('future-token', metadata), e => e.getStatus() === 401);
  await f.service.logoutAll(a.cookie, a.device, f.identity.uid, metadata);
  await assert.rejects(f.service.signIn('future-token', metadata), e => e.getStatus() === 401);
});

test('retired-device retries cannot throttle a fresh device global sign-out or sign-in', async t => {
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  const f = fixture(), old = await f.service.signIn('fixture-token', metadata);
  await f.service.logoutAll(old.cookie, old.device, f.identity.uid, metadata);
  for (let attempt = 0; attempt < 12; attempt++) {
    await assert.rejects(f.service.signIn('old-token', metadata), e => e.getStatus() === 401);
    try { await f.service.logoutAll(old.cookie, old.device, f.identity.uid, metadata); }
    catch (error) { assert.equal(error.getStatus(), 429); }
  }
  now += 2000; f.identity.auth_time = Math.floor(now / 1000);
  const fresh = await f.service.signIn('fresh-token', metadata);
  await f.service.logoutAll(fresh.cookie, fresh.device, f.identity.uid, metadata);
  assert.equal(f.rows.get(`visionary_accounts/${f.identity.uid}`).authSessionVersion, 2);
});

test('global sign-out requires cookie, device and account ownership and leaves another UID intact', async () => {
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata), uid = f.identity.uid;
  await assert.rejects(f.service.logoutAll('wrong-cookie', a.device, uid, metadata), e => e.getStatus() === 401);
  await assert.rejects(f.service.logoutAll(a.cookie, a.device, 'foreign-account', metadata), e => e.getStatus() === 409);
  f.identity.uid = 'separate-user';
  const other = await f.service.signIn('other-token', metadata);
  f.identity.uid = uid;
  await f.service.logoutAll(a.cookie, a.device, uid, metadata);
  f.identity.uid = 'separate-user';
  assert.equal((await f.service.authenticate(other.cookie, other.device)).uid, f.identity.uid);
  assert.equal(f.rows.get(`visionary_accounts/${f.identity.uid}`).authSessionVersion, undefined);
});

test('legacy sessions work before revocation but missing or malformed epochs cannot bypass it', async () => {
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata), key = `visionary_auth_sessions/${hash(a.device)}`;
  delete f.rows.get(key).authSessionVersion;
  assert.equal((await f.service.authenticate(a.cookie, a.device, false)).authSessionVersion, 0);
  await f.service.logoutAll(a.cookie, a.device, f.identity.uid, metadata);
  const account = f.rows.get(`visionary_accounts/${f.identity.uid}`);
  delete f.rows.get(key).revokedAt;
  await assert.rejects(f.service.authenticate(a.cookie, a.device), e => e.getStatus() === 401);
  for (const value of [undefined, null, NaN, '1', -1, Infinity]) {
    account.authSessionVersion = value;
    await assert.rejects(f.service.authenticate(a.cookie, a.device), e => e.getStatus() === 401);
    await assert.rejects(f.service.signIn('token', metadata), e => e.getStatus() === 401);
  }
});

test('passive device checks perform no writes and never extend inactivity', async () => {
  const f = fixture(), a = await f.service.signIn('fixture-token', metadata);
  const before = structuredClone([...f.rows]);
  await f.service.authenticate(a.cookie, a.device, false);
  assert.deepEqual([...f.rows], before);
});

test('same-named users keep separate UIDs while independent device sessions and onboarding share one account', async () => {
  const f = fixture(); f.identity.name = 'Same name';
  const first = await f.service.signIn('fixture-token', metadata), second = await f.service.signIn('fixture-token', { ip: '127.0.0.2', userAgent: 'Other fixture browser' });
  assert.equal(first.profile.id, second.profile.id); assert.notEqual(first.device, second.device);
  const root = `visionary_accounts/${first.profile.id}`;
  assert.equal(f.rows.get(root).storageVersion, 2); assert.equal(f.rows.get(root).identity.uid, first.profile.id);
  assert.equal(f.rows.get(`${root}/structure/account`).uid, first.profile.id);
  assert.equal(f.rows.get(`${root}/structure/account`).sections.learning.availability, 'not-connected');
  const device = f.rows.get(`${root}/devices/${hash(first.device)}`);
  assert.equal(device.uid, first.profile.id); assert.equal(device.observedIp, metadata.ip); assert.equal(device.userAgent, metadata.userAgent);
  assert.equal(device.cookieHash, undefined); assert.equal(JSON.stringify(device).includes(first.cookie), false);
  await f.service.completeOnboarding(first.profile.id, setup);
  assert.equal((await f.service.me(second.profile.id)).onboarding_complete, true);
  await f.service.logout(first.device, first.profile.id);
  assert.ok(f.rows.get(`${root}/devices/${hash(first.device)}`).revokedAt);
  assert.equal(f.rows.get(`${root}/devices/${hash(second.device)}`).revokedAt, null);
  f.identity.uid = 'second-person'; f.identity.email = 'other@example.test';
  const other = await f.service.signIn('other-token', metadata);
  assert.notEqual(other.profile.id, first.profile.id); assert.equal(other.profile.full_name, 'Same name');
  assert.equal(other.profile.onboarding_complete, false); assert.equal(f.rows.get(root).profile.full_name, setup.full_name);
  assert.equal(f.rows.get(`visionary_accounts/${other.profile.id}/structure/account`).uid, other.profile.id);
});

test('foreign directory ownership prevents sign-in account writes rather than replacing another account structure', async () => {
  const f = fixture(), root = `visionary_accounts/${f.identity.uid}`;
  f.rows.set(`${root}/structure/account`, { uid: 'other', schemaVersion: 1 });
  await assert.rejects(f.service.signIn('fixture-token', metadata), error => error.getStatus() === 409);
  assert.equal(f.rows.has(root), false);
  assert.equal(f.rows.has(`${root}/billing/test`), false);
  assert.equal(f.rows.get(`${root}/structure/account`).uid, 'other');
});

test('legacy billing and an unfinished migration fail closed without replacing paid state with Free', async () => {
  const f = fixture(), paid = { uid: f.identity.uid, revision: 8, subscription: { id: 'sub_keep' } };
  f.rows.set(`visionary_billing_test_accounts/${f.identity.uid}`, paid);
  await assert.rejects(f.service.signIn('fixture-token', metadata), error => error.getStatus() === 503);
  assert.deepEqual(f.rows.get(`visionary_billing_test_accounts/${f.identity.uid}`), paid);
  assert.equal(f.rows.has(`visionary_accounts/${f.identity.uid}/billing/test`), false);
  f.rows.delete(`visionary_billing_test_accounts/${f.identity.uid}`);
  const session = await f.service.signIn('fixture-token', metadata);
  f.rows.get(`visionary_accounts/${f.identity.uid}`).storageMigration = { status: 'copying' };
  await assert.rejects(f.service.authenticate(session.cookie, session.device), error => error.getStatus() === 503);
  await assert.rejects(f.service.signIn('fixture-token', metadata), error => error.getStatus() === 503);
});

test('activity and logout preserve recovered metadata when a legacy session lacks browser fields', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  const sessionKey = `visionary_auth_sessions/${hash(session.device)}`, deviceKey = `visionary_accounts/${f.identity.uid}/devices/${hash(session.device)}`;
  const saved = f.rows.get(sessionKey), firstSeen = f.rows.get(deviceKey).firstSeenAt;
  for (const key of ['provider', 'ip', 'userAgent', 'createdAt']) delete saved[key];
  await f.service.authenticate(session.cookie, session.device);
  assert.deepEqual(f.rows.get(deviceKey).firstSeenAt, firstSeen);
  assert.equal(f.rows.get(deviceKey).provider, 'password'); assert.equal(f.rows.get(deviceKey).observedIp, metadata.ip);
  await f.service.logout(session.device, f.identity.uid);
  assert.equal(f.rows.get(deviceKey).userAgent, metadata.userAgent); assert.ok(f.rows.get(deviceKey).revokedAt);
});

test('short product setup accepts essential role data without optional interview questions', () => {
  const basics = {full_name:'Adult',age_band:'adult',preferred_language:'English'};
  for (const fields of [{identity:'student',education_stage:'higher_ed'}, {identity:'professional'}, {identity:'teacher',teacher_category:'coaching',medium:'English'}, {identity:'parent',medium:'English'}, {identity:'organization',org_type:'training',org_name:'Example'}]) {
    const profile = onboardingProfile({...basics,...fields}); assert.equal(profile.identity, fields.identity);
    for (const optional of ['experience','teacher_role','semester','department','parent_relation','child_stage','career_goal']) assert.equal(profile[optional], undefined);
  }
  assert.throws(() => onboardingProfile({...basics,identity:'student',education_stage:'competitive'}), error => error.getStatus() === 400);
  assert.throws(() => onboardingProfile({...basics,identity:'teacher',teacher_category:'unknown',medium:'English'}), error => error.getStatus() === 400);
});

test('introduction acknowledgement stays on the authenticated account and cannot rewrite setup', async () => {
  const { service, rows } = fixture();
  await service.signIn('fixture-token', metadata);
  await assert.rejects(service.completeIntroduction('fixture-adult', {}), error => error.getStatus() === 409);
  const profile = await service.completeOnboarding('fixture-adult', setup);
  assert.equal(profile.getting_started_complete, false);
  await assert.rejects(service.completeIntroduction('fixture-adult', { uid: 'other' }), error => error.getStatus() === 400);
  const completed = await service.completeIntroduction('fixture-adult', {});
  assert.equal(completed.getting_started_complete, true);
  assert.equal(completed.id, profile.id); assert.equal(completed.full_name, setup.full_name);
  assert.deepEqual(await service.completeIntroduction('fixture-adult', {}), completed);
  assert.equal((await service.signIn('fixture-token', metadata)).profile.getting_started_complete, true);
  assert.equal(rows.get('visionary_accounts/fixture-adult').onboarding.introduction.status, 'complete');
});

test('onboarding rejects malformed preference shapes and incomplete role details', () => {
  for (const changes of [{ full_name: {} }, { subjects: 'Maths' }, { learning_goals: [5] }, { study_routine: [] }, { education_stage: 'unsupported' }]) assert.throws(() => onboardingProfile({ ...setup, ...changes }), error => error.getStatus() === 400);
  assert.throws(() => onboardingProfile({ full_name: 'Adult', age_band: 'adult', identity: 'student', education_stage: 'school', board: 'State', medium: 'English', grade_level: 'Class 12' }), error => error.getStatus() === 400);
  const cleaned = onboardingProfile({ ...setup, identity: 'professional', preferred_language: 'English', career_goal: 'Build an app', org_name: 'Stale org', child_stage: 'school', teacher_classes: ['Class 1'] });
  assert.equal(cleaned.org_name, undefined); assert.equal(cleaned.child_stage, undefined); assert.equal(cleaned.teacher_classes, undefined); assert.equal(cleaned.degree_program, undefined);
});

test('verified UID creates one pending account; repeated login preserves completed setup', async () => {
  const { service, rows } = fixture(); const session = await service.signIn('fixture-token', metadata);
  assert.equal(session.profile.onboarding_complete, false); assert.equal(session.profile.id, 'fixture-adult');
  const finished = await service.completeOnboarding(session.profile.id, setup); assert.equal(finished.onboarding_complete, true);
  const again = await service.signIn('fixture-token', metadata); assert.equal(again.profile.onboarding_complete, true); assert.equal(again.profile.full_name, setup.full_name);
  assert.equal([...rows.keys()].filter(k => /^visionary_accounts\/[^/]+$/.test(k)).length, 1);
  const event = [...rows].find(([k]) => k.startsWith('visionary_auth_events/'))[1];
  assert.equal(event.ip, metadata.ip); assert.equal(event.provider, 'password'); assert.ok(event.createdAt); assert.equal(event.expiresAt, undefined); assert.equal(JSON.stringify(event).includes('fixture-token'), false);
});

test('verified first sign-in atomically creates Free billing under the Auth UID without resetting a paid account', async () => {
  const f = fixture(), first = await f.service.signIn('fixture-token', metadata);
  const key = `visionary_accounts/${first.profile.id}/billing/test`, billing = f.rows.get(key);
  assert.equal(billing.uid, f.identity.uid); assert.equal(billing.basePlan, 'start');
  assert.equal(billing.subscription, null); assert.equal(billing.attempt, null); assert.deepEqual(billing.invoices, []);
  const paid = { ...billing, revision: 7, subscription: { id: 'sub_saved', paidThrough: 9999999999 }, invoices: [{ id: 'inv_saved' }] };
  f.rows.set(key, paid);
  await f.service.signIn('fixture-token', metadata);
  assert.deepEqual(f.rows.get(key), paid);
  assert.equal([...f.rows.keys()].filter(key => /^visionary_accounts\/[^/]+\/billing\/test$/.test(key)).length, 1);
});
test('unverified or stale sign-in cannot write an account or start a session', async () => {
  const { service, identity, rows } = fixture(); identity.email_verified = false;
  await assert.rejects(service.signIn('fixture-token', metadata), e => e.getStatus() === 401); assert.equal(rows.size, 0);
  identity.email_verified = true; identity.auth_time -= 301;
  await assert.rejects(service.signIn('fixture-token', metadata), e => e.getStatus() === 401); assert.equal(rows.size, 0);
});
test('verified identity cannot introduce a Firestore path as its account identifier', async () => {
  const { service, identity, rows } = fixture(); identity.uid = 'account/another/path';
  await assert.rejects(service.signIn('fixture-token', metadata), e => e.getStatus() === 401); assert.equal(rows.size, 0);
});
test('cookie/device binding, idle timeout, revoked identity and logout reject sessions', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  assert.equal((await f.service.authenticate(session.cookie, session.device)).uid, 'fixture-adult');
  await assert.rejects(f.service.authenticate('another-cookie', session.device), e => e.getStatus() === 401);
  const ref = `visionary_auth_sessions/${hash(session.device)}`, record = f.rows.get(ref); record.lastSeen = Date.now() - 7 * 86400000 - 1;
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  record.lastSeen = Date.now(); f.revoke(); await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  await assert.rejects(f.service.logout(session.device, 'another-account'), e => e.getStatus() === 409);
  assert.equal(f.rows.get(ref).revokedAt, undefined);
  await f.service.logout(session.device, 'fixture-adult'); assert.equal(f.rows.has(ref), true); assert.ok(f.rows.get(ref).revokedAt);
  f.auth.verifySessionCookie = async () => f.identity;
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  assert.ok(f.rows.has('visionary_accounts/fixture-adult'));
});
test('absolute expiry and mismatched UID reject a retained session record', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  const record = f.rows.get(`visionary_auth_sessions/${hash(session.device)}`);
  record.expires = Date.now() - 1;
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  record.expires = Date.now() + 10000; f.identity.uid = 'another-account';
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
});

test('returning devices remain signed in across days with bounded cookies and no sliding absolute expiry', async () => {
  const f = fixture(); let requestedLifetime;
  f.auth.createSessionCookie = async (_token, options) => { requestedLifetime = options.expiresIn; return 'fictional-cookie'; };
  const session = await f.service.signIn('fixture-token', metadata);
  assert.equal(requestedLifetime, 14 * 86400000);
  assert.equal(session.expiresIn, requestedLifetime);
  const key = `visionary_auth_sessions/${hash(session.device)}`;
  const record = f.rows.get(key), originalExpiry = record.expires;
  record.lastSeen = Date.now() - 6 * 86400000;
  assert.equal((await f.service.authenticate(session.cookie, session.device)).uid, f.identity.uid);
  assert.equal(f.rows.get(key).expires, originalExpiry, 'Visits must not extend absolute expiry');
  assert.ok(Date.now() - f.rows.get(key).lastSeen < 1000);
  const second = await f.service.signIn('fixture-token', metadata);
  await f.service.logout(session.device, f.identity.uid);
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  assert.equal((await f.service.authenticate(second.cookie, second.device)).uid, f.identity.uid);
});

test('malformed expiry and future activity cannot create a cached authentication bypass', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  const key = `visionary_auth_sessions/${hash(session.device)}`, saved = { ...f.rows.get(key) };
  for (const expires of [undefined, null, NaN, Infinity, '9999999999999']) {
    f.rows.set(key, { ...saved, expires });
    await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
  }
  f.rows.set(key, { ...saved, lastSeen: Date.now() + 120000 });
  await assert.rejects(f.service.authenticate(session.cookie, session.device), e => e.getStatus() === 401);
});

test('billing observation validates expiry without extending the device idle window', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  const record = f.rows.get(`visionary_auth_sessions/${hash(session.device)}`); record.lastSeen = Date.now() - 10000;
  const previous = record.lastSeen;
  await f.service.authenticate(session.cookie, session.device, false);
  assert.equal(f.rows.get(`visionary_auth_sessions/${hash(session.device)}`).lastSeen, previous);
  record.lastSeen = Date.now() - 7 * 86400000 - 1;
  await assert.rejects(f.service.authenticate(session.cookie, session.device, false), error => error.getStatus() === 401);
});
test('repeated sign-in rotates only the proven current device and retains account/history', async () => {
  const f = fixture(), old = await f.service.signIn('fixture-token', metadata);
  await f.service.completeOnboarding('fixture-adult', setup);
  const next = await f.service.signIn('fixture-token', metadata, { cookie: old.cookie, device: old.device });
  assert.equal(next.profile.onboarding_complete, true); assert.notEqual(next.device, old.device);
  assert.ok(f.rows.get(`visionary_auth_sessions/${hash(old.device)}`).revokedAt);
  await assert.rejects(f.service.authenticate(old.cookie, old.device), e => e.getStatus() === 401);
  assert.equal((await f.service.authenticate(next.cookie, next.device)).uid, 'fixture-adult');
});
test('expired-cookie cleanup requires both cookies when the browser has no cached UID', async () => {
  const f = fixture(), session = await f.service.signIn('fixture-token', metadata);
  await assert.rejects(f.service.logout(session.device, undefined, 'wrong-cookie'), e => e.getStatus() === 409);
  await f.service.logout(session.device, undefined, session.cookie, metadata);
  assert.ok(f.rows.get(`visionary_auth_sessions/${hash(session.device)}`).revokedAt);
  assert.ok([...f.rows].some(([key, value]) => key.startsWith('visionary_auth_events/') && value.type === 'sign_out' && value.ip === metadata.ip));
});
test('Firestore emulator configuration fails before any live credential/client access', () => {
  const previous = process.env.FIRESTORE_EMULATOR_HOST;
  try {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    const admin = { getAuth: () => { throw Error('Live credential must not be loaded'); } };
    const emulator = new FirebaseProductService(admin, new ConfigService({ FIREBASE_PROJECT_KIND: 'emulator' }));
    assert.throws(() => emulator.db(), e => e.getStatus() === 503);
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    const production = new FirebaseProductService(admin, new ConfigService({ FIREBASE_PROJECT_KIND: 'production' }));
    assert.throws(() => production.db(), e => e.getStatus() === 503);
  } finally { if (previous === undefined) delete process.env.FIRESTORE_EMULATOR_HOST; else process.env.FIRESTORE_EMULATOR_HOST = previous; }
});
test('simultaneous onboarding completion has one durable first result', async () => {
  const { service } = fixture(); await service.signIn('fixture-token', metadata);
  const [a, b] = await Promise.all([service.completeOnboarding('fixture-adult', setup), service.completeOnboarding('fixture-adult', { ...setup, full_name: 'Different device' })]);
  assert.deepEqual(a, b); assert.equal((await service.me('fixture-adult')).profile_version, 1);
});
test('server rejects claimed completion, extra identities, unsafe nested values and minor admission', () => {
  assert.throws(() => onboardingProfile({ ...setup, onboarding_complete: true }), e => e.getStatus() === 400);
  assert.throws(() => onboardingProfile({ ...setup, id: 'another-account' }), e => e.getStatus() === 400);
  assert.throws(() => onboardingProfile({ ...setup, age_band: 'minor' }), e => e.getStatus() === 403);
  assert.throws(() => onboardingProfile({ ...setup, subjects: new Array(51).fill('Subject') }), e => e.getStatus() === 400);
  assert.equal(onboardingProfile({ ...setup, child_name: 'Not retained' }).child_name, undefined);
});
test('account storage outage remains 503, rather than resetting onboarding', async () => {
  const { service, db } = fixture(); db.collection = () => { throw Error('Unavailable'); };
  await assert.rejects(service.me('fixture-adult'), e => e.getStatus() === 503);
});
test('atomic rate budget and profile optimistic conflicts reject repeat abuse/overwrites', async () => {
  const { service } = fixture(); await service.signIn('fixture-token', metadata);
  await Promise.all([service.rateLimit('fixture', 'same-subject', 2), service.rateLimit('fixture', 'same-subject', 2)]);
  await assert.rejects(service.rateLimit('fixture', 'same-subject', 2), e => e.getStatus() === 429);
  await service.completeOnboarding('fixture-adult', setup);
  await assert.rejects(service.updateProfile('fixture-adult', { full_name: 'Overwrite', expectedProfileName: 'Old name' }), e => e.getStatus() === 409);
  await assert.rejects(service.updateProfile('fixture-adult', { onboarding_complete: true }), e => e.getStatus() === 400);
});

test('HTTP boundary requires exact origin and CSRF, and issues HttpOnly bound cookies', async () => {
  const { Module } = req('@nestjs/common'), { NestFactory } = req('@nestjs/core');
  const cookieParser = req('cookie-parser');
  const { FirebaseProductController } = req('./dist/src/auth/firebase-product/firebase-product.controller.js');
  const f = fixture(); class FixtureModule {}
  Module({ controllers: [FirebaseProductController], providers: [{ provide: FirebaseProductService, useValue: f.service }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(cookieParser()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const url = await app.getUrl(), csrfResponse = await fetch(`${url}/api/auth/csrf`), csrf = await csrfResponse.json();
    const cookies = csrfResponse.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    const post = origin => fetch(`${url}/api/auth/session`, { method: 'POST', headers: { Origin: origin, Cookie: cookies, 'X-CSRF-Token': csrf.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: 'fixture-token' }) });
    assert.equal((await post('https://attacker.test')).status, 403); assert.equal(f.rows.size, 0);
    const login = await post('http://localhost:5173'); assert.equal(login.status, 201);
    const issued = login.headers.getSetCookie(); assert.equal(issued.length, 2); assert.ok(issued.every(c => c.includes('HttpOnly') && c.includes('SameSite=Strict')));
    assert.equal((await login.json()).onboarding_complete, false);
    const cookie = issued.map(c => c.split(';')[0]).join('; ');
    const me = await fetch(`${url}/api/auth/me`, { headers: { Cookie: cookie } }); assert.equal(me.status, 200); assert.equal((await me.json()).id, 'fixture-adult');
    const beforePassive = structuredClone([...f.rows]);
    const passive = await fetch(`${url}/api/auth/me?passive=1`, { headers: { Cookie: cookie } });
    assert.equal(passive.status, 200); assert.equal(passive.headers.getSetCookie().length, 0); assert.deepEqual([...f.rows], beforePassive);
    assert.equal((await fetch(`${url}/api/auth/me?passive=invalid`, { headers: { Cookie: cookie } })).status, 400);
    const update = await fetch(`${url}/api/auth/onboarding`, { method: 'POST', headers: { Origin: 'http://localhost:5173', Cookie: `${cookie}; ${cookies}`, 'X-CSRF-Token': csrf.token, 'X-Visionary-Account': 'another-account', 'Content-Type': 'application/json' }, body: JSON.stringify(setup) });
    assert.equal(update.status, 409); assert.equal((await f.service.me('fixture-adult')).onboarding_complete, false);
    const commandHeaders = { Origin: 'http://localhost:5173', Cookie: `${cookie}; ${cookies}`, 'X-CSRF-Token': csrf.token, 'X-Visionary-Account': 'fixture-adult', 'Content-Type': 'application/json' };
    const complete = await fetch(`${url}/api/auth/onboarding`, { method: 'POST', headers: commandHeaders, body: JSON.stringify(setup) });
    assert.equal(complete.status, 201); assert.equal((await complete.json()).onboarding_complete, true);
    const introPath = `${url}/api/auth/onboarding/introduction`;
    assert.equal((await fetch(introPath, { method: 'POST', headers: { ...commandHeaders, Origin: 'https://attacker.test' }, body: '{}' })).status, 403);
    assert.equal((await fetch(introPath, { method: 'POST', headers: { ...commandHeaders, 'X-Visionary-Account': 'other' }, body: '{}' })).status, 409);
    const acknowledged = await fetch(introPath, { method: 'POST', headers: commandHeaders, body: '{}' });
    assert.equal(acknowledged.status, 201); assert.equal((await acknowledged.json()).getting_started_complete, true);
    const otherDevice = await f.service.signIn('fixture-token', metadata);
    assert.equal((await fetch(`${url}/api/auth/logout-all`, { method: 'POST', headers: { ...commandHeaders, Origin: 'https://attacker.test' } })).status, 403);
    assert.equal((await fetch(`${url}/api/auth/logout-all`, { method: 'POST', headers: { ...commandHeaders, 'X-Visionary-Account': 'other' } })).status, 409);
    const logout = await fetch(`${url}/api/auth/logout-all`, { method: 'POST', headers: commandHeaders });
    assert.equal(logout.status, 201);
    assert.equal((await fetch(`${url}/api/auth/me`, { headers: { Cookie: cookie } })).status, 401);
    await assert.rejects(f.service.authenticate(otherDevice.cookie, otherDevice.device), e => e.getStatus() === 401);
    assert.equal((await f.service.me('fixture-adult')).onboarding_complete, true);
  } finally { await app.close(); }
});
