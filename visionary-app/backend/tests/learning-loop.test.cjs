const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module'), { randomUUID } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException } = req('@nestjs/common'), { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { LearningController } = req('./dist/src/learning/learning.controller.js');
const { LearningService } = req('./dist/src/learning/learning.service.js');
const { startLearningSessionCommand, presentTeachingCheckCommand, assessTeachingCheckCommand, cancelLearningSessionCommand } = req('./dist/src/learning/learning.contract.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');

const scope = { workspaceId: 'demo-adult:student', conceptId: 'fractions-equivalent', sourceVersion: 'content-v1', criteriaVersion: 'rubric-v1', provider: 'authored-sample', sourceId: 'sample:fractions' };
const startCommand = (overrides = {}) => ({ version: 1, commandId: randomUUID(), ...scope, ...overrides });
const presented = (session, overrides = {}) => ({ version: 1, commandId: randomUUID(), expectedRevision: session.revision,
  workspaceId: session.workspaceId, sourceVersion: session.concept.sourceVersion, criteriaVersion: session.concept.criteriaVersion,
  strategy: 'worked_example', validation: 'passed', checkId: 'fractions-check-1', prompt: 'Which fraction equals one half?',
  options: ['2/4', '2/3', '3/4'], answerIndex: 0, ...overrides });
const answered = (session, overrides = {}) => ({ version: 1, commandId: randomUUID(), expectedRevision: session.revision,
  workspaceId: session.workspaceId, sourceVersion: session.concept.sourceVersion, criteriaVersion: session.concept.criteriaVersion,
  checkId: 'fractions-check-1', selection: 0, ...overrides });
const cancelled = (session, overrides = {}) => ({ version: 1, commandId: randomUUID(), expectedRevision: session.revision,
  workspaceId: session.workspaceId, sourceVersion: session.concept.sourceVersion, criteriaVersion: session.concept.criteriaVersion, ...overrides });
const memory = () => { const f = billingMemory(); return { f, service: new LearningService({ getDatabase: () => f.db }) }; };

test('learning commands accept bounded explicit fields and reject injected identity, answers, mastery and invalid schemas', () => {
  const start = startCommand();
  assert.equal(startLearningSessionCommand(start).maxFailedChecks, 3);
  assert.equal(startLearningSessionCommand({ ...start, maxFailedChecks: 2 }).maxFailedChecks, 2);
  for (const input of [null, [], { ...start, uid: 'other' }, { ...start, mastery: true }, { ...start, result: 'passed' }, { ...start, version: 2 },
    { ...start, commandId: '../escape' }, { ...start, maxFailedChecks: 4 }, { ...start, maxFailedChecks: 0 }, { ...start, maxFailedChecks: 2.5 },
    { ...start, workspaceId: 'a'.repeat(257) }, { ...start, sourceId: 'bad\u0000id' }, { ...start, provider: '' }])
    assert.throws(() => startLearningSessionCommand(input), error => error.getStatus() === 400);
  const present = presented({ revision: 0, workspaceId: scope.workspaceId, concept: { sourceVersion: scope.sourceVersion, criteriaVersion: scope.criteriaVersion } });
  assert.equal(presentTeachingCheckCommand(present).options.length, 3);
  assert.deepEqual(presentTeachingCheckCommand({ ...present, prompt: '  Space  ' }).prompt, 'Space');
  for (const input of [null, { ...present, passed: true }, { ...present, answer: 0 }, { ...present, correct: true }, { ...present, strategy: 'lecture' },
    { ...present, validation: 'skipped' }, { ...present, options: ['only'] }, { ...present, options: ['same', 'same'] },
    { ...present, options: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] }, { ...present, options: ['a', null] },
    { ...present, answerIndex: 3 }, { ...present, answerIndex: -1 }, { ...present, prompt: '' }, { ...present, prompt: 'p'.repeat(513) },
    { ...present, expectedRevision: -1 }, { ...present, expectedRevision: 1.5 }, { ...present, checkId: '' }])
    assert.throws(() => presentTeachingCheckCommand(input), error => error.getStatus() === 400);
  const assess = answered({ revision: 1, workspaceId: scope.workspaceId, concept: { sourceVersion: scope.sourceVersion, criteriaVersion: scope.criteriaVersion } });
  assert.equal(assessTeachingCheckCommand(assess).selection, 0);
  for (const input of [null, { ...assess, passed: true }, { ...assess, correct: true }, { ...assess, mastered: true }, { ...assess, selection: 8 },
    { ...assess, selection: 1.5 }, { ...assess, checkId: '' }, { ...assess, uid: 'other' }, { ...assess, expectedRevision: -3 }])
    assert.throws(() => assessTeachingCheckCommand(input), error => error.getStatus() === 400);
  const cancel = cancelled({ revision: 0, workspaceId: scope.workspaceId, concept: { sourceVersion: scope.sourceVersion, criteriaVersion: scope.criteriaVersion } });
  assert.equal(cancelLearningSessionCommand(cancel).expectedRevision, 0);
  for (const input of [null, { ...cancel, status: 'cancelled' }, { ...cancel, commandId: 'not-a-uuid' }, { ...cancel, criteriaVersion: 'x'.repeat(257) }])
    assert.throws(() => cancelLearningSessionCommand(input), error => error.getStatus() === 400);
});

