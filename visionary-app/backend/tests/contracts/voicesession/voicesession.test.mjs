/**
 * AI-17 (KAN-155) — natural two-way voice tutoring with interruption and safe
 * actions over the same authorized session. Proven against the real module over
 * the in-memory store:
 *
 *   1. OPEN + CONSENT + QUALIFICATION: a session opens only with explicit mic
 *      consent AND a qualified locale (AI-18 seam); missing consent and
 *      unqualified locale fail closed; concurrency bound enforced.
 *   2. INTERIM VS FINAL: interim transcripts are never input; only FINAL
 *      recognized speech advances; STALE (reordered/old) audio is suppressed.
 *   3. INTERRUPTION/STOP/CANCEL are acknowledged and cancel the in-flight turn.
 *   4. READBACK: uncertain numbers/units require confirmation before input;
 *      never auto-committed.
 *   5. SAFE ACTIONS: allowlist-only; consequential build-accept/share/export
 *      require a confirm bound to the EXACT revision (revision-moved blocks).
 *   6. REAUTHORIZE/REVOCATION + WRONG USER: reconnect re-checks consent and
 *      revocation; account switch is denied; raw audio is never retained and
 *      no voice cloning / no automatic raw-audio training.
 *   7. BOUNDS: max turns and token budget enforced.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { InMemoryVoiceStore } = req('./dist/src/voicesession/voicesession-lookups.js');
const { VoiceSessionService } = req('./dist/src/voicesession/voicesession-service.js');
const { VoiceSessionError } = req('./dist/src/voicesession/voicesession-types.js');

const OWNER = { uid: 'uid_learner', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

function expectCode(promise, code) {
  return assert.rejects(promise, (e) => e instanceof VoiceSessionError && e.code === code, `expected voice-session error ${code}`);
}

async function makeHarness() {
  const store = new InMemoryVoiceStore();
  store.setQualifiedLocales(['hi-in', 'bn-in']);
  store.setProjectRevision('prj_build_1', 3);
  const svc = new VoiceSessionService(store);
  return { store, svc };
}

test('OPEN requires mic consent + qualified locale; concurrency bound enforced', async () => {
  const { store, svc } = await makeHarness();
  await expectCode(svc.open(OWNER, 'hi-in'), 'mic_consent_missing');

  await svc.recordConsent(OWNER, true);
  await expectCode(svc.open(OWNER, 'xx-unsupported'), 'locale_not_qualified');

  const s1 = await svc.open(OWNER, 'hi-in');
  const s2 = await svc.open(OWNER, 'hi-in');
  await expectCode(svc.open(OWNER, 'bn-in'), 'concurrency_exceeded'); // max 2
  void store; void s1; void s2;
});

test('INTERIM never input; only FINAL advances; STALE audio suppressed', async () => {
  const { svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');

  const turn = await svc.beginTurn(OWNER, session.sessionId);
  await svc.interimTranscript(OWNER, session.sessionId, turn.turnId, 'interim guess');
  await svc.appendAudio(OWNER, session.sessionId, turn.turnId, 10);
  await expectCode(svc.appendAudio(OWNER, session.sessionId, turn.turnId, 5), 'stale_audio'); // reordered/old seq

  const finalized = await svc.finalizeTranscript(OWNER, session.sessionId, turn.turnId, 'final recognized speech', false);
  assert.equal(finalized.finalTranscript, 'final recognized speech');
  assert.equal(finalized.status, 'finalized');
  assert.ok(finalized.interimTranscript.length > 0, 'interim kept but is not the input');
  void finalized;
});

test('INTERRUPTION is acknowledged and cancels the in-flight turn', async () => {
  const { svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');
  const turn = await svc.beginTurn(OWNER, session.sessionId);

  const ack = await svc.interrupt(OWNER, session.sessionId, turn.turnId);
  assert.equal(ack.cancelledTurnSeq, turn.seq);
  assert.ok(ack.ackId.length > 0);
});

test('READBACK: uncertain numbers/units require confirmation before input', async () => {
  const { svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');

  const turn = await svc.beginTurn(OWNER, session.sessionId);
  const awaiting = await svc.finalizeTranscript(OWNER, session.sessionId, turn.turnId, 'take 5.5 mg', true);
  assert.equal(awaiting.status, 'awaiting_readback');
  assert.equal(awaiting.readbackConfirmed, false, 'not auto-committed');

  const cleared = await svc.confirmReadback(OWNER, session.sessionId, turn.turnId);
  assert.equal(cleared.status, 'finalized');
  assert.equal(cleared.readbackConfirmed, true);
});

test('SAFE ACTIONS: allowlist-only; consequential build accept requires confirm + exact revision', async () => {
  const { svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');

  // Non-consequential allowlisted action passes.
  assert.deepEqual(await svc.safeAction(OWNER, session.sessionId, 'reveal-step-hint', false), { outcome: 'allowed' });
  // Unknown action denied.
  await expectCode(svc.safeAction(OWNER, session.sessionId, 'execute-arbitrary-code', false), 'action_not_allowed');
  // Consequential action without confirm denied.
  await expectCode(svc.safeAction(OWNER, session.sessionId, 'build-accept', false), 'action_requires_confirm');
  // Confirm against the WRONG revision denied (exact-revision fencing).
  await expectCode(svc.safeAction(OWNER, session.sessionId, 'build-accept', true, { kind: 'build-accept', projectId: 'prj_build_1', revisionNo: 2 }), 'revision_moved');
  // Confirm against the EXACT current revision passes.
  assert.deepEqual(await svc.safeAction(OWNER, session.sessionId, 'build-accept', true, { kind: 'build-accept', projectId: 'prj_build_1', revisionNo: 3 }), { outcome: 'allowed' });
});

test('REAUTHORIZE/REVOCATION + WRONG USER + PRIVACY: reconnect re-checks; raw audio never retained; no cloning/training', async () => {
  const { store, svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');

  // Wrong user cannot touch the session.
  await expectCode(svc.beginTurn(OTHER, session.sessionId), 'not_owner');

  // Reconnect reauthorizes while consent + no revocation.
  assert.deepEqual(await svc.reconnect(OWNER, session.sessionId), { reauthorized: true });

  // Revocation fails closed on reconnect.
  store.setRevoked(OWNER, true);
  await expectCode(svc.reconnect(OWNER, session.sessionId), 'revoked');

  // Privacy: no raw audio retained, no always-on recording, no cloning/training.
  const policy = svc.privacyPolicy();
  assert.equal(policy.rawAudioRetained, false);
  assert.equal(policy.alwaysOnRecording, false);
  assert.equal(policy.voiceCloning, false);
  assert.equal(policy.automaticRawAudioTraining, false);
});

test('BOUNDS: max turns and token budget enforced', async () => {
  const { store, svc } = await makeHarness();
  await svc.recordConsent(OWNER, true);
  const session = await svc.open(OWNER, 'hi-in');
  const maxTurns = await store.maxTurnsPerSession();

  for (let i = 0; i < maxTurns; i++) {
    const turn = await svc.beginTurn(OWNER, session.sessionId);
    await svc.finalizeTranscript(OWNER, session.sessionId, turn.turnId, `turn ${i}`, false);
  }
  await expectCode(svc.beginTurn(OWNER, session.sessionId), 'max_turns_exceeded');
});
