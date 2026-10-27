/**
 * AI-06 (KAN-88) — permission-filtered retrieval, pinned context/prompt/tool
 * versions, and schema/citation/locale/allowed-action output validation.
 *
 * Proven here:
 *   1. retrieval is permission-filtered SERVER-SIDE — only eligible, permitted
 *      sources enter the model context; forbidden sources are recorded as
 *      filtered out and never sent,
 *   2. a model response generated against DIFFERENT pinned versions is refused,
 *   3. a citation outside the permitted (filtered) set is refused,
 *   4. a wrong-locale output is refused,
 *   5. a non-allowed action is refused,
 *   6. a schema-invalid output (missing required field) is refused,
 *   7. a fully valid output is accepted and carries the pinned versions +
 *      citations (audit trail).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { MlOutputGate } = req('./dist/src/mlgate/ml-gate.js');
const { InMemoryMlStore } = req('./dist/src/mlgate/ml-gate-lookups.js');

const CALLER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const PINNED = { contextVersion: 'ctx-v4', promptVersion: 'prompt-v7', toolVersion: 'tool-v2' };

function makeGate(forbidden = []) {
  const sources = [
    { sourceId: 'src_ok_1', sourceVersion: '1.1.0', locale: 'en', eligible: true },
    { sourceId: 'src_ok_2', sourceVersion: '1.1.0', locale: 'en', eligible: true },
    { sourceId: 'src_forbidden', sourceVersion: '1.0.0', locale: 'en', eligible: true },
    { sourceId: 'src_unreleased', sourceVersion: '0.9.0', locale: 'en', eligible: false },
    { sourceId: 'src_hi', sourceVersion: '1.1.0', locale: 'hi', eligible: true },
  ];
  return new MlOutputGate(new InMemoryMlStore(sources, new Set(forbidden)));
}

const REQUEST = {
  pinned: PINNED,
  locale: 'en',
  allowedActions: ['show_hint', 'show_example'],
};

function output(overrides = {}) {
  return {
    pinned: PINNED,
    locale: 'en',
    body: { explanation: 'Seasons come from Earth\'s tilt.', summary: 'tilt causes seasons' },
    requiredFields: ['explanation', 'summary'],
    citations: ['src_ok_1'],
    actions: ['show_hint'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

test('retrieval is permission-filtered server-side: only eligible, permitted sources enter the model context', async () => {
  const gate = makeGate(['src_forbidden']);
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  assert.deepEqual(retrieval.sourceIds, ['src_ok_1', 'src_ok_2'], 'only permitted eligible sources');
  assert.deepEqual(retrieval.filteredOut, ['src_forbidden', 'src_unreleased'], 'forbidden and unreleased filtered out (audit trail)');
  assert.ok(!retrieval.sourceIds.includes('src_forbidden'), 'a forbidden source never reaches the model');
  // Locale isolation: the hi source is not in the en request at all.
  const hiRetrieval = await gate.filterRetrieval(CALLER, 'hi', PINNED);
  assert.deepEqual(hiRetrieval.sourceIds, ['src_hi']);
});

test('a model response generated against DIFFERENT pinned versions is refused', async () => {
  const gate = makeGate();
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ pinned: { contextVersion: 'ctx-v5', promptVersion: 'prompt-v7', toolVersion: 'tool-v2' } }),
    }),
    (e) => e.code === 'version_mismatch',
    'no version drift, no silent prompt swap',
  );
});

test('a citation outside the permitted (filtered) set is refused', async () => {
  const gate = makeGate(['src_forbidden']);
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ citations: ['src_ok_1', 'src_forbidden'] }),
    }),
    (e) => e.code === 'citation_not_permitted',
    'a filtered source can never be cited back',
  );
});

test('a wrong-locale output is refused', async () => {
  const gate = makeGate();
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ locale: 'hi' }),
    }),
    (e) => e.code === 'locale_mismatch',
  );
});

test('a non-allowed action is refused', async () => {
  const gate = makeGate();
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ actions: ['show_hint', 'run_arbitrary_code'] }),
    }),
    (e) => e.code === 'action_not_allowed',
  );
});

test('a schema-invalid output (missing required field) is refused', async () => {
  const gate = makeGate();
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ body: { explanation: 'only one field' } }),
    }),
    (e) => e.code === 'schema_invalid',
  );
  await assert.rejects(
    () => gate.validateOutput({
      caller: CALLER, request: { ...REQUEST, retrieval },
      output: output({ body: null }),
    }),
    (e) => e.code === 'schema_invalid',
  );
});

test('a fully valid output is accepted and carries the pinned versions + citations (audit trail)', async () => {
  const gate = makeGate();
  const retrieval = await gate.filterRetrieval(CALLER, 'en', PINNED);
  const validated = await gate.validateOutput({
    caller: CALLER, request: { ...REQUEST, retrieval },
    output: output({ citations: ['src_ok_1', 'src_ok_2'], actions: ['show_hint', 'show_example'] }),
  });
  assert.equal(validated.accepted, true);
  assert.deepEqual(validated.pinned, PINNED);
  assert.deepEqual(validated.citations, ['src_ok_1', 'src_ok_2']);
  assert.ok(validated.validatedAt);
});