test('starting a durable session is idempotent, bounded and stores no answer, mastery or identity context', async () => {
  const { f, service } = memory(), input = startCommand();
  const receipts = await Promise.all(Array.from({ length: 12 }, () => service.start('owner', input)));
  for (const receipt of receipts) assert.deepEqual(receipt, receipts[0]);
  assert.equal(f.rows.size, 2);
  const session = receipts[0];
  assert.equal(session.phase, 'explain'); assert.equal(session.revision, 0); assert.equal(session.maxFailedChecks, 3);
  assert.equal(session.check, null); assert.equal(session.checkPassed, false); assert.equal(session.reviewSuggested, false);
  assert.equal(session.concept.sourceVersion, 'content-v1'); assert.equal(session.concept.criteriaVersion, 'rubric-v1');
  assert.doesNotMatch(JSON.stringify(session), /answerIndex|master|taught|teacher|email|cookie|device|fingerprint/);
  await assert.rejects(service.start('owner', { ...input, conceptId: 'another-concept' }), error => error.getStatus() === 409);
  const read = await service.get('owner', session.sessionId);
  assert.deepEqual(read, session);
  assert.deepEqual(await service.list('owner', {}), { version: 1, uid: 'owner', items: [session], nextCursor: null });
});

test('a validated check is pinned to its session scope; the key stays server-side and stale, foreign or repeated presentations are refused', async () => {
  const { f, service } = memory();
  const session = await service.start('owner', startCommand());
  const receipt = await service.present('owner', session.sessionId, presented(session));
  assert.equal(receipt.phase, 'check'); assert.equal(receipt.revision, 1); assert.equal(receipt.previousStrategy, 'worked_example');
  assert.deepEqual(receipt.check, { checkId: 'fractions-check-1', strategy: 'worked_example', optionCount: 3 });
  assert.doesNotMatch(JSON.stringify(receipt), /answerIndex|Which fraction|prompt|master|teacher/);
  const read = await service.get('owner', session.sessionId);
  assert.equal(read.check.checkId, 'fractions-check-1');
  assert.doesNotMatch(JSON.stringify(read), /answerIndex|Which fraction|prompt/);
  assert.match(JSON.stringify(f.rows.get(`visionary_accounts/owner/learningSessions/${session.sessionId}`)), /answerIndex/);
  for (const input of [presented(session, { workspaceId: 'demo-adult:teacher' }), presented(session, { sourceVersion: 'content-v2' }),
    presented(session, { criteriaVersion: 'rubric-v2' }), presented(session, { strategy: 'lecture' }), presented(session, { validation: 'skipped' }),
    presented(session, { checkId: '' })])
    await assert.rejects(service.present('owner', session.sessionId, input), error => error.getStatus() === 400 || error.getStatus() === 409);
  await assert.rejects(service.present('owner', session.sessionId, presented(session)), error => error.getStatus() === 409);
  assert.equal(f.rows.size, 3);
});

