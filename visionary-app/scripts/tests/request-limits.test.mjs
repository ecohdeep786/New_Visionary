import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { policy, checkJson, checkText, checkPage, checkStream, checkRetry } from '../request-limits.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const examples = JSON.parse(read('integration/contracts/request-limits.examples.json'));
const backend = 'backend/upstream/backend/src/';
const controllerPaths = [
  'auth/firebase-product/firebase-product.controller.ts', 'auth/firebase-product/account.controller.ts',
  'billing/billing.controller.ts', 'feedback/feedback.controller.ts',
  'learning/learning.controller.ts', 'learning/knowledge-projection.controller.ts',
];

test('policy proposals remain distinct from observed enforcement and cover registered controllers', () => {
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.runtimeEnforcementChanged, false);
  const module = read(`${backend}auth/firebase-product/firebase-product.module.ts`);
  const classes = [...module.match(/controllers:\s*\[([^\]]+)\]/)[1].matchAll(/\w+Controller/g)].map(x => x[0]).sort();
  const foundClasses = [], routes = [];
  for (const file of controllerPaths) {
    const source = read(backend + file), prefix = source.match(/@Controller\('([^']+)'\)/)[1];
    foundClasses.push(source.match(/export class (\w+)/)[1]);
    for (const match of source.matchAll(/@(Get|Post|Patch|Put|Delete)\((?:'([^']*)')?\)/g)) {
      routes.push(`${match[1].toUpperCase()} /api/${prefix}${match[2] ? '/' + match[2] : ''}`);
    }
  }
  assert.deepEqual(classes, foundClasses.sort(), 'Registered controller set changed: review route inventory');
  assert.deepEqual(routes.sort(), Object.keys(policy.currentRoutes).sort(), 'Route inventory drift');
  for (const profile of Object.values({ ...policy.currentRoutes, ...policy.proposedOperations })) assert.ok(policy.profiles[profile]);
  assert.equal(policy.currentRoutes['POST /api/billing/webhooks/razorpay'], 'webhook');
  assert.equal(policy.files.inlineBase64Allowed, false);
});

test('observed parser order, byte budgets, field units and deadline stay source-grounded', () => {
  const startup = read(`${backend}main-auth.ts`);
  const raw = startup.indexOf("raw({ type: 'application/json', limit: '256kb' })");
  const json = startup.indexOf("json({ limit: '24kb' })");
  assert.ok(raw >= 0 && json > raw);
  assert.equal(policy.observed.normalJsonBytes, 24 * 1024);
  assert.equal(policy.observed.webhookRawBytes, 256 * 1024);
  assert.match(read('frontend/src/api/firebase/authTransport.js'), /timeoutMs = 20000/);
  assert.match(read('frontend/src/services/backendTransport.ts'), /selected\.timeoutMs \?\? 20000/);
  assert.match(read(`${backend}feedback/feedback.contract.ts`), /value\.comment\.length > 1000/);
  assert.match(read(`${backend}auth/firebase-product/profile.ts`), /JSON\.stringify\(input\)\.length > 16000/);
  for (const [id, p] of Object.entries(policy.profiles)) {
    for (const key of ['requestBytes', 'responseBytes', 'depth', 'arrayItems', 'objectKeys', 'serverDeadlineMs']) assert.ok(Number.isSafeInteger(p[key]) && p[key] > 0, `${id}.${key}`);
    if (p.clientDeadlineMs !== null) assert.ok(p.serverDeadlineMs < p.clientDeadlineMs);
    for (const cap of Object.values(p.text || {})) { assert.ok(cap.max > 0); assert.ok(['utf16', 'codepoints'].includes(cap.unit)); }
  }
});

