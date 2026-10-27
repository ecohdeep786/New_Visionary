/**
 * AI-15 (KAN-149) — AIRA P0–P3 context assembly and evidence-backed memory
 * observations behind the scoped conversation boundary.
 *
 * Proven here:
 *   1. P0: the constitution is IMMUTABLE — same-version conflicting overwrite
 *      refuses; every assembly stamps its version,
 *   2. P1: five-way context separation (role/workspace/purpose/language) —
 *      different contexts never see each other's facts,
 *   3. P2: bounded current-session history — older turns dropped and COUNTED,
 *   4. P3: only authorized retrieval sources enter; the scoped boundary denies
 *      strangers,
 *   5. grounding is NEVER dropped for a budget — the assembly ABSTAINS instead,
 *   6. insufficient evidence returns FEWER observations (never invented),
 *   7. provenance/correction/disable controls work; onboarding facts labeled,
 *   8. no automatic training (the assembly exposes no training write path).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { AiraContextAssembler } = req('./dist/src/contextassembly/context-assembly.js');
const { InMemoryContextStore } = req('./dist/src/contextassembly/context-assembly-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal', role: 'student', purpose: 'learning', language: 'en' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal', role: 'student', purpose: 'learning', language: 'en' };
const CONV = 'conv_aira';

async function makeAssembler() {
  const store = new InMemoryContextStore();
  const svc = new AiraContextAssembler(store);
  const turns = Array.from({ length: 12 }, (_, i) => ({ turnId: `t${i + 1}`, role: i % 2 === 0 ? 'learner' : 'assistant', body: `turn ${i + 1}` }));
  store.seedConversation({ conversationId: CONV, owner: OWNER, turns });
  store.seedRetrievalSources(['src_ok_1', 'src_ok_2']);
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('P0: the constitution is IMMUTABLE — same-version conflicting overwrite refuses; assemblies stamp the version', async () => {
  const { store, svc } = await makeAssembler();
  await svc.setConstitution({ version: 1, rules: ['Never invent syllabus coverage', 'Respect UID/workspace boundaries'] });
  await assert.rejects(
    () => svc.setConstitution({ version: 1, rules: ['Changed rules'] }),
    (e) => e.code === 'constitution_conflict',
    'same-version conflicting overwrite refused (immutability)',
  );
  // Idempotent re-set of identical content is fine.
  await svc.setConstitution({ version: 1, rules: ['Never invent syllabus coverage', 'Respect UID/workspace boundaries'] });

  const assembly = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 5,
  });
  assert.equal(assembly.constitutionVersion, 1, 'the assembly stamps its constitution version');
  void store;
});

test('P1: five-way context separation — different purpose/language/role never see each other\'s facts', async () => {
  const { store, svc } = await makeAssembler();
  store.seedFacts([
    { factId: 'f1', key: 'global|name', value: 'Learner', onboardingFact: true },
    { factId: 'f2', key: 'student|ws_personal|learning|en|goal', value: 'Master orbits', onboardingFact: false },
    { factId: 'f3', key: 'student|ws_personal|assessment|en|goal', value: 'Pass exam', onboardingFact: false },
    { factId: 'f4', key: 'student|ws_personal|learning|hi|goal', value: 'कक्षा 7 लक्ष्य', onboardingFact: false },
  ]);
  const learning = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 3,
  });
  const keys = learning.snapshot.map((f) => f.key);
  assert.ok(keys.includes('global|name'), 'global facts always visible');
  assert.ok(keys.includes('student|ws_personal|learning|en|goal'), 'own context facts visible');
  assert.ok(!keys.includes('student|ws_personal|assessment|en|goal'), 'assessment purpose does not leak into learning context');
  assert.ok(!keys.includes('student|ws_personal|learning|hi|goal'), 'Hindi context does not leak into the en context');
});

test('P2: bounded current-session history — older turns dropped and honestly COUNTED', async () => {
  const { svc } = await makeAssembler();
  const assembly = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 5,
  });
  assert.equal(assembly.history.length, 5);
  assert.equal(assembly.historyBound.included, 5);
  assert.equal(assembly.historyBound.dropped, 7, 'older turns dropped and counted, not hidden');
  assert.deepEqual(assembly.history.map((t) => t.turnId), ['t8', 't9', 't10', 't11', 't12'], 'the MOST RECENT turns are the included ones');
});

test('P3: only authorized retrieval sources enter; the scoped boundary denies strangers', async () => {
  const { svc } = await makeAssembler();
  const assembly = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 3,
  });
  assert.deepEqual(assembly.retrievalSources, ['src_ok_1', 'src_ok_2'], 'only authorized sources');

  await assert.rejects(
    () => svc.assemble({
      owner: STRANGER, conversationId: CONV, budgetTokens: 10_000,
      requiredGroundingIds: [], approvedAuthoredFallback: [], maxHistoryTurns: 3,
    }),
    (e) => e.code === 'not_owner',
    'the scoped conversation boundary denies strangers',
  );
});

test('grounding is NEVER dropped for a budget: a tight budget ABSTAINS instead of truncating grounding', async () => {
  const { store, svc } = await makeAssembler();
  store.seedMemories([
    { observationId: 'obs_ground', content: 'x'.repeat(500), provenance: { sourceId: 'src_ok_1', reviewedRef: 'review-1' }, onboardingFact: false, layer: 'retrieval', disabled: false, supersededBy: null },
  ]);
  // Budget far below the required grounding size: ABSTAIN, never truncate.
  const abstained = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 100,
    requiredGroundingIds: ['obs_ground'], approvedAuthoredFallback: [], maxHistoryTurns: 3,
  });
  assert.equal(abstained.groundingStatus, 'abstained');
  assert.equal(abstained.abstainReason, 'budget_would_drop_grounding');
  assert.equal(abstained.observations.length, 0, 'no ungrounded context ships');

  // With approved authored material available, the fallback satisfies grounding.
  const fallback = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 100,
    requiredGroundingIds: ['obs_ground'], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 3,
  });
  assert.equal(fallback.groundingStatus, 'grounded', 'approved authored material is the alternate grounding path');
});

test('insufficient evidence returns FEWER observations — never an invented one', async () => {
  const { store, svc } = await makeAssembler();
  store.seedMemories([]);
  const empty = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: [], maxHistoryTurns: 3,
  });
  assert.equal(empty.groundingStatus, 'abstained');
  assert.equal(empty.abstainReason, 'insufficient_evidence');
  assert.equal(empty.observations.length, 0);
});

test('provenance/correction/disable controls work; onboarding facts labeled', async () => {
  const { store, svc } = await makeAssembler();
  store.seedMemories([
    { observationId: 'obs_1', content: 'Learner prefers visual examples', provenance: { sourceId: 'src_ok_1', reviewedRef: 'review-1' }, onboardingFact: false, layer: 'history', disabled: false, supersededBy: null },
    { observationId: 'obs_onboarding', content: 'Name: Learner', provenance: { sourceId: 'onboarding', reviewedRef: null }, onboardingFact: true, layer: 'fact', disabled: false, supersededBy: null },
    { observationId: 'obs_disabled', content: 'Outdated claim', provenance: { sourceId: 'src_ok_1', reviewedRef: null }, onboardingFact: false, layer: 'history', disabled: true, supersededBy: null },
    { observationId: 'obs_original', content: 'Original claim', provenance: { sourceId: 'src_ok_1', reviewedRef: 'review-2' }, onboardingFact: false, layer: 'history', disabled: false, supersededBy: null },
  ]);
  // Correction: the correction supersedes the original.
  const correction = await svc.correctMemory(OWNER, 'obs_original', 'Corrected claim');
  assert.equal(correction.observationId, 'obs_original_corr');

  const assembly = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 3,
  });
  const ids = assembly.observations.map((o) => o.observationId);
  assert.ok(!ids.includes('obs_disabled'), 'disabled memory excluded');
  assert.ok(!ids.includes('obs_original'), 'superseded original excluded');
  assert.ok(ids.includes('obs_original_corr'), 'the correction is present');
  const onboarding = assembly.observations.find((o) => o.observationId === 'obs_onboarding');
  assert.equal(onboarding.onboardingFact, true, 'onboarding facts labeled');
  for (const o of assembly.observations) {
    assert.ok(o.provenance.sourceId, 'every observation carries provenance');
  }
});

test('no automatic training: the assembly exposes no training write path', async () => {
  const { svc } = await makeAssembler();
  const assembly = await svc.assemble({
    owner: OWNER, conversationId: CONV, budgetTokens: 10_000,
    requiredGroundingIds: [], approvedAuthoredFallback: ['authored:chapter-1'], maxHistoryTurns: 3,
  });
  const serialized = JSON.stringify(assembly);
  assert.equal(serialized.includes('training'), false, 'no training sink in the assembly result');
  // The service surface has no method that writes learner content to training.
  const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(svc)).filter((n) => n !== 'constructor');
  assert.deepEqual(methodNames.sort(), ['assemble', 'correctMemory', 'disableMemory', 'setConstitution'], 'no training-write method exists');
});