test('every answer is assessed by the server; replay is idempotent and client-selected failures cannot fabricate success', async () => {
  const { f, service } = memory();
  const session = await service.start('owner', startCommand());
  await service.present('owner', session.sessionId, presented(session));
  const wrong = answered({ ...session, revision: 1 }, { selection: 1 });
  const failed = await service.assess('owner', session.sessionId, wrong);
  assert.equal(failed.receipt.passed, false); assert.equal(failed.phase, 'explain'); assert.equal(failed.failedChecks, 1);
  assert.equal(failed.reviewSuggested, false); assert.equal(failed.checkPassed, false); assert.equal(failed.revision, 2);
  assert.deepEqual(await service.assess('owner', session.sessionId, wrong), failed);
  await assert.rejects(service.assess('owner', session.sessionId, { ...wrong, selection: 0 }), error => error.getStatus() === 409);
  await assert.rejects(service.assess('owner', session.sessionId, { ...wrong, commandId: randomUUID(), checkId: 'fractions-check-2' }), error => error.getStatus() === 409);
  await assert.rejects(service.present('owner', session.sessionId, presented({ ...session, revision: 2 })), error => error.getStatus() === 409);
  await service.present('owner', session.sessionId, presented({ ...session, revision: 2 }, { strategy: 'analogy' }));
  await assert.rejects(service.assess('owner', session.sessionId, { ...wrong, commandId: randomUUID(), expectedRevision: 3, selection: 5 }), error => error.getStatus() === 400);
  const done = await service.assess('owner', session.sessionId, answered({ ...session, revision: 3 }));
  assert.equal(done.receipt.passed, true); assert.equal(done.phase, 'check_passed'); assert.equal(done.checkPassed, true);
  assert.equal(done.failedChecks, 1); assert.equal(done.reviewSuggested, false);
  assert.equal([...f.rows.keys()].filter(key => key.includes('/assessments/')).length, 2);
  for (const key of [...f.rows.keys()].filter(key => key.includes('/assessments/')))
    assert.doesNotMatch(JSON.stringify(f.rows.get(key)), /answerIndex|Which fraction|prompt|master|teacher/);
  assert.doesNotMatch(JSON.stringify(done), /answerIndex|master|taught|teacher|email|cookie/);
  await assert.rejects(service.assess('owner', session.sessionId, answered({ ...session, revision: 4 })), error => error.getStatus() === 409);
  await assert.rejects(service.present('owner', session.sessionId, presented({ ...session, revision: 4 }, { strategy: 'visual' })), error => error.getStatus() === 409);
});

test('remediation rotates strategies and stops with a permitted review suggestion after three failed checks — never mastery or escalation', async () => {
  const { f, service } = memory();
  const session = await service.start('owner', startCommand());
  const attempts = [['worked_example', false], ['analogy', false], ['practice', true]];
  let revision = 0, failures = 0;
  for (const [strategy, stop] of attempts) {
    await service.present('owner', session.sessionId, presented({ ...session, revision }, { strategy }));
    revision += 1;
    const result = await service.assess('owner', session.sessionId, answered({ ...session, revision }, { selection: 1 }));
    failures += 1; revision = result.revision;
    assert.equal(result.failedChecks, failures);
    assert.equal(result.receipt.passed, false);
    if (stop) { assert.equal(result.phase, 'review_suggested'); assert.equal(result.reviewSuggested, true); assert.equal(result.checkPassed, false); }
    else assert.equal(result.phase, 'explain');
    if (!stop) await assert.rejects(service.present('owner', session.sessionId, presented({ ...session, revision }, { strategy })),
      error => error.getStatus() === 409);
  }
  assert.equal(revision, 6);
  await assert.rejects(service.present('owner', session.sessionId, presented({ ...session, revision }, { strategy: 'visual' })), error => error.getStatus() === 409);
  await assert.rejects(service.assess('owner', session.sessionId, answered({ ...session, revision }, { selection: 0 })), error => error.getStatus() === 409);
  const read = await service.get('owner', session.sessionId);
  assert.equal(read.phase, 'review_suggested'); assert.equal(read.failedChecks, 3); assert.equal(read.checkPassed, false);
  assert.doesNotMatch(JSON.stringify(read), /master|taught|teacher|escalat|notif/i);
  assert.equal([...f.rows.keys()].filter(key => /escalat|teacher|notif/i.test(key)).length, 0);
});

