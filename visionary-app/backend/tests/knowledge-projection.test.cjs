const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module'), { randomUUID } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException, NotFoundException } = req('@nestjs/common'), { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { KnowledgeProjectionService } = req('./dist/src/learning/knowledge-projection.service.js');
const { KnowledgeProjectionController } = req('./dist/src/learning/knowledge-projection.controller.js');
const { knowledgeEvidence } = req('./dist/src/learning/knowledge-command.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const evidence = (overrides = {}) => ({ version: 1, commandId: randomUUID(), workspaceId: 'personal', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2', correct: true, assessedAt: 1700000000000, ...overrides });
test('knowledgeEvidence accepts bounded server-assessed fields and rejects injected identity, context, controls or invalid schema', () => {
  const good = knowledgeEvidence(evidence());
  assert.equal(good.uid, undefined); assert.equal(good.workspaceId, 'personal'); assert.equal(good.digest, undefined); assert.equal(good.origin, undefined);
  const invalid = [
    null, [], { ...evidence(), uid: 'other' }, { ...evidence(), origin: 'server' }, { ...evidence(), schemaVersion: 2 }, { ...evidence(), version: 2 },
    { ...evidence(), commandId: '../escape' }, { ...evidence(), correct: 'yes' }, { ...evidence(), assessedAt: -1 },
    { ...evidence(), workspaceId: 'others_workspace' }, { ...evidence(), conceptId: '' }, { ...evidence(), sourceVersion: 'a'.repeat(257) }, { ...evidence(), criteriaVersion: 'x\u0000y' },
  ];
  for (const input of invalid) assert.throws(() => knowledgeEvidence(input), e => e.getStatus() === 400);
});
test('concurrent retries commit one receipt and projection; altered replay conflicts; lost commit responses recover with the same receipt', async () => {
  const m = billingMemory(), a = new KnowledgeProjectionService({ getDatabase: () => m.db }), b = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const input = evidence();
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, n) => (n % 2 ? a : b).submit('owner', input)));
  for (const row of results) assert.equal(row.status, 'fulfilled');
  const winner = results.find(row => row.value.replay === false);
  assert.ok(winner, 'exactly one concurrent submission is the original commit');
  const projectionOf = row => ({ pKnown: row.value.pKnown, revision: row.value.revision, lastSequence: row.value.lastSequence, lastReceiptId: row.value.lastReceiptId, lastReceiptDigest: row.value.lastReceiptDigest, assessedCount: row.value.assessedCount });
  for (const row of results) assert.deepEqual(projectionOf(row), projectionOf(winner));
  assert.equal(results.filter(row => row.value.replay).length, results.length - 1); // one original commit, the rest replay
  assert.equal(m.rows.size, 3); // one receipt + one projection + one outbox event
  assert.equal(winner.value.lastSequence, 1);
  // a changed receipt under the same command id cannot overwrite retained evidence
  await assert.rejects(a.submit('owner', { ...input, correct: false, assessedAt: input.assessedAt + 100 }), e => e.getStatus() === 409);
  // a lost commit response maps to 503 without exposing credentials, then the same receipt replays
  const next = evidence();
  const runTransaction = m.db.runTransaction.bind(m.db); let lost = false;
  m.db.runTransaction = async action => { const result = await runTransaction(action); if (!lost) { lost = true; throw Error('Internal credentials must not escape'); } return result; };
  await assert.rejects(b.submit('owner', next), e => e.getStatus() === 503 && !e.message.includes('credentials'));
  assert.equal((await a.submit('owner', next)).replay, true);
  assert.equal((await a.submit('owner', next)).lastSequence, 2);
});
test('cross-device: a second device submits the same receipt and reads the identical projection', async () => {
  const m = billingMemory(), input = evidence();
  const first = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const firstReceipt = await first.submit('owner', input);
  assert.equal(firstReceipt.replay, false); assert.equal(firstReceipt.pKnown > 0.4, true);
  const second = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const replay = await second.submit('owner', input);
  assert.equal(replay.replay, true);
  assert.equal(replay.pKnown, firstReceipt.pKnown); assert.equal(replay.lastSequence, firstReceipt.lastSequence);
  assert.equal(replay.lastReceiptId, firstReceipt.lastReceiptId);
});
test('durable projection read-back and outbox receipts carry the UID, never another workspace or source', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  await service.submit('owner', evidence());
  const projection = await service.projection('owner', { workspaceId: 'personal', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' });
  assert.equal(projection.uid, 'owner'); assert.equal(projection.modelVersion, 'a2-calib-v1');
  await assert.rejects(service.projection('owner', { workspaceId: 'personal', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-missing' }), e => e instanceof NotFoundException);
  await assert.rejects(service.projection('other', { workspaceId: 'personal', conceptId: 'squares', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' }), e => e instanceof NotFoundException);
});
test('models endpoint reports calibrated parameters by scope without leaking a mastery claim', async () => {
  const m = billingMemory(), service = new KnowledgeProjectionService({ getDatabase: () => m.db });
  const model = await service.model('owner', 'a2', 'rubric-a2');
  assert.equal(model.version, 'a2-calib-v1'); assert.equal(model.initial, 0.35); assert.equal(model.mastered, undefined);
  const fallback = await service.model('owner', 'ncb-v1', 'rubric-any');
  assert.equal(fallback.version, 'doc03-reference-calib-v1'); assert.equal(fallback.mastered, undefined);
});
test('knowledge HTTP enforces session, CSRF, expected UID and owner-scoped read-back without exposing security fields', async () => {
  const m = billingMemory();
  const auth = { getDatabase: () => m.db, authenticate: async cookie => { if (!['owner', 'other'].includes(cookie)) throw new UnauthorizedException(); return { uid: cookie }; } };
  class FixtureModule {}
  Module({ controllers: [KnowledgeProjectionController], providers: [KnowledgeProjectionService, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173', NODE_ENV: 'development' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const base = (await app.getUrl()) + '/api/account/learning/knowledge', token = 'a'.repeat(64);
    const headers = { Cookie: `visionary-session=owner; visionary-device=device; visionary-csrf=${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': token, 'X-Visionary-Account': 'owner', 'Content-Type': 'application/json' };
    const post = body => fetch(`${base}/assess`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal((await fetch(`${base}/assess`, { method: 'POST', body: JSON.stringify(evidence()) })).status, 403); // CSRF before authority
    assert.equal((await post(evidence())).status, 200);
    assert.equal((await post(evidence())).status, 200);
    assert.equal((await post(evidence({ workspaceId: 'acme_co' }))).status, 400);
    assert.equal((await post(evidence({ ...evidence(), uid: 'other' }))).status, 400);
    assert.equal((await fetch(`${base}/projections?workspaceId=personal&conceptId=squares&sourceVersion=a2&criteriaVersion=rubric-a2`, { headers })).status, 200);
    assert.equal((await fetch(`${base}/projections?workspaceId=personal&conceptId=squares&sourceVersion=a2&criteriaVersion=rubric-missing`, { headers })).status, 404);
  } finally { await app.close(); }
});
