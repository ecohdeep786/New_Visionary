const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../../../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException } = req('@nestjs/common');
const { ConfigService } = req('@nestjs/config');
const { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { LearningController } = req('./dist/src/learning/learning.controller.js');
const { LearningService } = req('./dist/src/learning/learning.service.js');
const { billingMemory } = require('../../fixtures/billing-memory.cjs');
const { runtimeScope, runtimeCases } = require('./scope-06-cases.mjs');

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const snapshot = f => JSON.stringify([...f.rows]);
const assessmentRows = f => [...f.rows].filter(([key]) => key.includes('/assessments/'));
const command = fields => ({ version: 1, commandId: randomUUID(), ...fields });
async function fixture(c = runtimeCases[0]) {
  const f = billingMemory(), authority = { current: c.sessionCurrent, checks: 0, late: null };
  const accounts = {
    getDatabase: () => f.db,
    authenticate: async cookie => {
      authority.checks++;
      if (cookie === 'late') {
        assert.ok(authority.late, 'late request must enter the controlled authentication boundary');
        authority.late.entered.resolve();
        await authority.late.release.promise;
      } else if (cookie !== 'actor') throw new UnauthorizedException();
      if (!authority.current) throw new UnauthorizedException();
      return { uid: c.actorUid };
    },
  };
  class FixtureModule {}
  // Explicit get avoids inheriting ignored local Firebase/origin configuration.
  const config = { get: key => key === 'AUTH_PUBLIC_ORIGIN' ? 'http://localhost:5173' : undefined };
  Module({ controllers: [LearningController], providers: [LearningService,
    { provide: FirebaseProductService, useValue: accounts }, { provide: ConfigService, useValue: config }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false });
  app.use(req('cookie-parser')());
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  const service = app.get(LearningService);
  // Trusted seed is independent of request actor, workspace and revision.
  const { ownerUid, ...startScope } = runtimeScope;
  const started = await service.start(ownerUid, command(startScope));
  const session = await service.present(runtimeScope.ownerUid, started.sessionId, command({
    expectedRevision: started.revision, workspaceId: runtimeScope.workspaceId,
    sourceVersion: runtimeScope.sourceVersion, criteriaVersion: runtimeScope.criteriaVersion,
    strategy: 'worked_example', validation: 'passed', checkId: 'fractions-check-1',
    prompt: 'Which fraction equals one half?', options: ['2/4', '2/3'], answerIndex: 0,
  }));
  const csrf = 'a'.repeat(64), base = (await app.getUrl()) + '/api/account/learning/sessions/' + session.sessionId;
  const headers = { Cookie: `visionary-session=actor; visionary-device=device; visionary-csrf=${csrf}`,
    Origin: 'http://localhost:5173', 'X-CSRF-Token': csrf, 'X-Visionary-Account': c.actorUid, 'Content-Type': 'application/json' };
  const post = (suffix, input, custom = {}) => fetch(base + suffix, { method: 'POST', headers: { ...headers, ...custom }, body: JSON.stringify(input), signal: AbortSignal.timeout(5000) });
  const answer = overrides => command({ expectedRevision: c.expectedRevision, workspaceId: c.workspaceId,
    sourceVersion: runtimeScope.sourceVersion, criteriaVersion: runtimeScope.criteriaVersion,
    checkId: 'fractions-check-1', selection: c.selection, ...overrides });
  const cancel = overrides => command({ expectedRevision: session.revision, workspaceId: runtimeScope.workspaceId,
    sourceVersion: runtimeScope.sourceVersion, criteriaVersion: runtimeScope.criteriaVersion, ...overrides });
  return { f, app, service, session, authority, headers, post, answer, cancel };
}

for (const c of runtimeCases) test(`HTTP assessment: ${c.id}`, async () => {
  const h = await fixture(c);
  try {
    const before = snapshot(h.f), input = h.answer();
    const response = await h.post('/assessments', input);
    assert.equal(response.status, c.status);
    assert.equal(h.authority.checks, 1);
    if (c.status !== 201) {
      assert.equal(snapshot(h.f), before, 'denied/stale/revoked commands preserve every owning-store row');
    } else {
      const result = await response.json();
      assert.equal(result.uid, runtimeScope.ownerUid);
      assert.equal(result.receipt.passed, true);
      assert.equal(result.phase, 'check_passed');
      assert.equal(assessmentRows(h.f).length, 1);
      assert.equal(assessmentRows(h.f)[0][1].receiptId, input.commandId);
      assert.doesNotMatch(JSON.stringify(result), /answerIndex|prompt|cookie|device/);
    }
  } finally { await h.app.close(); }
});

test('HTTP identical receipt replay reauthenticates and revoked replay cannot read or change the stored result', async () => {
  const h = await fixture();
  try {
    const input = h.answer(), committed = await h.post('/assessments', input);
    assert.equal(committed.status, 201);
    const receipt = await committed.json(), before = snapshot(h.f);
    const replay = await h.post('/assessments', input);
    assert.equal(replay.status, 201);
    assert.deepEqual(await replay.json(), receipt);
    assert.equal(snapshot(h.f), before);
    assert.equal(h.authority.checks, 2);
    h.authority.current = false;
    const revoked = await h.post('/assessments', input);
    assert.equal(revoked.status, 401);
    assert.equal(h.authority.checks, 3);
    assert.equal(snapshot(h.f), before);
    assert.equal(assessmentRows(h.f).length, 1);
  } finally { await h.app.close(); }
});

test('HTTP changed-payload replay conflicts and retains the actual first assessment as recovery', async () => {
  const h = await fixture();
  try {
    const input = h.answer(), first = await h.post('/assessments', input);
    assert.equal(first.status, 201);
    const receipt = await first.json(), before = snapshot(h.f);
    assert.equal((await h.post('/assessments', { ...input, selection: 1 })).status, 409);
    assert.equal(snapshot(h.f), before);
    const replay = await h.post('/assessments', input);
    assert.deepEqual(await replay.json(), receipt);
    assert.equal(assessmentRows(h.f).length, 1);
  } finally { await h.app.close(); }
});

test('HTTP cancellation commits terminal state, deduplicates retry and denies a later assessment', async () => {
  const h = await fixture();
  try {
    const input = h.cancel(), result = await h.post('/cancel', input);
    assert.equal(result.status, 201);
    const receipt = await result.json();
    assert.equal(receipt.status, 'cancelled');
    assert.ok(receipt.cancelledAt);
    assert.equal(receipt.checkPassed, false);
    const before = snapshot(h.f);
    assert.deepEqual(await (await h.post('/cancel', input)).json(), receipt);
    assert.equal((await h.post('/assessments', h.answer())).status, 409);
    assert.equal(snapshot(h.f), before);
    assert.equal(assessmentRows(h.f).length, 0);
    assert.equal((await h.service.get(runtimeScope.ownerUid, h.session.sessionId)).status, 'cancelled');
  } finally { await h.app.close(); }
});

test('an in-flight HTTP assessment admitted after cancellation cannot append evidence or reopen the session', async () => {
  const h = await fixture();
  let lateRequest;
  try {
    h.authority.late = { entered: deferred(), release: deferred() };
    lateRequest = h.post('/assessments', h.answer(), { Cookie: h.headers.Cookie.replace('session=actor', 'session=late') });
    await Promise.race([h.authority.late.entered.promise, new Promise((_, reject) => {
      setTimeout(() => reject(Error('The request did not enter the suspended authentication boundary.')), 2000).unref();
    })]);
    const cancelled = await h.post('/cancel', h.cancel());
    assert.equal(cancelled.status, 201);
    assert.equal((await cancelled.json()).status, 'cancelled');
    const before = snapshot(h.f);
    h.authority.late.release.resolve();
    assert.equal((await lateRequest).status, 409);
    assert.equal(snapshot(h.f), before);
    assert.equal(assessmentRows(h.f).length, 0);
  } finally {
    h.authority.late?.release.resolve();
    if (lateRequest) await lateRequest;
    await h.app.close();
  }
});

test('stale cancellation preserves work and succeeds only after reading the current saved revision', async () => {
  const h = await fixture();
  try {
    const before = snapshot(h.f);
    assert.equal((await h.post('/cancel', h.cancel({ expectedRevision: 0 }))).status, 409);
    assert.equal(snapshot(h.f), before);
    const saved = await h.service.get(runtimeScope.ownerUid, h.session.sessionId);
    assert.equal((await h.post('/cancel', h.cancel({ expectedRevision: saved.revision }))).status, 201);
    assert.equal(assessmentRows(h.f).length, 0);
  } finally { await h.app.close(); }
});

test('real HTTP source mismatch, forged score and account-switch requests cannot change owning-store state', async () => {
  const h = await fixture();
  try {
    const before = snapshot(h.f);
    assert.equal((await h.post('/assessments', h.answer({ sourceVersion: 'withdrawn-or-other-version' }))).status, 409);
    assert.equal((await h.post('/assessments', { ...h.answer(), passed: true })).status, 400);
    assert.equal((await h.post('/assessments', h.answer(), { 'X-Visionary-Account': 'another-account' })).status, 409);
    assert.equal(snapshot(h.f), before);
  } finally { await h.app.close(); }
});

test('lost HTTP commit response recovers one actual assessment on retry without exposing storage error details', async () => {
  const h = await fixture();
  try {
    const run = h.f.db.runTransaction.bind(h.f.db);
    let loseResponse = true;
    h.f.db.runTransaction = async action => {
      const result = await run(action);
      if (loseResponse) { loseResponse = false; throw Error('SYNTHETIC_PRIVATE_STORAGE_DETAIL'); }
      return result;
    };
    const input = h.answer(), lost = await h.post('/assessments', input);
    assert.equal(lost.status, 503);
    assert.doesNotMatch(await lost.text(), /SYNTHETIC_PRIVATE_STORAGE_DETAIL/);
    assert.equal(assessmentRows(h.f).length, 1);
    const before = snapshot(h.f), recovered = await h.post('/assessments', input);
    assert.equal(recovered.status, 201);
    assert.equal((await recovered.json()).receipt.passed, true);
    assert.equal(snapshot(h.f), before);
    assert.equal(assessmentRows(h.f).length, 1);
  } finally { await h.app.close(); }
});