test('two devices resume one bounded session while stale commands and other accounts are denied without a row', async () => {
  const f = billingMemory();
  const a = new LearningService({ getDatabase: () => f.db }), b = new LearningService({ getDatabase: () => f.db });
  const session = await a.start('owner', startCommand());
  const view = await b.get('owner', session.sessionId);
  assert.equal(view.revision, 0);
  const first = await b.present('owner', session.sessionId, presented(view, { strategy: 'analogy' }));
  assert.equal(first.revision, 1);
  await assert.rejects(a.present('owner', session.sessionId, presented(view)), error => error.getStatus() === 409);
  const fresh = await a.get('owner', session.sessionId);
  assert.equal(fresh.revision, 1); assert.equal(fresh.check.checkId, 'fractions-check-1');
  const assessed = await a.assess('owner', session.sessionId, answered({ ...session, revision: 1 }));
  assert.equal(assessed.phase, 'check_passed');
  await assert.rejects(b.assess('owner', session.sessionId, answered({ ...session, revision: 1 })), error => error.getStatus() === 409);
  assert.equal((await b.get('owner', session.sessionId)).phase, 'check_passed');
  await assert.rejects(b.get('other', session.sessionId), error => error.getStatus() === 404);
  await assert.rejects(b.present('other', session.sessionId, presented(fresh)), error => error.getStatus() === 404);
  await assert.rejects(b.assess('other', session.sessionId, answered({ ...session, revision: 1 })), error => error.getStatus() === 404);
  assert.equal([...f.rows.keys()].filter(key => key.startsWith('visionary_accounts/other/')).length, 0);
});

test('lost commit responses recover with the same server assessment and outages stay private', async () => {
  const { f, service } = memory();
  const session = await service.start('owner', startCommand());
  await service.present('owner', session.sessionId, presented(session));
  const wrong = answered({ ...session, revision: 1 }, { selection: 1 });
  const original = f.db.runTransaction.bind(f.db); let lost = false;
  f.db.runTransaction = async action => { const result = await original(action); if (!lost) { lost = true; throw Error('Internal credentials must not escape'); } return result; };
  await assert.rejects(service.assess('owner', session.sessionId, wrong), error => error.getStatus() === 503 && !error.message.includes('credentials'));
  const recovered = await service.assess('owner', session.sessionId, wrong);
  assert.equal(recovered.receipt.passed, false); assert.equal(recovered.phase, 'explain');
  assert.equal([...f.rows.keys()].filter(key => key.includes('/assessments/')).length, 1);
  const broken = new LearningService({ getDatabase: () => ({ collection: () => ({ orderBy: () => ({ get: async () => { throw Error('Private database detail'); } }),
    doc: () => ({ get: async () => { throw Error('Private database detail'); }, collection: () => ({ doc: () => ({}) }) }) }) }) });
  await assert.rejects(broken.get('owner', session.sessionId), error => error.getStatus() === 503 && !error.message.includes('Private database detail'));
});

