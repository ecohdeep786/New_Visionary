/**
 * AI-10 (KAN-92) — released voice/image/structured-activity operations with
 * explicit schemas, permitted context, device/locale recovery and separate cost
 * limits; unreleased modalities stay unavailable.
 *
 * Proven here:
 *   1. an UNRELEASED modality reports unavailable honestly (no silent fallback),
 *   2. each released modality validates against its EXPLICIT schema (voice,
 *      image, structured activity); a violating payload is refused,
 *   3. permitted context only: wrong owner denied; pinned-revision mismatch
 *      refused (no context drift),
 *   4. device/locale recovery: a request locale mismatching the conversation is
 *      refused (no silent locale drift),
 *   5. SEPARATE cost limits: exhausting voice never spends image.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ModalityGate } = req('./dist/src/modalities/modality-gate.js');
const { InMemoryModalityStore } = req('./dist/src/modalities/modality-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const CONV = 'conv_multi';
const PIN = '1.1.0';

async function makeGate() {
  const store = new InMemoryModalityStore();
  store.release('voice');
  store.release('image');
  // structured_activity intentionally NOT released.
  store.seedConversation({ conversationId: CONV, owner: OWNER, pinnedSourceVersion: PIN, locale: 'en-IN' });
  store.seedAllowance(OWNER, 'voice', 10);
  store.seedAllowance(OWNER, 'image', 10);
  return { store, gate: new ModalityGate(store) };
}

function voiceOperation(overrides = {}) {
  return {
    modality: 'voice',
    caller: OWNER,
    conversationId: CONV,
    pinnedSourceVersion: PIN,
    locale: 'en-IN',
    payload: { audioRef: 'gs://audio/clip1', audioLocale: 'en-IN' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

test('an UNRELEASED modality reports unavailable honestly — no silent fallback to another modality', async () => {
  const { gate } = await makeGate();
  await assert.rejects(
    () => gate.authorize(voiceOperation({ modality: 'structured_activity', payload: { activityKind: 'quiz', steps: ['a', 'b'] } })),
    (e) => e.code === 'modality_unreleased',
    'structured activity is not released: unavailable, honestly',
  );
});

test('each released modality validates against its EXPLICIT schema; a violating payload is refused', async () => {
  const { gate } = await makeGate();
  // Valid voice operation.
  const ok = await gate.authorize(voiceOperation());
  assert.equal(ok.modality, 'voice');

  // Voice without audioRef: schema invalid.
  await assert.rejects(
    () => gate.authorize(voiceOperation({ payload: { audioLocale: 'en-IN' } })),
    (e) => e.code === 'schema_invalid',
  );
  // Image without imageRef: schema invalid.
  await assert.rejects(
    () => gate.authorize(voiceOperation({ modality: 'image', payload: { conceptId: 'c_orbits' } })),
    (e) => e.code === 'schema_invalid',
  );
  // Valid image operation.
  const img = await gate.authorize(voiceOperation({ modality: 'image', payload: { imageRef: 'gs://img/diagram', conceptId: 'c_orbits' } }));
  assert.equal(img.modality, 'image');
});

test('permitted context only: wrong owner denied; pinned-revision mismatch refused (no context drift)', async () => {
  const { gate } = await makeGate();
  await assert.rejects(
    () => gate.authorize(voiceOperation({ caller: STRANGER })),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => gate.authorize(voiceOperation({ pinnedSourceVersion: '9.9.9' })),
    (e) => e.code === 'schema_invalid',
    'pinned-revision mismatch refuses (no context drift)',
  );
});

test('device/locale recovery: a request locale mismatching the conversation is refused (no silent locale drift)', async () => {
  const { gate } = await makeGate();
  await assert.rejects(
    () => gate.authorize(voiceOperation({ locale: 'bn-IN' })),
    (e) => e.code === 'locale_mismatch',
  );
});

test('SEPARATE cost limits: exhausting the voice allowance never spends the image allowance', async () => {
  const { store, gate } = await makeGate();
  // Drain the voice allowance (10 units, cost 4 each → 2 succeed, 3rd refuses).
  await gate.consumeAllowance(voiceOperation(), 4);
  await gate.consumeAllowance(voiceOperation(), 4);
  await assert.rejects(
    () => gate.consumeAllowance(voiceOperation(), 4),
    (e) => e.code === 'modality_allowance_exhausted',
  );
  // The image allowance is untouched (still 10): image keeps spending fine.
  const img = voiceOperation({ modality: 'image', payload: { imageRef: 'gs://img/d', conceptId: 'c_orbits' } });
  await gate.authorize(img);
  await gate.consumeAllowance(img, 4);
  await gate.consumeAllowance(img, 4);
  await gate.consumeAllowance(img, 2);
  // Image bucket exactly exhausted (10 spent) — proving it was a separate bucket.
  await assert.rejects(
    () => gate.consumeAllowance(img, 1),
    (e) => e.code === 'modality_allowance_exhausted',
  );
  void store;
});
