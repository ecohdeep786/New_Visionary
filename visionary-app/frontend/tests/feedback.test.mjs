import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackClient, feedbackSurface } from '../src/services/feedbackClient.js';
import { createAuthTransport } from '../src/api/firebase/authTransport.js';
import { feedbackCopy } from '../src/lib/feedbackCopy.js';
const command = { version: 1, commandId: '14b64604-51ee-489d-92ab-5cf8c70413f1', surface: 'general', rating: 'good', locale: 'en', comment: '' };
const receipt = { version: 1, uid: 'owner', id: command.commandId, status: 'submitted', createdAt: '2026-10-16T00:00:00.000Z' };

test('feedback rejects anonymous, changed-account and mismatched receipts before displaying success', async () => {
  let uid = null, calls = 0;
  const client = createFeedbackClient({ getAccountId: () => uid, request: async () => { calls++; return receipt; } });
  await assert.rejects(client.submit(command), /account changed/); assert.equal(calls, 0);
  uid = 'owner'; assert.deepEqual(await client.submit(command), receipt);
  for (const invalid of [{ ...receipt, uid: 'other' }, { ...receipt, id: 'other' }, { ...receipt, status: 'queued' }, { ...receipt, createdAt: null }, null]) {
    await assert.rejects(createFeedbackClient({ getAccountId: () => uid, request: async () => invalid }).submit(command), /could not be confirmed/);
  }
  let release, beforeSend;
  const pending = createFeedbackClient({ getAccountId: () => uid, request: async (_path, options) => { beforeSend = options.beforeSend; await new Promise(resolve => { release = resolve; }); return receipt; } }).submit(command);
  uid = 'other'; assert.throws(beforeSend, /account changed/); release(); await assert.rejects(pending, /account changed/);
});

test('explicit feedback retry sends the same command through auth CSRF, with no automatic mutation retry', async () => {
  const calls = []; let fail = true;
  const request = createAuthTransport({ basePath: '/api/account/feedback', getLocks: () => null, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/auth/csrf') return { ok: true, json: async () => ({ token: 'fixture' }) };
    if (fail) throw new TypeError('Lost response');
    return { ok: true, json: async () => receipt };
  } });
  const client = createFeedbackClient({ getAccountId: () => 'owner', request });
  await assert.rejects(client.submit(command), /Lost response/); assert.equal(calls.length, 2);
  fail = false; assert.deepEqual(await client.submit(command), receipt);
  assert.deepEqual(calls.map(row => row.url), ['/api/auth/csrf', '/api/account/feedback', '/api/auth/csrf', '/api/account/feedback']);
  assert.equal(calls[1].options.body, calls[3].options.body);
  assert.equal(calls[3].options.headers['X-Visionary-Account'], 'owner'); assert.equal(calls[3].options.headers['X-CSRF-Token'], 'fixture');
});

test('feedback context uses a fixed section enum, excludes URL parameters and has complete three-language labels', () => {
  assert.equal(feedbackSurface('/dashboard/subscription?secret=abc'), 'general');
  assert.equal(feedbackSurface('/dashboard/subscription'), 'billing');
  assert.equal(feedbackSurface('/dashboard/build/private-project-id'), 'build');
  assert.equal(feedbackSurface('/dashboard/classwork/child-id'), 'classroom');
  assert.equal(feedbackSurface('/dashboard/settings'), 'account');
  const keys = Object.keys(feedbackCopy('en')).sort();
  for (const locale of ['hi', 'bn']) { assert.deepEqual(Object.keys(feedbackCopy(locale)).sort(), keys); for (const value of Object.values(feedbackCopy(locale))) assert.ok(value.length); }
});
