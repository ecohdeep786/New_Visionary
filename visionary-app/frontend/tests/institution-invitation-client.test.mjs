import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstitutionInvitationClient } from '../src/services/institutionInvitationClient.js';

const token = 'A'.repeat(43);
const receipt = { workspaceId: 'fixture', role: 'MEMBER', replay: false };

test('acceptance submits only the code and returns the server membership receipt', async () => {
  const client = createInstitutionInvitationClient({ getAccountId: () => 'account-a', request: async (path, options) => {
    assert.equal(path, '/accept');
    assert.equal(options.accountId, 'account-a');
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.body, { token });
    options.beforeSend();
    return receipt;
  } });
  assert.deepEqual(await client.accept(token), receipt);
});

test('account switch during the command discards the response and prevents resend', async () => {
  let account = 'account-a';
  const client = createInstitutionInvitationClient({ getAccountId: () => account, request: async (_path, options) => {
    options.beforeSend();
    account = 'account-b';
    assert.throws(options.beforeSend, error => error.status === 409);
    return receipt;
  } });
  await assert.rejects(client.accept(token), error => error.status === 409);
});

test('a missing receipt never reports acceptance', async () => {
  const client = createInstitutionInvitationClient({ getAccountId: () => 'account-a', request: async () => ({ role: 'MEMBER' }) });
  await assert.rejects(client.accept(token), error => error.status === 503);
});
