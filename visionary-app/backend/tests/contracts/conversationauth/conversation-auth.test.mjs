/**
 * AI-04 (KAN-86) — enforce conversation UID/workspace ownership on every
 * get/append/delete/context request. A supplied session ID or UUID is never
 * authority.
 *
 * Proven here:
 *   1. knowing a conversation UUID grants NOTHING — a stranger with the exact
 *      ID is denied on get/append/context/delete, identically to an unknown ID
 *      (no existence leak),
 *   2. the same uid in a DIFFERENT workspace owns nothing there (workspace
 *      isolation),
 *   3. the owner can get/append/context/delete their own conversation,
 *   4. append enforces pinned-context integrity (a turn citing another source
 *      revision is refused),
 *   5. delete is owner-only and deleting an already-deleted conversation
 *      denies uniformly,
 *   6. authority comes from the authenticated caller context, never the payload.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ConversationAuthService } = req('./dist/src/conversationauth/conversation-auth.js');
const { InMemoryConversationStore } = req('./dist/src/conversationauth/conversation-auth-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const OTHER_WS = { uid: 'uid_learner_1', workspaceId: 'ws_school' };
const CONV = 'conv_abc123';
const PIN = '1.1.0';

async function makeService() {
  const store = new InMemoryConversationStore();
  const svc = new ConversationAuthService(store);
  await store.saveConversation({
    conversationId: CONV,
    owner: OWNER,
    pinnedSourceVersion: PIN,
    turns: [{ turnId: 't1', role: 'assistant', body: 'Let us start with integers.' }],
    deleted: false,
  });
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('knowing the conversation UUID grants NOTHING: a stranger is denied exactly like an unknown id (no existence leak)', async () => {
  const { svc } = await makeService();
  const strangerGet = await svc.getTurns(CONV, STRANGER);
  const unknownGet = await svc.getTurns('conv_unknown', STRANGER);
  assert.deepEqual(strangerGet, unknownGet, 'wrong uid and unknown id are indistinguishable');
  assert.equal(strangerGet.denied, true);
  assert.equal(strangerGet.reason, 'denied');

  const strangerAppend = await svc.appendTurn({ conversationId: CONV, caller: STRANGER, turnId: 't9', body: 'inject', sourceVersion: PIN });
  assert.equal(strangerAppend.denied, true);
  const strangerContext = await svc.getContext(CONV, STRANGER);
  assert.equal(strangerContext.denied, true);
  const strangerDelete = await svc.deleteConversation(CONV, STRANGER);
  assert.equal(strangerDelete.denied, true);
});

test('workspace isolation: the same uid in a different workspace owns nothing there', async () => {
  const { svc } = await makeService();
  const otherWs = await svc.getTurns(CONV, OTHER_WS);
  assert.equal(otherWs.denied, true, 'conversations are workspace-scoped');
  const otherWsDelete = await svc.deleteConversation(CONV, OTHER_WS);
  assert.equal(otherWsDelete.denied, true);
});

test('the owner can get/append/context/delete their own conversation', async () => {
  const { svc } = await makeService();
  const view = await svc.getTurns(CONV, OWNER);
  assert.equal(view.denied, undefined);
  assert.equal(view.turns.length, 1);

  const appended = await svc.appendTurn({ conversationId: CONV, caller: OWNER, turnId: 't2', body: 'Why is 7 negative?', sourceVersion: PIN });
  assert.deepEqual(appended, { committed: true, turnCount: 2 });

  const context = await svc.getContext(CONV, OWNER);
  assert.deepEqual(context, { conversationId: CONV, pinnedSourceVersion: PIN });

  const deleted = await svc.deleteConversation(CONV, OWNER);
  assert.deepEqual(deleted, { deleted: true });
});

test('append enforces pinned-context integrity: a turn citing another source revision is refused', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.appendTurn({ conversationId: CONV, caller: OWNER, turnId: 't2', body: 'drift attempt', sourceVersion: '9.9.9' }),
    (e) => e.code === 'context_revision_mismatch',
    'no silent context drift',
  );
});

test('delete is owner-only; deleting an already-deleted conversation denies uniformly (no existence leak)', async () => {
  const { svc } = await makeService();
  await svc.deleteConversation(CONV, OWNER);
  // The owner's own second delete denies uniformly (deleted state is not visible).
  const again = await svc.deleteConversation(CONV, OWNER);
  assert.equal(again.denied, true);
  // A stranger learns nothing either way.
  const stranger = await svc.deleteConversation(CONV, STRANGER);
  assert.deepEqual(stranger, again);
});

test('authority comes from the authenticated caller context, never from payload identifiers', async () => {
  const { svc } = await makeService();
  // A payload may carry ANY claimed uid; the service only consults the
  // authenticated caller. A stranger passing the owner's uid in a payload
  // identifier gains nothing (there is no parameter that could carry it — the
  // caller is the only identity input).
  const stranger = await svc.getTurns(CONV, STRANGER);
  assert.equal(stranger.denied, true);
  const owner = await svc.getTurns(CONV, OWNER);
  assert.equal(owner.denied, undefined);
});
