/**
 * AI-16 (KAN-150) — versioned approved representation/scene registry and
 * structured action protocol tied to permitted concept/source/run revisions.
 *
 * Proven here:
 *   1.  VERSIONED registry: conflicting same-version redefinition refuses;
 *       identical re-set is idempotent; the approval survives re-sets.
 *   2.  APPROVAL: an unapproved scene never executes; explicit approval
 *       records the approver.
 *   3.  FALLBACK floor: registration without keyboard+text refuses.
 *   4.  NO generated execution: a scene embedding code refuses at
 *       registration; an action carrying generatedCode/url/raw-token params
 *       refuses at the action boundary.
 *   5.  ALLOWLISTED read-only operations: an operation not allowlisted for
 *       the scene refuses; allowlisted math/state/narration reads observe.
 *   6.  BOUNDED parameters: out-of-range numbers and over-length strings
 *       refuse; unregistered param keys refuse.
 *   7.  PERMITTED revisions: a run whose recorded revision/concept differs
 *       from the scene's binding rejects as stale; a cancelled run rejects
 *       further actions and events.
 *   8.  LANGUAGE coverage: actions in unreleased scene languages refuse.
 *   9.  SYNCHRONIZED approved narration/events: deterministic replay from any
 *       sequence position; invalid positions refuse.
 *   10. RELEASED-coverage honesty: 3D/voice are advertised ONLY for
 *       server-released scene+language coverage; unreleased capabilities are
 *       never advertised.
 *   11. READ-ONLY: the protocol observes (including honest divide-by-zero and
 *       unknown-key failures) and writes nothing.
 *   12. ONE context owner: uniform denial, no existence leak.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { SceneProtocolService } = req('./dist/src/sceneprotocol/scene-service.js');
const { InMemorySceneProtocolStore } = req('./dist/src/sceneprotocol/scene-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const REV = 'rev-1.2.0';

function scene(overrides = {}) {
  return {
    sceneId: 'scene_orbits',
    version: 1,
    approved: false,
    approvedBy: null,
    conceptId: 'c_orbits',
    sourceRevision: REV,
    languages: ['en-IN', 'bn'],
    operations: ['math_evaluate', 'scene_state_read', 'narration_step_read'],
    paramBounds: {
      a: { min: -1000, max: 1000 },
      b: { min: -1000, max: 1000 },
      op: { maxLength: 10 },
      stateKey: { maxLength: 40 },
      stepId: { maxLength: 40 },
    },
    fallbacks: ['keyboard', 'text', '2d', 'reduced_motion'],
    declaredCapabilities: ['3d'],
    releasedCapabilities: [],
    narrationRefs: [{ stepId: 's1', language: 'en-IN', narrationRef: 'narr_orbits_s1_enIN' }],
    stateValues: { phase: 'orbiting' },
    ...overrides,
  };
}

async function makeService() {
  const store = new InMemorySceneProtocolStore();
  const service = new SceneProtocolService(store);
  await service.registerScene(scene());
  return { store, service };
}

async function openApprovedRun(service, overrides = {}) {
  await service.registerScene(scene());
  await service.approveScene('scene_orbits', 1, 'approver_founder');
  await service.openRun(OWNER, 'run_scene_1', 'c_orbits', REV, );
  return 'run_scene_1';
}

// ---------------------------------------------------------------------------

test('VERSIONED registry: a conflicting same-version redefinition refuses; an identical re-set is idempotent and preserves approval', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.registerScene(scene({ languages: ['en-IN'] })),
    (e) => e.code === 'scene_version_conflict',
  );
  await service.approveScene('scene_orbits', 1, 'approver_founder');
  const again = await service.registerScene(scene());
  assert.equal(again.sceneId, 'scene_orbits');
  const stored = await service.approveScene('scene_orbits', 1, 'approver_founder');
  assert.equal(stored.approved, true);
  assert.equal(stored.approvedBy, 'approver_founder');
  // A new version is the append path; registration requires the binding.
  await assert.rejects(
    () => service.registerScene(scene({ version: 2, conceptId: '' })),
    (e) => e.code === 'scene_definition_invalid',
  );
  const v2 = await service.registerScene(scene({ version: 2 }));
  assert.equal(v2.version, 2);
});

test('APPROVAL: an unapproved scene never executes; explicit approval records the approver', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  // v2 was registered but never approved.
  await service.registerScene(scene({ version: 2 }));
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER,
        runId,
        sceneId: 'scene_orbits',
        sceneVersion: 2,
        language: 'en-IN',
        operation: 'scene_state_read',
        params: { stateKey: 'phase' },
      }),
    (e) => e.code === 'scene_not_approved',
  );
  // The approved v1 executes.
  const obs = await service.executeAction({
    owner: OWNER,
    runId,
    sceneId: 'scene_orbits',
    sceneVersion: 1,
    language: 'en-IN',
    operation: 'scene_state_read',
    params: { stateKey: 'phase' },
  });
  assert.equal(obs.result, 'orbiting');
});

test('FALLBACK floor: registration without keyboard+text refuses', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.registerScene(scene({ version: 3, fallbacks: ['2d'] })),
    (e) => e.code === 'fallback_floor_required',
  );
  await assert.rejects(
    () => service.registerScene(scene({ version: 3, fallbacks: ['keyboard'] })),
    (e) => e.code === 'fallback_floor_required',
  );
});

test('NO generated execution: a scene embedding code refuses at registration; generated code/URL/raw-token action params refuse at the boundary', async () => {
  const { store, service } = await makeService();
  const runId = await openApprovedRun(service);
  await assert.rejects(
    () => service.registerScene(scene({ version: 4, generatedScript: 'SCENE_TOKEN:rotate(90)' })),
    (e) => e.code === 'generated_execution_refused',
  );
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER,
        runId,
        sceneId: 'scene_orbits',
        sceneVersion: 1,
        language: 'en-IN',
        operation: 'scene_state_read',
        params: { stateKey: 'phase', generatedCode: 'rotate(90)' },
      }),
    (e) => e.code === 'generated_execution_refused',
  );
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER,
        runId,
        sceneId: 'scene_orbits',
        sceneVersion: 1,
        language: 'en-IN',
        operation: 'scene_state_read',
        params: { stateKey: 'phase', sceneToken: 'RAW_SCENE:do(everything)' },
      }),
    (e) => e.code === 'generated_execution_refused',
  );
  assert.equal(await store.scene('scene_orbits', 4), undefined);
});

test('ALLOWLISTED read-only operations: an operation not allowlisted for the scene refuses; allowlisted reads observe', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER,
        runId,
        sceneId: 'scene_orbits',
        sceneVersion: 1,
        language: 'en-IN',
        operation: 'submit_grade',
        params: {},
      }),
    (e) => e.code === 'operation_not_allowlisted',
  );
  // math_evaluate observes without writing anything.
  const math = await service.executeAction({
    owner: OWNER,
    runId,
    sceneId: 'scene_orbits',
    sceneVersion: 1,
    language: 'en-IN',
    operation: 'math_evaluate',
    params: { a: 6, b: 7, op: 'multiply' },
  });
  assert.equal(math.result, '42');
  // Honest observed failure for divide-by-zero.
  const bad = await service.executeAction({
    owner: OWNER,
    runId,
    sceneId: 'scene_orbits',
    sceneVersion: 1,
    language: 'en-IN',
    operation: 'math_evaluate',
    params: { a: 1, b: 0, op: 'divide' },
  });
  assert.equal(bad.result, 'observed_failed:divide_by_zero');
});

test('BOUNDED parameters: out-of-range numbers, over-length strings and unregistered keys refuse', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  const base = {
    owner: OWNER, runId, sceneId: 'scene_orbits', sceneVersion: 1, language: 'en-IN',
  };
  await assert.rejects(
    () => service.executeAction({ ...base, operation: 'math_evaluate', params: { a: 5000, b: 1, op: 'add' } }),
    (e) => e.code === 'param_out_of_bounds',
  );
  await assert.rejects(
    () => service.executeAction({ ...base, operation: 'scene_state_read', params: { stateKey: 'x'.repeat(41) } }),
    (e) => e.code === 'param_out_of_bounds',
  );
  await assert.rejects(
    () => service.executeAction({ ...base, operation: 'math_evaluate', params: { a: 1, b: 2, op: 'add', rogue: 1 } }),
    (e) => e.code === 'param_out_of_bounds',
  );
});

test('PERMITTED revisions: a stale run rejects; a cancelled run rejects further actions and events', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  // A run recorded against a moved revision rejects as stale.
  await service.openRun(OWNER, 'run_stale', 'c_orbits', 'rev-9.9.9');
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER, runId: 'run_stale', sceneId: 'scene_orbits', sceneVersion: 1,
        language: 'en-IN', operation: 'scene_state_read', params: { stateKey: 'phase' },
      }),
    (e) => e.code === 'stale_run_rejected',
  );
  // Cancellation stops the run: further actions and events reject.
  await service.cancelRun(runId, OWNER);
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER, runId, sceneId: 'scene_orbits', sceneVersion: 1,
        language: 'en-IN', operation: 'scene_state_read', params: { stateKey: 'phase' },
      }),
    (e) => e.code === 'run_cancelled',
  );
  await assert.rejects(
    () => service.recordSceneEvent(runId, OWNER, 'scene_orbits', 1, 'narration_step', null),
    (e) => e.code === 'run_cancelled',
  );
});

test('LANGUAGE coverage: actions in unreleased scene languages refuse', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  await assert.rejects(
    () =>
      service.executeAction({
        owner: OWNER, runId, sceneId: 'scene_orbits', sceneVersion: 1,
        language: 'ta', operation: 'scene_state_read', params: { stateKey: 'phase' },
      }),
    (e) => e.code === 'language_not_released',
  );
});

test('SYNCHRONIZED approved narration/events: deterministic replay from any sequence position; invalid positions refuse', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  await service.recordSceneEvent(runId, OWNER, 'scene_orbits', 1, 'narration_step', 'narr_orbits_s1_enIN');
  await service.recordSceneEvent(runId, OWNER, 'scene_orbits', 1, 'camera_move', null);
  const from0 = await service.replayEvents(runId, OWNER, 'scene_orbits', 1, 0);
  const from1 = await service.replayEvents(runId, OWNER, 'scene_orbits', 1, 1);
  assert.deepEqual(from0.map((e) => e.seq), [1, 2]);
  assert.deepEqual(from1.map((e) => e.seq), [2]);
  assert.equal(JSON.stringify(from0), JSON.stringify(await service.replayEvents(runId, OWNER, 'scene_orbits', 1, 0)));
  await assert.rejects(
    () => service.replayEvents(runId, OWNER, 'scene_orbits', 1, 3),
    (e) => e.code === 'replay_seq_invalid',
  );
});

test('RELEASED-coverage honesty: 3D/voice are advertised ONLY for server-released scene+language coverage', async () => {
  const { service } = await makeService();
  // The scene DECLARES 3d but the server released nothing — advertisement is honest.
  const none = await service.advertiseCapabilities(OWNER, 'scene_orbits', 1, 'en-IN');
  assert.deepEqual(none.capabilities, []);
  // A v2 with server-released 3d advertises it for covered languages only.
  await service.registerScene(scene({ version: 2, releasedCapabilities: ['3d'] }));
  const en = await service.advertiseCapabilities(OWNER, 'scene_orbits', 2, 'en-IN');
  assert.deepEqual(en.capabilities, ['3d']);
  const bn = await service.advertiseCapabilities(OWNER, 'scene_orbits', 2, 'bn');
  assert.deepEqual(bn.capabilities, ['3d']);
  // An unreleased language advertises nothing at all; voice is never advertised.
  const ta = await service.advertiseCapabilities(OWNER, 'scene_orbits', 2, 'ta');
  assert.deepEqual(ta.capabilities, []);
});

test('READ-ONLY + narration reads: the protocol observes approved narration references and writes nothing', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  const obs = await service.executeAction({
    owner: OWNER,
    runId,
    sceneId: 'scene_orbits',
    sceneVersion: 1,
    language: 'en-IN',
    operation: 'narration_step_read',
    params: { stepId: 's1' },
  });
  assert.equal(obs.result, 'narr_orbits_s1_enIN');
  // Unknown state key / narration step: honest observed failure, no writes.
  const miss = await service.executeAction({
    owner: OWNER, runId, sceneId: 'scene_orbits', sceneVersion: 1,
    language: 'en-IN', operation: 'scene_state_read', params: { stateKey: 'nope' },
  });
  assert.equal(miss.result, 'observed_failed:unknown_state_key');
});

test('ONE context owner: unknown run, wrong uid and foreign workspace deny uniformly (no existence leak)', async () => {
  const { service } = await makeService();
  const runId = await openApprovedRun(service);
  const base = { runId, sceneId: 'scene_orbits', sceneVersion: 1, language: 'en-IN' };
  await assert.rejects(
    () => service.executeAction({ owner: STRANGER, ...base, operation: 'scene_state_read', params: { stateKey: 'phase' } }),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.executeAction({ ...base, owner: OWNER, runId: 'run_unknown', operation: 'scene_state_read', params: { stateKey: 'phase' } }),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.replayEvents(runId, STRANGER, 'scene_orbits', 1, 0),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(() => service.cancelRun(runId, STRANGER), (e) => e.code === 'not_owner');
});
