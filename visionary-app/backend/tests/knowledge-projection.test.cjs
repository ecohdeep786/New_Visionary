const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module'), { randomUUID, createHash } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException, NotFoundException } = req('@nestjs/common'), { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { KnowledgeProjectionService } = req('./dist/src/learning/knowledge-projection.service.js');
const { KnowledgeProjectionController } = req('./dist/src/learning/knowledge-projection.controller.js');
const { knowledgeProjectionCommand } = req('./dist/src/learning/knowledge-command.js');
const { selectCalibratedModel, requireModelVersion } = req('./dist/src/learning/knowledge-calibration.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');

const uuid = () => randomUUID();
const command = (overrides = {}) => ({ version: 1, commandId: uuid(), sessionId: uuid(), receiptId: uuid(), ...overrides });
const account = uid => `visionary_accounts/${uid}`;
const assessmentPath = (uid, sessionId, receiptId) => `${account(uid)}/learningSessions/${sessionId}/assessments/${receiptId}`;
const knowledgeKeys = (m, part) => [...m.rows.keys()].filter(key => key.includes(part));

// Seed the durable store exactly as the LEARN-10 teaching loop writes it: one
// owner session with one immutable server assessment. The projection service
// consumes this record; a browser verdict is never an input.
const seed = (m, uid, { passed = true, status = 'active', at = '2026-10-18T06:00:00.000Z', fields = {} } = {}) => {
  const sessionId = uuid(), receiptId = uuid();
  const values = { workspaceId: 'demo-adult:student', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2', ...fields };
  const digest = createHash('sha256').update([uid, sessionId, receiptId, JSON.stringify(values)].join('|')).digest('hex');
  m.rows.set(`${account(uid)}/learningSessions/${sessionId}`, { schemaVersion: 1, uid, sessionId, workspaceId: values.workspaceId, status,
    concept: { conceptId: values.conceptId, provider: 'visionary-authored', sourceId: 'doc03-squares', sourceVersion: values.sourceVersion, criteriaVersion: values.criteriaVersion },
    createdAt: at, updatedAt: at, check: null,
    loop: { uid, sessionId, revision: 2, phase: passed ? 'check_passed' : 'explain', failedChecks: passed ? 0 : 1, maxFailedChecks: 3,
      previousStrategy: 'practice', checkId: uuid(), lastReceiptId: receiptId, lastReceiptDigest: digest } });
  m.rows.set(assessmentPath(uid, sessionId, receiptId), { uid, sessionId, checkId: uuid(), strategy: 'practice', receiptId, digest, passed, at });
  return { sessionId, receiptId, digest, values };
};

test('projection commands reference one server-assessed receipt and reject injected identity, verdict or verdict-adjacent fields', () => {
  const body = command(), good = knowledgeProjectionCommand(body);
  assert.deepEqual(good, body);
  for (const field of ['uid', 'workspaceId', 'correct', 'passed', 'assessedAt', 'digest', 'origin', 'sequence'])
    assert.equal(good[field], undefined, `commands must not carry ${field}`);
  const invalid = [
    null, [], { ...body, uid: 'shadow' }, { ...body, correct: true }, { ...body, passed: true }, { ...body, assessedAt: 1700000000000 },
    { ...body, workspaceId: 'personal' }, { ...body, digest: 'x' }, { ...body, origin: 'server_assessment' }, { ...body, schemaVersion: 2 },
    { ...body, version: 2 }, { ...body, commandId: '../escape' }, { ...body, sessionId: 'not-a-uuid' }, { ...body, receiptId: 'nope' },
  ];
  for (const input of invalid) assert.throws(() => knowledgeProjectionCommand(input), e => e.getStatus() === 400);
});

test('calibrated parameters are selected by source/criteria scope and a model change requires replay', () => {
  const selected = selectCalibratedModel({ sourceVersion: 'a2', criteriaVersion: 'rubric-a2' });
  assert.equal(selected.version, 'a2-calib-v1'); assert.equal(selected.license, 'reference'); assert.equal(selected.initial, 0.35);
  const reference = selectCalibratedModel({ sourceVersion: 'ncb-v1', criteriaVersion: 'rubric-any' });
  assert.equal(reference.version, 'doc03-reference-calib-v1');
  assert.equal(reference.mastered, undefined); assert.equal(reference.pKnown, undefined);
  assert.throws(() => selectCalibratedModel({ sourceVersion: '', criteriaVersion: 'rubric-a2' }), e => e.code === 'invalid');
  assert.equal(requireModelVersion({ sourceVersion: 'a2', criteriaVersion: 'rubric-a2' }, 'a2-calib-v1').version, 'a2-calib-v1');
  assert.throws(() => requireModelVersion({ sourceVersion: 'a2', criteriaVersion: 'rubric-a2' }, 'a2-calib-v0'), e => e.code === 'rebuild_required');
});

test('a server-assessed pass projects a calibrated estimate from the stored verdict, digest and timestamp', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const s = seed(m, 'owner'), body = command({ sessionId: s.sessionId, receiptId: s.receiptId });
  const first = await service.project('owner', body);
  assert.equal(first.replay, false); assert.equal(first.uid, 'owner'); assert.equal(first.workspaceId, 'demo-adult:student');
  assert.equal(first.modelVersion, 'a2-calib-v1'); assert.equal(first.revision, 1); assert.equal(first.lastSequence, 1);
  assert.equal(first.assessedCount, 1); assert.equal(first.lastReceiptId, s.receiptId); assert.equal(first.lastReceiptDigest, s.digest);
  assert.equal(Math.abs(first.pKnown - 0.7149122807017544) < 1e-9, true, 'hand-computed BKT posterior plus transit');
  const receipt = m.rows.get(`${account('owner')}/knowledgeReceipts/${s.receiptId}`);
  assert.equal(receipt.correct, true); assert.equal(receipt.origin, 'server_assessment'); assert.equal(receipt.sequence, 1);
  assert.equal(receipt.assessedAt, Date.parse('2026-10-18T06:00:00.000Z')); assert.equal(receipt.digest, s.digest);
  assert.equal(receipt.selection, undefined); assert.equal(receipt.answerIndex, undefined);
  assert.equal(m.rows.get(`${account('owner')}/knowledgeCommands/${body.commandId}`).kind, 'knowledge-projected');
  const [outboxKey] = knowledgeKeys(m, '/knowledgeOutbox/');
  assert.equal(m.rows.get(outboxKey).event, 'knowledge_projected'); assert.equal(m.rows.get(outboxKey).receiptId, s.receiptId);
  assert.equal(m.rows.get(outboxKey).sequence, 1);
});

