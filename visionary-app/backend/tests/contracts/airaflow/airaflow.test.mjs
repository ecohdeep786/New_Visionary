/**
 * AI-14 (KAN-143) — the AIRA deterministic teaching/workflow harness over the
 * durable run protocol: one context owner, typed allowlisted tools, server
 * policy checks per call, pinned versions, bounded branches/retries,
 * checkpoint/restart, explicit pause/resume/approval and stop conditions, and
 * exactly-once accepted product side effects with measured usage. No
 * autonomous charging/publishing/grading/private-data access; model
 * plans/memory stay provisional.
 *
 * Proven here:
 *   1.  ONE context owner: wrong uid, unknown run and foreign workspace are
 *       denied uniformly (no existence leak).
 *   2.  TYPED ALLOWLISTED tools only; the typed plan is schema-checked at intake.
 *   3.  BANNED product families (charging/publishing/grading/private-data) are
 *       refused at registration — autonomous product acts are not expressible.
 *   4.  SERVER capability checks on EVERY call (a past grant is never assumed).
 *   5.  PINNED versions: server-recorded drift refuses; pins stay immutable.
 *   6.  BOUNDED branches (step budget) and retries (attempt bound).
 *   7.  EXPLICIT pause/resume/approval; only the owner's approval resumes.
 *   8.  CHECKPOINT/RESTART: resume from the LAST checkpoint, byte-stable.
 *   9.  EXACTLY-ONCE product effects: a crash-window retry converges to
 *       duplicate; the effect applies exactly once; usage is debited once.
 *   10. MEASURED usage equals executed costs; usage exhaustion is a terminal
 *       stop condition.
 *   11. SAFE replanning only after an OBSERVED failure, within the branch bound.
 *   12. MODEL plans stay provisional: unexecuted steps produce no product state.
 *   13. STOP conditions: owner stop and final-step success are terminal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { AiraFlowService } = req('./dist/src/airaflow/airaflow-service.js');
const { InMemoryAiraFlowStore } = req('./dist/src/airaflow/airaflow-lookups.js');
const { AiraFlowError } = req('./dist/src/airaflow/airaflow-types.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const FOREIGN_WS = { uid: 'uid_learner_1', workspaceId: 'ws_other' };
const PINNED = {
  sourceRevision: 'rev-1.2.0',
  model: 'model-x@2',
  prompt: 'prompt-y@3',
  toolRegistry: 'registry-v1',
};

async function makeHarness() {
  const store = new InMemoryAiraFlowStore();
  store.setVersions('rev-1.2.0', 'registry-v1');
  store.seedUsage(OWNER, 100);
  const service = new AiraFlowService(store);
  await service.registerTool({
    tool: 'retrieve',
    family: 'retrieval',
    requiredParams: ['query'],
    effect: 'read_only',
    capability: 'airaflow.retrieve',
    requiresApproval: false,
    usageCost: 1,
  });
  await service.registerTool({
    tool: 'compose_hint',
    family: 'composition',
    requiredParams: ['conceptId'],
    effect: 'read_only',
    capability: 'airaflow.compose',
    requiresApproval: false,
    usageCost: 2,
  });
  await service.registerTool({
    tool: 'record_draft',
    family: 'draft_notification',
    requiredParams: ['draftId'],
    effect: 'product_effect',
    capability: 'airaflow.draft',
    requiresApproval: true,
    usageCost: 3,
  });
  await service.registerTool({
    tool: 'save_revision',
    family: 'composition',
    requiredParams: ['revisionPayload'],
    effect: 'product_effect',
    capability: 'airaflow.compose',
    requiresApproval: false,
    usageCost: 2,
  });
  await service.grantCapability(OWNER, 'airaflow.retrieve');
  await service.grantCapability(OWNER, 'airaflow.compose');
  await service.grantCapability(OWNER, 'airaflow.draft');
  return { store, service };
}

// ---------------------------------------------------------------------------

test('ONE context owner: wrong uid, unknown run and foreign workspace are denied uniformly (no existence leak)', async () => {
  const { service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  // Wrong uid, unknown run and foreign workspace all deny with the SAME code.
  await assert.rejects(
    () => service.executeStep(flow.runId, STRANGER, flow.steps[0].stepId),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.executeStep('flow_unknown', OWNER, 'any_step'),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.executeStep(flow.runId, FOREIGN_WS, flow.steps[0].stepId),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(() => service.stop(flow.runId, STRANGER, 'x'), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.restart(flow.runId, FOREIGN_WS), (e) => e.code === 'not_owner');
  await assert.rejects(
    () => service.approveStep(flow.runId, STRANGER, flow.steps[0].stepId),
    (e) => e.code === 'not_owner',
  );
});

test('TYPED ALLOWLISTED tools only; the typed plan is schema-checked at intake', async () => {
  const { service } = await makeHarness();
  // An unregistered tool refuses at start (nothing runs outside the allowlist).
  await assert.rejects(
    () =>
      service.startFlow(OWNER, 'proj_1', PINNED, [
        { tool: 'make_payment', params: { amount: 1 } },
      ]),
    (e) => e.code === 'tool_not_allowlisted',
  );
  // A plan step missing its typed required param refuses at intake.
  await assert.rejects(
    () => service.startFlow(OWNER, 'proj_1', PINNED, [{ tool: 'retrieve', params: {} }]),
    (e) => e.code === 'schema_invalid',
  );
  // An empty plan refuses.
  await assert.rejects(
    () => service.startFlow(OWNER, 'proj_1', PINNED, []),
    (e) => e.code === 'plan_empty',
  );
});

test('BANNED product families are refused at registration — autonomous charging/publishing/grading/private-data access is not expressible', async () => {
  const { service } = await makeHarness();
  for (const family of ['charging', 'publishing', 'grading', 'private_data']) {
    await assert.rejects(
      () =>
        service.registerTool({
          tool: `banned_${family}`,
          family,
          requiredParams: [],
          effect: 'product_effect',
          capability: 'airaflow.banned',
          requiresApproval: false,
          usageCost: 0,
        }),
      (e) => e.code === 'tool_forbidden',
      `family ${family} must never enter the registry`,
    );
  }
});

test('SERVER capability checks on EVERY call: an ungranted capability refuses even when allowlisted, owned and schema-valid', async () => {
  const { store, service } = await makeHarness();
  // A fresh owner with NO capabilities.
  const poorOwner = { uid: 'uid_learner_2', workspaceId: 'ws_personal' };
  store.seedUsage(poorOwner, 100);
  const flow = await service.startFlow(poorOwner, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  await assert.rejects(
    () => service.executeStep(flow.runId, poorOwner, flow.steps[0].stepId),
    (e) => e.code === 'capability_required',
  );
  // The step stayed pending; the flow stayed running (no silent skip).
  const after = await service.getFlow(flow.runId, poorOwner);
  assert.equal(after.status, 'running');
  assert.equal(after.steps[0].status, 'pending');
  // Granting the capability server-side lets the SAME call proceed.
  await service.grantCapability(poorOwner, 'airaflow.retrieve');
  const result = await service.executeStep(flow.runId, poorOwner, flow.steps[0].stepId);
  assert.equal(result.observation.outcome, 'succeeded');
});

test('PINNED versions: server-recorded drift refuses every call; the pins stay immutable after start', async () => {
  const { store, service } = await makeHarness();
  // Starting against drifted server-recorded versions refuses outright.
  store.setVersions('rev-9.9.9', 'registry-v1');
  await assert.rejects(
    () => service.startFlow(OWNER, 'proj_1', PINNED, [{ tool: 'retrieve', params: { query: 'x' } }]),
    (e) => e.code === 'version_drift',
  );
  store.setVersions('rev-1.2.0', 'registry-v1');
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  // Source revision drift refuses the call.
  store.setVersions('rev-2.0.0', 'registry-v1');
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'version_drift',
  );
  // Registry version drift refuses too.
  store.setVersions('rev-1.2.0', 'registry-v2');
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'version_drift',
  );
  // The pins were never mutated (no silent version drift).
  const current = await service.getFlow(flow.runId, OWNER);
  assert.deepEqual(current.pinned, PINNED);
});

test('BOUNDED branches/retries: the step budget bounds the whole flow; a step retried beyond the attempt bound refuses', async () => {
  const { store, service } = await makeHarness();
  const bigPlan = Array.from({ length: 9 }, () => ({ tool: 'retrieve', params: { query: 'x' } }));
  await assert.rejects(
    () => service.startFlow(OWNER, 'proj_1', PINNED, bigPlan),
    (e) => e.code === 'branch_bound_exceeded',
  );

  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'flaky' } },
    { tool: 'compose_hint', params: { conceptId: 'c_x' } },
  ]);
  store.queueToolFailures('retrieve', 2);
  const first = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(first.observation.outcome, 'failed');
  const second = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(second.observation.outcome, 'failed');
  assert.equal(second.flow.steps[0].attempt, 2);
  // The third attempt exceeds the bound — never an open retry loop.
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'retry_bound_exceeded',
  );
});

test('EXPLICIT pause/resume/approval: an approval-required tool pauses the run; only the OWNER resumes it', async () => {
  const { service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'record_draft', params: { draftId: 'd_1' } },
    { tool: 'retrieve', params: { query: 'orbits' } },
  ]);
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'approval_required',
  );
  const paused = await service.getFlow(flow.runId, OWNER);
  assert.equal(paused.status, 'paused_awaiting_approval');
  assert.equal(paused.steps[0].status, 'awaiting_approval');
  // While paused, further execution refuses.
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[1].stepId),
    (e) => e.code === 'flow_not_active',
  );
  // A non-owner cannot approve (and approval_not_pending guards stray approvals).
  await assert.rejects(
    () => service.approveStep(flow.runId, STRANGER, flow.steps[0].stepId),
    (e) => e.code === 'not_owner',
  );
  // The owner's explicit approval resumes the run.
  await service.approveStep(flow.runId, OWNER, flow.steps[0].stepId);
  const resumed = await service.getFlow(flow.runId, OWNER);
  assert.equal(resumed.status, 'running');
  assert.equal(resumed.steps[0].status, 'approved');
  const result = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(result.observation.outcome, 'succeeded');
  assert.equal(result.observation.effect, 'applied');
});

test('CHECKPOINT/RESTART: a restart resumes from the LAST checkpoint — succeeded steps byte-stable, lost state restored', async () => {
  const { store, service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  const executed = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  const beforeCrash = executed.flow;

  // Simulate a crash that lost the in-flight state: overwrite the current
  // flow with the pre-execution checkpoint state.
  const stale = await store.restoreLatestCheckpoint(flow.runId); // latest = post-execution here
  assert.equal(stale.steps[0].status, 'succeeded');
  const corrupted = JSON.parse(JSON.stringify(stale));
  corrupted.steps[0].status = 'pending';
  corrupted.steps[0].observed = null;
  corrupted.measuredUsage = 0;
  await store.saveFlow(corrupted);

  const restored = await service.restart(flow.runId, OWNER);
  // The last checkpoint's accepted state is restored byte-stably.
  assert.equal(restored.steps[0].status, 'succeeded');
  assert.deepEqual(restored.steps[0].observed, beforeCrash.steps[0].observed);
  assert.equal(restored.measuredUsage, beforeCrash.measuredUsage);
  assert.deepEqual(restored.pinned, beforeCrash.pinned);
  assert.equal(restored.steps[1].status, 'pending');
  // Work continues from the restored state.
  const next = await service.executeStep(flow.runId, OWNER, restored.steps[1].stepId);
  assert.equal(next.observation.outcome, 'succeeded');
  assert.equal(next.flow.status, 'succeeded');
});

test('EXACTLY-ONCE product effects: a crash-window retry converges to duplicate; the effect applies exactly once and usage is debited once', async () => {
  const { store, service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'save_revision', params: { revisionPayload: { doc: 'v1' } } },
  ]);
  // Crash window: capture the pre-execution checkpoint, then execute.
  const preExecution = await store.restoreLatestCheckpoint(flow.runId);
  assert.equal(preExecution.steps[0].status, 'pending');
  const first = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(first.observation.effect, 'applied');
  assert.equal(await store.effectCount(flow.runId, flow.steps[0].stepId), 1);
  assert.equal(await store.usageDebited(OWNER), 2);

  // Crash AFTER the effect was applied but BEFORE the state was saved:
  // the current flow state is lost back to the pre-execution snapshot while
  // the committed effect ledger survives (a separate authoritative ledger).
  await store.saveFlow(JSON.parse(JSON.stringify(preExecution)));
  const lost = await service.getFlow(flow.runId, OWNER);
  assert.equal(lost.steps[0].status, 'pending');

  // The retry: the effect is NOT re-applied (duplicate), no second debit.
  const retry = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(retry.observation.outcome, 'succeeded');
  assert.equal(retry.observation.effect, 'duplicate');
  assert.equal(retry.observation.detail, 'exactly_once_duplicate_preserved');
  assert.equal(await store.effectCount(flow.runId, flow.steps[0].stepId), 1);
  assert.equal(await store.usageDebited(OWNER), 2);
  assert.equal(retry.flow.status, 'succeeded');
});

test('MEASURED usage: the flow measures executed costs; exhausting the usage budget is a terminal stop condition', async () => {
  const { store, service } = await makeHarness();
  const budgetOwner = { uid: 'uid_budget', workspaceId: 'ws_personal' };
  store.seedUsage(budgetOwner, 1); // enough for one retrieve (cost 1) only
  await service.grantCapability(budgetOwner, 'airaflow.retrieve');
  await service.grantCapability(budgetOwner, 'airaflow.compose');
  const flow = await service.startFlow(budgetOwner, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  await service.executeStep(flow.runId, budgetOwner, flow.steps[0].stepId);
  const afterFirst = await service.getFlow(flow.runId, budgetOwner);
  assert.equal(afterFirst.measuredUsage, 1);
  await assert.rejects(
    () => service.executeStep(flow.runId, budgetOwner, flow.steps[1].stepId),
    (e) => e.code === 'usage_exhausted',
  );
  const stopped = await service.getFlow(flow.runId, budgetOwner);
  assert.equal(stopped.status, 'stopped');
  // Terminal: no further transitions after the budget stop.
  await assert.rejects(
    () => service.executeStep(flow.runId, budgetOwner, flow.steps[1].stepId),
    (e) => e.code === 'flow_not_active',
  );
  // The measured usage ledger debited exactly the executed cost.
  assert.equal(await store.usageDebited(budgetOwner), 1);
});

test('SAFE replanning: a replacement is accepted only after an OBSERVED failure and stays within the branch bound', async () => {
  const { store, service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'flaky' } },
    { tool: 'retrieve', params: { query: 'steady' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  // Replanning a PENDING step refuses — replans follow observed failures only.
  await assert.rejects(
    () =>
      service.replan(flow.runId, OWNER, flow.steps[0].stepId, {
        tool: 'compose_hint',
        params: { conceptId: 'c_fallback' },
      }),
    (e) => e.code === 'replan_requires_observed_failure',
  );
  // Observe a real failure.
  store.queueToolFailures('retrieve', 1);
  const failed = await service.executeStep(flow.runId, OWNER, flow.steps[0].stepId);
  assert.equal(failed.observation.outcome, 'failed');
  assert.equal(failed.observation.detail, 'provider_error');
  // Now the replan is accepted, records what it replaces, and stays in bounds.
  const replanned = await service.replan(flow.runId, OWNER, flow.steps[0].stepId, {
    tool: 'compose_hint',
    params: { conceptId: 'c_fallback' },
  });
  assert.equal(replanned.steps.length, 4);
  const replacement = replanned.steps[3];
  assert.equal(replacement.replacesStepId, flow.steps[0].stepId);
  assert.equal(replacement.provisional, true);
  assert.equal(replacement.status, 'pending');
  const executed = await service.executeStep(flow.runId, OWNER, replacement.stepId);
  assert.equal(executed.observation.outcome, 'succeeded');
  // The observed failure keeps the run open (the failed step is terminal, the
  // pending steps are not), so the owner decides when the work is done.
  assert.equal(executed.flow.status, 'running');
  // Replanning a SUCCEEDED step refuses — only observed failures replan.
  await assert.rejects(
    () =>
      service.replan(flow.runId, OWNER, replacement.stepId, {
        tool: 'retrieve',
        params: { query: 'x' },
      }),
    (e) => e.code === 'replan_requires_observed_failure',
  );
  // The remaining steps complete the flow deterministically.
  await service.executeStep(flow.runId, OWNER, executed.flow.steps[1].stepId);
  const final = await service.executeStep(flow.runId, OWNER, executed.flow.steps[2].stepId);
  assert.equal(final.flow.status, 'succeeded');
});

test('MODEL plans stay provisional: unexecuted steps produce no product state and no usage', async () => {
  const { store, service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'save_revision', params: { revisionPayload: { doc: 'v1' } } },
    { tool: 'save_revision', params: { revisionPayload: { doc: 'v2' } } },
  ]);
  const fresh = await service.getFlow(flow.runId, OWNER);
  // Both plan steps are model-proposed and provisional.
  assert.equal(fresh.steps.every((s) => s.provisional && s.origin === 'model_plan'), true);
  // No product effect exists for any unexecuted step; no usage was spent.
  assert.equal(await store.effectCount(flow.runId, fresh.steps[0].stepId), 0);
  assert.equal(await store.effectCount(flow.runId, fresh.steps[1].stepId), 0);
  assert.equal(await store.usageDebited(OWNER), 0);
  assert.equal(fresh.measuredUsage, 0);
  // Executing the first step turns exactly that step into observed state.
  await service.executeStep(flow.runId, OWNER, fresh.steps[0].stepId);
  assert.equal(await store.effectCount(flow.runId, fresh.steps[0].stepId), 1);
  assert.equal(await store.effectCount(flow.runId, fresh.steps[1].stepId), 0);
  const after = await service.getFlow(flow.runId, OWNER);
  assert.equal(after.steps[0].provisional, false);
  assert.equal(after.steps[1].provisional, true);
});

test('STOP conditions: an owner stop is terminal, and final-step success completes the flow', async () => {
  const { service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  const stopped = await service.stop(flow.runId, OWNER, 'owner_requested');
  assert.equal(stopped.status, 'stopped');
  // Terminal: a stopped run accepts no further transitions.
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'flow_not_active',
  );
  await assert.rejects(
    () => service.approveStep(flow.runId, OWNER, flow.steps[0].stepId),
    (e) => e.code === 'flow_not_active',
  );
  await assert.rejects(
    () =>
      service.replan(flow.runId, OWNER, flow.steps[0].stepId, {
        tool: 'retrieve',
        params: { query: 'x' },
      }),
    (e) => e.code === 'flow_not_active',
  );

  const flow2 = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
    { tool: 'compose_hint', params: { conceptId: 'c_orbits' } },
  ]);
  await service.executeStep(flow2.runId, OWNER, flow2.steps[0].stepId);
  assert.equal((await service.getFlow(flow2.runId, OWNER)).status, 'running');
  const final = await service.executeStep(flow2.runId, OWNER, flow2.steps[1].stepId);
  // Final-step success is the natural stop condition: the flow is complete.
  assert.equal(final.flow.status, 'succeeded');
  await assert.rejects(
    () => service.stop(flow2.runId, OWNER, 'late_stop'),
    (e) => e.code === 'flow_not_active',
  );
});

test('the harness never executes an unknown step and reports unknown steps honestly', async () => {
  const { service } = await makeHarness();
  const flow = await service.startFlow(OWNER, 'proj_1', PINNED, [
    { tool: 'retrieve', params: { query: 'orbits' } },
  ]);
  await assert.rejects(
    () => service.executeStep(flow.runId, OWNER, 'flow_1_s999'),
    (e) => e.code === 'unknown_step',
  );
  assert.equal(flow.steps.length, 1);
});
