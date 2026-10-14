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
  const service = new FirebaseProductService({ getAuth: () => auth }, new ConfigService({ AUTH_RATE_LIMIT_KEY: 'fixture-only-rate-key-that-is-long-enough' }));
  service.db = () => db;
  return { service, rows, identity, auth, revoke: () => { revoked = true; }, db };
}
const setup = { full_name: 'Fixture Adult', identity: 'student', education_stage: 'higher_ed', age_band: 'adult', subjects: ['Mathematics'], institution_type: 'college', degree_program: 'B.Sc', department: 'Mathematics', semester: 'Semester 1', career_goal: 'research' };
const metadata = { ip: '127.0.0.1', userAgent: 'Fixture browser' };

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
  assert.equal([...rows.keys()].filter(k => k.startsWith('visionary_accounts/')).length, 1);
  const event = [...rows].find(([k]) => k.startsWith('visionary_auth_events/'))[1];
  assert.equal(event.ip, metadata.ip); assert.equal(event.provider, 'password'); assert.ok(event.createdAt); assert.equal(event.expiresAt, undefined); assert.equal(JSON.stringify(event).includes('fixture-token'), false);
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
  const ref = `visionary_auth_sessions/${hash(session.device)}`, record = f.rows.get(ref); record.lastSeen = Date.now() - 1800001;
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
    const logout = await fetch(`${url}/api/auth/logout`, { method: 'POST', headers: commandHeaders });
    assert.equal(logout.status, 201);
    assert.equal((await fetch(`${url}/api/auth/me`, { headers: { Cookie: cookie } })).status, 401);
    assert.equal((await f.service.me('fixture-adult')).onboarding_complete, true);
  } finally { await app.close(); }
});