test('foreign, missing and tampered evidence is refused without inventing projection records', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const foreign = seed(m, 'other');
  await assert.rejects(service.project('owner', command({ sessionId: foreign.sessionId, receiptId: foreign.receiptId })), e => e instanceof NotFoundException);
  const own = seed(m, 'owner');
  await assert.rejects(service.project('owner', command({ sessionId: own.sessionId, receiptId: uuid() })), e => e instanceof NotFoundException);
  const tampered = seed(m, 'owner');
  m.rows.set(assessmentPath('owner', tampered.sessionId, tampered.receiptId), { ...m.rows.get(assessmentPath('owner', tampered.sessionId, tampered.receiptId)), passed: 'yes' });
  await assert.rejects(service.project('owner', command({ sessionId: tampered.sessionId, receiptId: tampered.receiptId })), e => e.getStatus() === 503 && !e.message.includes('yes'));
  const copied = seed(m, 'owner');
  m.rows.set(`${account('owner')}/learningSessions/${copied.sessionId}`, { ...m.rows.get(`${account('owner')}/learningSessions/${copied.sessionId}`), uid: 'other' });
  await assert.rejects(service.project('owner', command({ sessionId: copied.sessionId, receiptId: copied.receiptId })), e => e.getStatus() === 503);
  assert.equal(knowledgeKeys(m, '/knowledge').length, 0);
});

test('identical commands and already-projected evidence replay; altered commands conflict; concurrent retries commit exactly once', async () => {
  const m = billingMemory(), a = new KnowledgeProjectionService({ getDatabase: () => m.db }), b = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const one = seed(m, 'owner'), body = command({ sessionId: one.sessionId, receiptId: one.receiptId });
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, n) => (n % 2 ? a : b).project('owner', body)));
  for (const row of results) assert.equal(row.status, 'fulfilled');
  const winner = results.find(row => row.value.replay === false);
  assert.ok(winner, 'exactly one concurrent submission is the original commit');
  for (const row of results) assert.deepEqual({ ...row.value, replay: false }, { ...winner.value, replay: false });
  assert.equal(results.filter(row => row.value.replay).length, results.length - 1);
  assert.equal(knowledgeKeys(m, '/knowledge').length, 4); // one command, receipt, projection and outbox event
  await assert.rejects(a.project('owner', { ...body, receiptId: uuid() }), e => e.getStatus() === 409);
  const before = await a.projection('owner', { workspaceId: 'demo-adult:student', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' });
  const again = await b.project('owner', command({ sessionId: one.sessionId, receiptId: one.receiptId }));
  assert.equal(again.replay, true); assert.equal(again.lastSequence, before.lastSequence);
  assert.equal(again.pKnown, before.pKnown); assert.equal(again.assessedCount, 1);
  assert.equal(knowledgeKeys(m, '/knowledgeOutbox/').length, 1);
  // Evidence from a session that was later cancelled still counts once: cancel voids the open check, not assessed evidence.
  const two = seed(m, 'owner', { passed: false, status: 'cancelled' });
  const failed = await a.project('owner', command({ sessionId: two.sessionId, receiptId: two.receiptId }));
  assert.equal(failed.lastSequence, 2); assert.equal(failed.assessedCount, 2); assert.equal(failed.pKnown < before.pKnown, true);
  const replayedOne = await b.project('owner', command({ sessionId: one.sessionId, receiptId: one.receiptId }));
  assert.equal(replayedOne.replay, true); assert.equal(replayedOne.lastSequence, 2); assert.equal(replayedOne.assessedCount, 2);
});

