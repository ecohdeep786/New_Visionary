/**
 * LEARN-05 (KAN-71) — owned Ask/Guide conversation state and typed
 * model-response adapters:
 *   - conversations are private per-UID, workspace-scoped (no leak);
 *   - typed model outcomes (final | partial | error | unavailable) with an
 *     understandable reason; grounded finals carry citations;
 *   - TRUTHFUL UNTIL P07: without an accepted adapter, final/partial refuse
 *     (adapter_not_accepted) — only honest unavailable/error states record;
 *   - command dedup: replayed commands converge to the SAME turn; changed
 *     payload refuses;
 *   - cross-device resume is byte-stable;
 *   - revoked conversations refuse appends; history retained.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ConversationService } = req('./dist/src/conversation/conversation-service.js');
const { InMemoryConversationStore } = req('./dist/src/conversation/conversation-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_1' };
const OTHER = { uid: 'uid_learner_2', workspaceId: 'ws_1' };
const ws2 = { uid: 'uid_learner_1', workspaceId: 'ws_2' };

async function makeService(accepted = false) {
  const store = new InMemoryConversationStore();
  store.setAdapterAccepted(accepted);
  const service = new ConversationService(store);
  return { store, service };
}

// ---------------------------------------------------------------------------

test('OWNED STATE: another uid or workspace cannot read or append (no leak)', async () => {
  const { service } = await makeService();
  const conv = await service.createConversation(OWNER, 'cmd-1', 'ask');
  await assert.rejects(() => service.appendLearnerTurn(OTHER, 'cmd-2', conv.conversationId, 'hi'), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.resumeConversation(OTHER, conv.conversationId), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.appendLearnerTurn(ws2, 'cmd-3', conv.conversationId, 'hi'), (e) => e.code === 'workspace_mismatch');
});

test('TRUTHFUL UNTIL P07: without an accepted adapter, final/partial refuse; unavailable/error record honestly', async () => {
  const { service } = await makeService(false);
  const conv = await service.createConversation(OWNER, 'cmd-1', 'guide');
  // Claiming a final answer with no accepted adapter refuses.
  await assert.rejects(
    () => service.recordModelTurn(OWNER, 'cmd-2', conv.conversationId, 'final', 'adapter_x', 'done', 'The answer is 42.', ['src:1']),
    (e) => e.code === 'adapter_not_accepted',
  );
  await assert.rejects(
    () => service.recordModelTurn(OWNER, 'cmd-3', conv.conversationId, 'partial', 'adapter_x', 'halfway'),
    (e) => e.code === 'adapter_not_accepted',
  );
  // Honest states record with an understandable reason.
  const unavailable = await service.recordModelTurn(OWNER, 'cmd-4', conv.conversationId, 'unavailable', 'adapter_x', 'No connected model adapter is accepted yet (P07 pending).');
  assert.equal(unavailable.outcome, 'unavailable');
  assert.equal(unavailable.content, null);
  assert.deepEqual(unavailable.citations, []);
  const error = await service.recordModelTurn(OWNER, 'cmd-5', conv.conversationId, 'error', 'adapter_x', 'Upstream timeout; nothing fabricated.');
  assert.equal(error.outcome, 'error');
  // Missing reason refuses even for honest states.
  await assert.rejects(
    () => service.recordModelTurn(OWNER, 'cmd-6', conv.conversationId, 'unavailable', 'adapter_x', ''),
    (e) => e.code === 'turn_invalid',
  );
});

test('ACCEPTED ADAPTER (P07 seam): final records content with citations; partial records truthfully', async () => {
  const { service } = await makeService(true);
  const conv = await service.createConversation(OWNER, 'cmd-1', 'ask');
  await service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'Explain fractions with sources');
  const final = await service.recordModelTurn(OWNER, 'cmd-3', conv.conversationId, 'final', 'adapter_accepted_1', 'Grounded answer complete.', 'A fraction compares parts to a whole.', ['ncert/8#p12', 'source_manifest#7']);
  assert.equal(final.outcome, 'final');
  assert.equal(final.content, 'A fraction compares parts to a whole.');
  assert.deepEqual(final.citations, ['ncert/8#p12', 'source_manifest#7']);
  const partial = await service.recordModelTurn(OWNER, 'cmd-4', conv.conversationId, 'partial', 'adapter_accepted_1', 'Timeout mid-answer; partial retained honestly.');
  assert.equal(partial.outcome, 'partial');
  assert.equal(partial.content, null); // partial carries no full content claim
});

test('COMMAND DEDUP: replayed turn commands converge to the SAME turn; changed payload refuses', async () => {
  const { service } = await makeService(false);
  const conv = await service.createConversation(OWNER, 'cmd-1', 'ask');
  const t1 = await service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'hello');
  const t1replay = await service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'hello');
  assert.equal(t1replay.turnId, t1.turnId);
  await assert.rejects(
    () => service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'CHANGED'),
    (e) => e.code === 'command_changed',
  );
  const m1 = await service.recordModelTurn(OWNER, 'cmd-3', conv.conversationId, 'unavailable', 'a1', 'not accepted yet');
  const m1replay = await service.recordModelTurn(OWNER, 'cmd-3', conv.conversationId, 'unavailable', 'a1', 'not accepted yet');
  assert.equal(m1replay.turnId, m1.turnId);
  // Conversation creation also converges.
  const c1 = await service.createConversation(OWNER, 'cmd-4', 'guide');
  const c1replay = await service.createConversation(OWNER, 'cmd-4', 'guide');
  assert.equal(c1replay.conversationId, c1.conversationId);
});

test('CROSS-DEVICE RESUME: two controllers over the same store read the identical byte-stable journey', async () => {
  const { store, service } = await makeService(true);
  const conv = await service.createConversation(OWNER, 'cmd-1', 'ask');
  await service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'q1');
  await service.recordModelTurn(OWNER, 'cmd-3', conv.conversationId, 'final', 'a1', 'done', 'answer', ['src:1']);
  const deviceA = await service.resumeConversation(OWNER, conv.conversationId);
  const service2 = new ConversationService(store);
  const deviceB = await service2.resumeConversation(OWNER, conv.conversationId);
  assert.equal(deviceA.digest, deviceB.digest);
  assert.deepEqual(deviceA.turns, deviceB.turns);
});

test('REVOCATION: a revoked conversation refuses appends; history is retained', async () => {
  const { service } = await makeService(false);
  const conv = await service.createConversation(OWNER, 'cmd-1', 'ask');
  await service.appendLearnerTurn(OWNER, 'cmd-2', conv.conversationId, 'before revoke');
  await service.revokeConversation(OWNER, conv.conversationId);
  await assert.rejects(
    () => service.appendLearnerTurn(OWNER, 'cmd-3', conv.conversationId, 'after revoke'),
    (e) => e.code === 'conversation_revoked',
  );
  await assert.rejects(
    () => service.recordModelTurn(OWNER, 'cmd-4', conv.conversationId, 'unavailable', 'a1', 'r'),
    (e) => e.code === 'conversation_revoked',
  );
  // History retained.
  const resumed = await service.resumeConversation(OWNER, conv.conversationId);
  assert.equal(resumed.turns.length, 1);
});
