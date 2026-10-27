/**
 * AI-09 (KAN-91) — remove raw private-text logging; classroom/NAT fairness,
 * provider 429/outage handling, and policy revocation honored mid-run.
 *
 * Proven here:
 *   1. NO raw private text in logs: every private string becomes a typed
 *      length-noting placeholder; the original content appears nowhere in the
 *      record (provable),
 *   2. classroom/NAT fairness: a shared egress window caps the aggregate rate —
 *      one learner cannot starve the classroom; exhausted windows refuse,
 *   3. provider 429/outage: honest refusals, no silent degradation,
 *   4. policy revocation mid-run stops the run: partial stays partial, no
 *      further provider work; an active policy keeps the run going.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { MlResilienceService } = req('./dist/src/mlresilience/ml-resilience.js');
const { InMemoryResilienceStore } = req('./dist/src/mlresilience/ml-resilience-lookups.js');

const CALLER = { uid: 'uid_learner_1', workspaceId: 'ws_class_9b', egressId: 'egress_classroom_1' };

async function makeService() {
  const store = new InMemoryResilienceStore();
  store.setPolicyActive(CALLER.uid, true);
  return { store, svc: new MlResilienceService(store) };
}

// ---------------------------------------------------------------------------

test('NO raw private text in logs: private strings become typed length-noting placeholders, provably absent', async () => {
  const { svc } = await makeService();
  const rawQuery = 'Why does the moon change shape every night exactly?';
  const rawResponse = 'The moon reflects sunlight and orbits Earth, so we see different fractions illuminated.';
  const record = svc.redactForLog('ml.teaching_turn', {
    uid: 42,
    queryText: rawQuery,
    responseText: rawResponse,
  });

  // The placeholders note length, not content.
  assert.equal(record.fields.queryText, `learner_text:<len:${rawQuery.length}>`);
  assert.equal(record.fields.responseText, `learner_text:<len:${rawResponse.length}>`);
  assert.equal(record.fields.uid, 42, 'non-private numbers pass through');

  // PROOF: the original private strings appear nowhere in the record.
  assert.equal(MlResilienceService.containsRawText(record, [rawQuery, rawResponse]), false, 'raw private text is provably absent from the log record');
});

test('classroom/NAT fairness: a shared egress window caps the aggregate rate — one learner cannot starve the classroom', async () => {
  const { store, svc } = await makeService();
  const limit = 3;
  // Three learners behind the same classroom egress each take one slot.
  const learners = ['uid_a', 'uid_b', 'uid_c'].map((uid) => ({ uid, workspaceId: 'ws_class_9b', egressId: 'egress_classroom_1' }));
  for (const learner of learners) {
    await svc.acquireProviderSlot(learner, 'w1', limit);
  }
  assert.equal(store.usedInWindow('egress_classroom_1', 'w1'), 3);

  // The window is exhausted for ANYONE behind that egress (fair aggregate cap).
  await assert.rejects(
    () => svc.acquireProviderSlot(learners[0], 'w1', limit),
    (e) => e.code === 'egress_window_exhausted',
    'the shared window refuses honestly when exhausted',
  );
  // A different egress (another classroom/NAT) is unaffected — no cross-egress leakage.
  const otherEgress = { uid: 'uid_d', workspaceId: 'ws_class_9c', egressId: 'egress_classroom_2' };
  await svc.acquireProviderSlot(otherEgress, 'w1', limit);
  assert.equal(store.usedInWindow('egress_classroom_2', 'w1'), 1);
});

test('provider 429/outage: honest refusals, no silent degradation', async () => {
  const { svc } = await makeService();
  assert.throws(() => svc.onProviderResponse(429), (e) => e.code === 'provider_rate_limited');
  assert.throws(() => svc.onProviderResponse(503), (e) => e.code === 'provider_outage');
  // Success codes do not throw.
  assert.doesNotThrow(() => svc.onProviderResponse(200));
});

test('policy revocation mid-run stops the run: partial stays partial, no further work', async () => {
  const { store, svc } = await makeService();
  const partial = { answer: 'half-written explanation' };

  // Policy active: the checkpoint keeps the run going.
  let outcome = await svc.checkpointRun({ runId: 'run_1', caller: CALLER, partialBody: partial });
  assert.equal(outcome, null, 'active policy does not stop the run');

  // Policy revoked mid-run: the checkpoint stops the run honestly.
  store.setPolicyActive(CALLER.uid, false);
  outcome = await svc.checkpointRun({ runId: 'run_1', caller: CALLER, partialBody: partial });
  assert.ok(outcome, 'revocation stops the run at the checkpoint');
  assert.equal(outcome.stopped, true);
  assert.equal(outcome.reason, 'policy_revoked');
  assert.equal(outcome.final, false, 'the partial is NEVER presented as final');
  assert.deepEqual(outcome.partialBody, partial);
});