test('a lost commit response maps to a redacted outage and the same command replays the committed evidence', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const s = seed(m, 'owner'), body = command({ sessionId: s.sessionId, receiptId: s.receiptId });
  const runTransaction = m.db.runTransaction.bind(m.db); let lost = false;
  m.db.runTransaction = async action => { const result = await runTransaction(action); if (!lost) { lost = true; throw Error('Internal credentials must not escape'); } return result; };
  await assert.rejects(service.project('owner', body), e => e.getStatus() === 503 && !e.message.includes('credentials'));
  const retried = await service.project('owner', body);
  assert.equal(retried.replay, true); assert.equal(retried.lastSequence, 1); assert.equal(retried.lastReceiptId, s.receiptId);
  assert.equal(knowledgeKeys(m, '/knowledgeReceipts/').length, 1);
});

test('cross-device reads share one owner projection; a stored model change refuses silent inheritance until replay', async () => {
  const m = billingMemory(), a = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const s = seed(m, 'owner');
  await a.project('owner', command({ sessionId: s.sessionId, receiptId: s.receiptId }));
  const b = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const seen = await b.projection('owner', { workspaceId: 'demo-adult:student', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' });
  assert.equal(seen.uid, 'owner'); assert.equal(seen.modelVersion, 'a2-calib-v1'); assert.equal(seen.lastReceiptId, s.receiptId);
  assert.equal(seen.lastReceiptDigest, s.digest); assert.equal(seen.assessedCount, 1);
  await assert.rejects(b.projection('owner', { workspaceId: 'demo-adult:student', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-missing' }), e => e instanceof NotFoundException);
  await assert.rejects(b.projection('other', { workspaceId: 'demo-adult:student', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' }), e => e instanceof NotFoundException);
  const [projectionRow] = knowledgeKeys(m, '/knowledgeProjections/');
  m.rows.set(projectionRow, { ...m.rows.get(projectionRow), modelVersion: 'a2-calib-v0' });
  const next = seed(m, 'owner');
  await assert.rejects(a.project('owner', command({ sessionId: next.sessionId, receiptId: next.receiptId })), e => e.getStatus() === 409 && /model/i.test(e.message));
  assert.equal(knowledgeKeys(m, '/knowledgeReceipts/').length, 1);
});

test('knowledge HTTP enforces session, CSRF, expected UID and owner-scoped reads without exposing security or verdict fields', async () => {
  const m = billingMemory(), owner = seed(m, 'owner'), other = seed(m, 'other');
  const auth = { getDatabase: () => m.db, authenticate: async cookie => { if (!['owner', 'other'].includes(cookie)) throw new UnauthorizedException(); return { uid: cookie }; } };
  class FixtureModule {}
  Module({ controllers: [KnowledgeProjectionController], providers: [KnowledgeProjectionService, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173', NODE_ENV: 'development' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const base = (await app.getUrl()) + '/api/account/learning/knowledge', token = 'a'.repeat(64);
    const headers = { Cookie: `visionary-session=owner; visionary-device=device; visionary-csrf=${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': token, 'X-Visionary-Account': 'owner', 'Content-Type': 'application/json' };
    const body = command({ sessionId: owner.sessionId, receiptId: owner.receiptId });
    const post = (payload, extra = {}) => fetch(`${base}/project`, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(payload) });
    assert.equal((await fetch(`${base}/project`, { method: 'POST', body: JSON.stringify(body) })).status, 403); // CSRF before authority
    assert.equal((await post(body, { 'X-Visionary-Account': 'other' })).status, 409); // signed-in account changed
    assert.equal((await post({ ...body, passed: true })).status, 400); // a client verdict is never a command field
    assert.equal((await post({ ...body, receiptId: other.receiptId })).status, 404); // another account's receipt is not visible
    assert.equal((await post(body)).status, 200);
    assert.equal((await post(body)).status, 200); // identical command replays
    const read = await fetch(`${base}/projections?workspaceId=demo-adult%3Astudent&conceptId=squares&sourceVersion=a2&criteriaVersion=rubric-a2`, { headers });
    assert.equal(read.status, 200);
    const projection = await read.json();
    assert.equal(projection.uid, 'owner'); assert.equal(projection.replay, false);
    assert.equal(JSON.stringify(projection).includes('visionary'), false);
    assert.equal((await fetch(`${base}/projections?workspaceId=demo-adult%3Astudent&conceptId=squares&sourceVersion=a2&criteriaVersion=rubric-missing`, { headers })).status, 404);
    const models = await (await fetch(`${base}/models?sourceVersion=a2&criteriaVersion=rubric-a2`, { headers })).json();
    assert.equal(models.model.version, 'a2-calib-v1'); assert.equal(models.model.mastered, undefined); assert.equal(models.model.pKnown, undefined);
  } finally { await app.close(); }
});


test('installed Firestore SDK accepts every constructed knowledge reference and the fixture rejects invalid path parity', async () => {
  const { Firestore } = req('firebase-admin/firestore');
  const sdk = new Firestore({ projectId: 'demo-knowledge-path-validation' });
  const m = billingMemory(), original = m.db.collection;
  assert.throws(() => original('visionary_accounts/owner/knowledge/commands'), /collection path/);
  assert.throws(() => original('visionary_accounts').doc('owner/odd'), /document path/);
  const collections = new Set();
  m.db.collection = name => { sdk.collection(name); collections.add(name); return original(name); };
  const service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const one = seed(m, 'owner'), body = command({ sessionId: one.sessionId, receiptId: one.receiptId });
  const result = await service.project('owner', body);
  assert.equal(result.assessedCount, 1);
  await service.project('owner', body);
  const read = await service.projection('owner', one.values);
  assert.equal(read.lastReceiptId, one.receiptId);
  for (const row of m.rows.keys()) sdk.doc(row);
  for (const name of ['knowledgeCommands', 'knowledgeReceipts', 'knowledgeProjections', 'knowledgeOutbox'])
    assert.ok(collections.has(`visionary_accounts/owner/${name}`));
  await sdk.terminate(); // No SDK read/write, credential or network operation was made.
});

test('opaque delimiter-containing scope tuples have independent projections and every read/replay rejects corrupted scope', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const a = seed(m, 'owner', { fields: { workspaceId: 'workspace|concept', conceptId: 'one' } });
  const b = seed(m, 'owner', { passed: false, fields: { workspaceId: 'workspace', conceptId: 'concept|one' } });
  const ac = command({ sessionId: a.sessionId, receiptId: a.receiptId });
  const ar = await service.project('owner', ac);
  await assert.rejects(service.projection('owner', b.values), e => e.getStatus() === 404);
  const br = await service.project('owner', command({ sessionId: b.sessionId, receiptId: b.receiptId }));
  assert.notEqual(ar.pKnown, br.pKnown);
  assert.equal(knowledgeKeys(m, '/knowledgeProjections/').length, 2);
  for (const x of [a, b]) {
    const current = await service.projection('owner', x.values);
    assert.equal(current.workspaceId, x.values.workspaceId); assert.equal(current.conceptId, x.values.conceptId);
    assert.equal(current.assessedCount, 1); assert.equal(current.lastReceiptId, x.receiptId);
  }
  const row = knowledgeKeys(m, '/knowledgeProjections/').find(key => m.rows.get(key).workspaceId === a.values.workspaceId);
  m.rows.set(row, { ...m.rows.get(row), workspaceId: b.values.workspaceId, conceptId: b.values.conceptId });
  const before = JSON.stringify([...m.rows]);
  await assert.rejects(service.projection('owner', a.values), e => e.getStatus() === 409);
  await assert.rejects(service.project('owner', ac), e => e.getStatus() === 409);
  await assert.rejects(service.project('owner', command({ sessionId: a.sessionId, receiptId: a.receiptId })), e => e.getStatus() === 409);
  assert.equal(JSON.stringify([...m.rows]), before);
});

test('already-projected evidence cannot replay under a different own session', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const a = seed(m, 'owner'), b = seed(m, 'owner');
  await service.project('owner', command({ sessionId: a.sessionId, receiptId: a.receiptId }));
  const before = JSON.stringify([...m.rows]);
  await assert.rejects(service.project('owner', command({ sessionId: b.sessionId, receiptId: a.receiptId })), e => e.getStatus() === 409);
  assert.equal(JSON.stringify([...m.rows]), before);
});