function exactJsonBytes(bytes, seed = 'x') {
  const empty = JSON.stringify({ text: '' });
  const remaining = bytes - Buffer.byteLength(empty), width = Buffer.byteLength(seed);
  return JSON.stringify({ text: seed.repeat(Math.floor(remaining / width)) + 'x'.repeat(remaining % width) });
}
for (const [id, profile] of Object.entries(policy.profiles)) {
  for (const direction of examples.byteBoundaries.directions) {
    test(`${id} ${direction}: full serialized UTF-8 bytes below/at/above cap`, () => {
      for (const seed of ['x', 'क', 'ব', '😀']) {
        for (const [i, offset] of examples.byteBoundaries.offsets.entries()) {
          const bytes = profile[`${direction}Bytes`] + offset, wire = exactJsonBytes(bytes, seed);
          assert.equal(Buffer.byteLength(wire), bytes);
          assert.equal(checkJson(id, wire, direction).ok, examples.byteBoundaries.expectedOk[i]);
        }
      }
    });
  }
  test(`${id}: nested, array and object bounds`, () => {
    for (const offset of [-1, 0, 1]) {
      const array = JSON.stringify(Array(profile.arrayItems + offset).fill(null));
      assert.equal(checkJson(id, array).ok, offset <= 0);
      const object = JSON.stringify(Object.fromEntries(Array.from({ length: profile.objectKeys + offset }, (_, i) => [`k${i}`, null])));
      assert.equal(checkJson(id, object).ok, offset <= 0);
      let nested = null;
      for (let i = 0; i < profile.depth + offset; i++) nested = { n: nested };
      assert.equal(checkJson(id, JSON.stringify(nested)).ok, offset <= 0);
    }
  });
  for (const [field, cap] of Object.entries(profile.text || {})) {
    test(`${id}.${field}: text cap below/at/above`, () => {
      for (const offset of [-1, 0, 1]) assert.equal(checkText(id, field, 'x'.repeat(cap.max + offset)).ok, offset <= 0);
    });
  }
}

test('synthetic text/page/stream/retry examples produce explicit expected results', () => {
  for (const c of examples.textCases) assert.equal(checkText(c.profile, c.field, c.seed.repeat(c.repeat)).ok, c.expectedOk);
  for (const c of examples.pageCases) assert.equal(checkPage(c.size).ok, c.expectedOk);
  for (const c of examples.streamCases) assert.equal(checkStream(c.events, c.options).ok, c.expectedOk);
  for (const c of examples.retryCases) assert.equal(checkRetry(c).ok, c.expectedOk);
});

test('long project/submission body fits proposed route but cannot pass existing global parser', () => {
  for (const [id, count] of [['project-revision', 24000], ['submission-revision', 12000]]) {
    const text = '😀'.repeat(count), wire = JSON.stringify({ body: text, commandId: 'synthetic-command', expectedRevision: 7 });
    assert.ok(checkText(id, 'body', text).ok);
    assert.ok(checkJson(id, wire).ok);
    assert.equal(checkJson('existing-json', wire).status, 413);
  }
  // Escaping control characters can exceed byte cap despite valid text length.
  assert.equal(checkJson('project-revision', JSON.stringify({ body: '\u0000'.repeat(24000) })).status, 413);
  assert.equal(checkText('project-revision', 'body', '\ud800').ok, false);
  assert.equal(checkJson('missing', '{}').ok, false);
  assert.equal(checkJson('existing-json', '{').ok, false);
  assert.equal(checkJson('existing-json', Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x3a, 0x30, 0x7d])).ok, false);
});

test('stream framing, event count, cumulative bytes and deadlines are independently bounded', () => {
  const event = bytes => ({ type: 'delta', text: 'x'.repeat(bytes - policy.stream.framingBytes - Buffer.byteLength(JSON.stringify({ type: 'delta', text: '' }))) });
  for (const offset of [-1, 0, 1]) assert.equal(checkStream([event(8192 + offset), { type: 'complete' }]).ok, offset <= 0);
  assert.ok(checkStream([...Array.from({ length: 255 }, () => ({ type: 'delta' })), { type: 'complete' }]).ok);
  assert.equal(checkStream([...Array.from({ length: 256 }, () => ({ type: 'delta' })), { type: 'complete' }]).ok, false);
  assert.equal(checkStream([...Array.from({ length: 129 }, () => event(8192)), { type: 'complete' }]).status, 413);
  for (const offset of [-1, 0, 1]) {
    // 127 full events plus one final frame reach the cumulative limit independently.
    const complete = { type: 'complete', text: 'x'.repeat(8192 - policy.stream.framingBytes - Buffer.byteLength(JSON.stringify({ type: 'complete', text: '' }))) };
    const frames = [...Array.from({ length: 127 }, () => event(8192)), complete];
    if (offset < 0) complete.text = complete.text.slice(1);
    if (offset > 0) frames.splice(1, 0, { type: 'delta' });
    assert.equal(checkStream(frames).ok, offset <= 0);
  }
  assert.ok(checkStream([{ type: 'complete' }], { elapsedMs: 17999, idleMs: 9999 }).ok);
  assert.equal(checkStream([{ type: 'complete' }]).committed, false);
});