test('cancellation is revision-checked, preserves recorded evidence and refuses further commands', async () => {
  const { f, service } = memory();
  const session = await service.start('owner', startCommand());
  await service.present('owner', session.sessionId, presented(session));
  await service.assess('owner', session.sessionId, answered({ ...session, revision: 1 }, { selection: 1 }));
  const input = cancelled({ ...session, revision: 2 });
  const closed = await service.cancel('owner', session.sessionId, input);
  assert.equal(closed.status, 'cancelled'); assert.ok(closed.cancelledAt); assert.equal(closed.failedChecks, 1);
  assert.deepEqual(await service.cancel('owner', session.sessionId, input), closed);
  await assert.rejects(service.present('owner', session.sessionId, presented({ ...session, revision: 2 }, { strategy: 'analogy' })), error => error.getStatus() === 409);
  await assert.rejects(service.assess('owner', session.sessionId, answered({ ...session, revision: 2 }, { selection: 0 })), error => error.getStatus() === 409);
  await assert.rejects(service.cancel('owner', session.sessionId, cancelled({ ...session, revision: 0 })), error => error.getStatus() === 409);
  const read = await service.get('owner', session.sessionId);
  assert.equal(read.status, 'cancelled'); assert.equal(read.failedChecks, 1);
  assert.equal([...f.rows.keys()].filter(key => key.includes('/assessments/')).length, 1);
});

test('owner listing is bounded, filterable and isolated per account with no key or context exposure', async () => {
  const { f, service } = memory();
  const one = await service.start('owner', startCommand());
  const two = await service.start('owner', startCommand({ workspaceId: 'demo-adult:classroom' }));
  await service.start('other', startCommand());
  const all = await service.list('owner', {});
  assert.equal(all.items.length, 2); assert.equal(all.nextCursor, null);
  assert.deepEqual(all.items.map(item => item.sessionId).sort(), [one.sessionId, two.sessionId].sort());
  const first = await service.list('owner', { limit: 1 });
  assert.equal(first.items.length, 1); assert.ok(first.nextCursor);
  const second = await service.list('owner', { limit: 1, after: first.nextCursor });
  assert.equal(second.items.length, 1); assert.equal(second.nextCursor, null);
  const filtered = await service.list('owner', { workspaceId: 'demo-adult:classroom' });
  assert.equal(filtered.items.length, 1); assert.equal(filtered.items[0].sessionId, two.sessionId);
  const otherList = await service.list('other', {});
  assert.equal(otherList.items.length, 1); assert.equal(otherList.items[0].uid, 'other');
  assert.doesNotMatch(JSON.stringify(all), /answerIndex|"master|taught|teacherContact|escalat|"email|"cookie|"device|fingerprint/);
});

