const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), { createRequire } = require('node:module'), { randomUUID } = require('node:crypto');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException } = req('@nestjs/common'), { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { FeedbackController } = req('./dist/src/feedback/feedback.controller.js');
const { FeedbackService } = req('./dist/src/feedback/feedback.service.js');
const { feedbackCommand } = req('./dist/src/feedback/feedback.contract.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const command = (overrides = {}) => ({ version: 1, commandId: randomUUID(), surface: 'learn', rating: 'needs_improvement', comment: 'The next step was unclear.', locale: 'en', ...overrides });

test('feedback accepts bounded explicit fields and rejects injected identity, context, controls and invalid schemas', () => {
  assert.equal(feedbackCommand(command({ comment: '  hello\nthere  ' })).comment, 'hello\nthere');
  assert.equal(feedbackCommand(command({ comment: undefined })).comment, '');
  for (const input of [null, [], command({ uid: 'other' }), command({ workspaceId: 'class' }), command({ conversation: 'private' }), command({ version: 2 }), command({ commandId: '../escape' }), command({ rating: 5 }), command({ surface: '/private?token=secret' }), command({ locale: 'unsupported' }), command({ comment: 'a'.repeat(1001) }), command({ comment: 'a\u0000b' })]) {
    assert.throws(() => feedbackCommand(input), error => error.getStatus() === 400);
  }
});

test('concurrent retries commit one receipt, altered replay conflicts, and lost commit responses recover', async () => {
  const f = billingMemory(), service = new FeedbackService({ getDatabase: () => f.db }), input = command();
  const receipts = await Promise.all(Array.from({ length: 12 }, () => service.submit('owner', input)));
  for (const receipt of receipts) assert.deepEqual(receipt, receipts[0]);
  assert.equal(f.rows.size, 2); assert.equal(f.rows.get('visionary_accounts/owner/feedbackState/admission').count, 1);
  await assert.rejects(service.submit('owner', { ...input, rating: 'good' }), error => error.getStatus() === 409);
  const next = command(), original = f.db.runTransaction.bind(f.db); let lost = false;
  f.db.runTransaction = async action => { const result = await original(action); if (!lost) { lost = true; throw Error('Internal credentials must not escape'); } return result; };
  await assert.rejects(service.submit('owner', next), error => error.getStatus() === 503 && !error.message.includes('credentials'));
  assert.equal((await service.submit('owner', next)).id, next.commandId);
  assert.equal(f.rows.get('visionary_accounts/owner/feedbackState/admission').count, 2);
});

test('fleet-shared per-UID admission caps new records while allowing an existing receipt and another user', async () => {
  const f = billingMemory(), a = new FeedbackService({ getDatabase: () => f.db }), b = new FeedbackService({ getDatabase: () => f.db });
  const inputs = Array.from({ length: 12 }, () => command());
  const result = await Promise.allSettled(inputs.map((input, n) => (n % 2 ? a : b).submit('owner', input)));
  assert.equal(result.filter(row => row.status === 'fulfilled').length, 10);
  for (const row of result.filter(row => row.status === 'rejected')) assert.equal(row.reason.getStatus(), 429);
  assert.equal((await b.submit('owner', inputs[0])).id, inputs[0].commandId);
  assert.equal((await a.submit('other', inputs[0])).uid, 'other');
  assert.equal(f.rows.get('visionary_accounts/other/feedbackState/admission').count, 1);
});

test('feedback HTTP enforces session, CSRF, expected UID and owner pagination, with no context or security-field exposure', async () => {
  const f = billingMemory();
  const auth = { getDatabase: () => f.db, authenticate: async cookie => { if (!['owner', 'other'].includes(cookie)) throw new UnauthorizedException(); return { uid: cookie }; } };
  class FixtureModule {}
  Module({ controllers: [FeedbackController], providers: [FeedbackService, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' }) }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  try {
    const url = (await app.getUrl()) + '/api/account/feedback', token = 'a'.repeat(64);
    const headers = { Cookie: `visionary-session=owner; visionary-device=device; visionary-csrf=${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': token, 'X-Visionary-Account': 'owner', 'Content-Type': 'application/json' };
    const post = (body, custom = headers) => fetch(url, { method: 'POST', headers: custom, body: JSON.stringify(body) });
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await post(command(), { ...headers, Origin: 'https://attacker.test' })).status, 403);
    assert.equal((await post(command(), { ...headers, 'X-CSRF-Token': '' })).status, 403);
    assert.equal((await post(command(), { ...headers, Cookie: headers.Cookie.replace('session=owner', 'session=revoked') })).status, 401);
    assert.equal((await post(command(), { ...headers, 'X-Visionary-Account': 'other' })).status, 409);
    assert.equal((await post(command({ uid: 'other' }))).status, 400);
    assert.equal(f.rows.size, 0);
    const one = command(), two = command();
    for (const input of [one, two]) { const response = await post(input); assert.equal(response.status, 201); const receipt = await response.json(); assert.equal(receipt.id, input.commandId); assert.equal(receipt.uid, 'owner'); assert.equal(receipt.comment, undefined); }
    const otherHeaders = { ...headers, Cookie: headers.Cookie.replace('session=owner', 'session=other'), 'X-Visionary-Account': 'other' };
    assert.equal((await post(command({ comment: 'Other user private note' }), otherHeaders)).status, 201);
    const first = await (await fetch(url + '?limit=1&uid=other', { headers })).json();
    assert.equal(first.items.length, 1); assert.ok(first.nextCursor); assert.equal(first.items[0].uid, 'owner');
    const second = await (await fetch(url + '?limit=1&after=' + first.nextCursor, { headers })).json();
    assert.equal(second.items.length, 1); assert.equal(second.nextCursor, null); assert.notEqual(second.items[0].id, first.items[0].id);
    assert.doesNotMatch(JSON.stringify([first, second]), /fingerprint|Other user private|device|cookie|email/);
    const other = await (await fetch(url, { headers: otherHeaders })).json(); assert.equal(other.items.length, 1); assert.equal(other.items[0].comment, 'Other user private note');
    for (const query of ['?limit=1000', '?after=..%2Fother', '?limit=1&limit=2']) assert.equal((await fetch(url + query, { headers })).status, 400);
    f.db.runTransaction = async () => { throw Error('Private database detail'); };
    const failure = await post(command()); assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /Private database detail/);
  } finally { await app.close(); }
});