test('learning HTTP enforces session, CSRF, expected account and bounds, and never exposes the key', async () => {
  const f = billingMemory();
  const auth = { getDatabase: () => f.db, authenticate: async cookie => { if (!['owner', 'other'].includes(cookie)) throw new UnauthorizedException(); return { uid: cookie }; } };
  class FixtureModule {}
  Module({ controllers: [LearningController], providers: [LearningService, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const url = (await app.getUrl()) + '/api/account/learning/sessions', token = 'a'.repeat(64);
    const headers = { Cookie: `visionary-session=owner; visionary-device=device; visionary-csrf=${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': token, 'X-Visionary-Account': 'owner', 'Content-Type': 'application/json' };
    const post = (suffix, body, custom = headers) => fetch(url + suffix, { method: 'POST', headers: custom, body: JSON.stringify(body) });
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await post('', startCommand(), { ...headers, Origin: 'https://attacker.test' })).status, 403);
    assert.equal((await post('', startCommand(), { ...headers, 'X-CSRF-Token': '' })).status, 403);
    assert.equal((await post('', startCommand(), { ...headers, Cookie: headers.Cookie.replace('session=owner', 'session=revoked') })).status, 401);
    assert.equal((await post('', startCommand(), { ...headers, 'X-Visionary-Account': 'other' })).status, 409);
    assert.equal((await post('', startCommand({ uid: 'other' }))).status, 400);
    assert.equal(f.rows.size, 0);
    const created = await post('', startCommand()); assert.equal(created.status, 201);
    const session = await created.json(); assert.equal(session.uid, 'owner'); assert.equal(session.status, 'active');
    assert.doesNotMatch(JSON.stringify(session), /answerIndex|master|teacher|email|cookie|device|fingerprint/);
    const sessionPath = '/' + session.sessionId;
    const view = await (await fetch(url + sessionPath, { headers })).json();
    assert.equal(view.sessionId, session.sessionId); assert.equal(view.revision, 0);
    const checkFields = { version: 1, commandId: randomUUID(), expectedRevision: view.revision, workspaceId: view.workspaceId,
      sourceVersion: view.concept.sourceVersion, criteriaVersion: view.concept.criteriaVersion, strategy: 'worked_example', validation: 'passed',
      checkId: 'fractions-check-1', prompt: 'Which fraction equals one half?', options: ['2/4', '2/3', '3/4'], answerIndex: 0 };
    assert.equal((await post(sessionPath + '/checks', checkFields, { ...headers, 'X-CSRF-Token': '' })).status, 403);
    const presentedResponse = await post(sessionPath + '/checks', checkFields); assert.equal(presentedResponse.status, 201);
    const presentedReceipt = await presentedResponse.json(); assert.equal(presentedReceipt.phase, 'check'); assert.equal(presentedReceipt.revision, 1);
    assert.doesNotMatch(JSON.stringify(presentedReceipt), /answerIndex|Which fraction|prompt/);
    const answerFields = { version: 1, commandId: randomUUID(), expectedRevision: presentedReceipt.revision, workspaceId: view.workspaceId,
      sourceVersion: view.concept.sourceVersion, criteriaVersion: view.concept.criteriaVersion, checkId: 'fractions-check-1', selection: 1 };
    const failedResponse = await post(sessionPath + '/assessments', answerFields); assert.equal(failedResponse.status, 201);
    const failed = await failedResponse.json(); assert.equal(failed.receipt.passed, false); assert.equal(failed.phase, 'explain');
    assert.equal((await post(sessionPath + '/assessments', { ...answerFields, passed: true })).status, 400);
    assert.equal((await post(sessionPath + '/assessments', { ...answerFields, commandId: randomUUID(), selection: 9 })).status, 400);
    assert.equal((await post(sessionPath + '/assessments', { ...answerFields, commandId: randomUUID(), workspaceId: 'other:student' })).status, 409);
    assert.equal((await post(sessionPath + '/assessments', { ...answerFields, commandId: randomUUID(), expectedRevision: 0 })).status, 409);
    assert.equal((await post(sessionPath + '/cancel', { version: 1, commandId: randomUUID(), expectedRevision: failed.revision,
      workspaceId: view.workspaceId, sourceVersion: view.concept.sourceVersion, criteriaVersion: view.concept.criteriaVersion })).status, 201);
    const closed = await (await fetch(url + sessionPath, { headers })).json();
    assert.equal(closed.status, 'cancelled'); assert.equal(closed.failedChecks, 1);
    assert.match(JSON.stringify([session, presentedReceipt, failed, closed]), /"concept":\{"conceptId"/);
    assert.doesNotMatch(JSON.stringify([session, presentedReceipt, failed, closed]), /answerIndex|master|taught|teacher|email|cookie|device|fingerprint/);
    for (const query of ['?limit=1000', '?after=..%2Fother', '?limit=0', '?workspaceId=' + 'a'.repeat(129)]) assert.equal((await fetch(url + query, { headers })).status, 400);
    const listed = await (await fetch(url + '?limit=2&workspaceId=' + encodeURIComponent(view.workspaceId), { headers })).json();
    assert.equal(listed.items.length, 1); assert.equal(listed.items[0].sessionId, session.sessionId);
    assert.equal((await fetch(url + '/not-a-uuid', { headers })).status, 400);
    assert.equal((await fetch(url + '/' + randomUUID(), { headers })).status, 404);
    const otherHeaders = { ...headers, Cookie: headers.Cookie.replace('session=owner', 'session=other'), 'X-Visionary-Account': 'other' };
    assert.equal((await fetch(url, { headers: otherHeaders })).status, 200);
    assert.equal((await (await fetch(url, { headers: otherHeaders })).json()).items.length, 0);
    assert.equal((await fetch(url + sessionPath, { headers: otherHeaders })).status, 404);
    f.db.runTransaction = async () => { throw Error('Private database detail'); };
    const failure = await post('', startCommand()); assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /Private database detail/);
  } finally { await app.close(); }
});
