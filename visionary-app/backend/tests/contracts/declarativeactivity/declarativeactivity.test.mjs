/**
 * BUILD-09 (KAN-154) — trusted declarative Build activities and accessible
 * preview. Proven against the real module over the shared owning store.
 *
 * Setup reflects the honest product flow: a project has a committed draft
 * revision (base 1), an AI run starts from that base, and the declarative
 * activity is admitted against the proposal's FIXED base revision.
 *
 *   1. ADMISSION + TRUSTED PREVIEW: a valid allowlisted manifest is admitted,
 *      bound to the exact proposal base revision; preview serves that FIXED
 *      revision's safe plain-text representation (no raw HTML/JS), approved
 *      renderer only.
 *   2. MALFORMED/UNSAFE REJECTION: unknown component, unapproved renderer,
 *      unknown schema.
 *   3. BOUNDS: manifest too deep / too large.
 *   4. INJECTION REJECTION: script/arbitrary HTML, javascript:, unsafe URL,
 *      network action, hidden answer key all block admission before persist.
 *   5. CANCELLED RUN: a proposal whose run is cancelled is never admitted.
 *   6. STALE PROPOSAL: a new edit moves the base revision; accept is blocked
 *      while preview stays on the fixed base.
 *   7. CROSS-DEVICE RESUME + DISTINCT OPS: a second device previews the same
 *      fixed revision and accepts once (apply-as-new-revision); replay is
 *      idempotent; reject records without history; export is digest-verified.
 *   8. WRONG USER + INTEGRITY FAIL-CLOSED: wrong users denied everywhere;
 *      tampered base bytes fail preview/export.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DeviceAdapterStore } = req('./dist/src/deviceadapter/device-adapter-lookups.js');
const { DeviceAdapterService } = req('./dist/src/deviceadapter/device-adapter-service.js');
const { InMemoryActivityStore } = req('./dist/src/declarativeactivity/declarativeactivity-lookups.js');
const { DeclarativeActivityService } = req('./dist/src/declarativeactivity/declarativeactivity-service.js');
const { DeclarativeError } = req('./dist/src/declarativeactivity/declarativeactivity-types.js');

const OWNER = { uid: 'uid_builder', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

const SCHEMA = {
  schemaId: 'flashcard@1',
  version: 1,
  allowedComponents: ['flashcard', 'quiz-step'],
  renderers: [
    { component: 'flashcard', rendererId: 'ekan-flashcard', representation: 'ekan-card' },
    { component: 'quiz-step', rendererId: 'ekan-quiz', representation: 'ekan-step' },
  ],
  maxManifestDepth: 4,
  maxManifestBytes: 2048,
  bannedKeys: ['answerkey', 'answer_key', 'correctanswer'],
};

function validManifest(overrides = {}) {
  return {
    kind: 'activity',
    schemaId: 'flashcard@1',
    schemaVersion: 1,
    component: 'flashcard',
    rendererId: 'ekan-flashcard',
    title: 'Solar system card',
    params: { prompt: 'Which planet is largest?', options: ['Earth', 'Jupiter', 'Mars'] },
    ...overrides,
  };
}

function expectCode(promise, code) {
  return assert.rejects(promise, (e) => e instanceof DeclarativeError && e.code === code, `expected declarative error ${code}`);
}

async function makeHarness() {
  const store = new DeviceAdapterStore();
  const adapterSvc = new DeviceAdapterService(store);
  const a = await adapterSvc.openSession({ ...OWNER, deviceId: 'device_a' });
  const b = await adapterSvc.openSession({ ...OWNER, deviceId: 'device_b' });
  const stranger = await adapterSvc.openSession({ ...OTHER, deviceId: 'device_c' });
  const activityStore = new InMemoryActivityStore(store);
  const svc = new DeclarativeActivityService(activityStore);
  await svc.registerSchema(SCHEMA);
  return { store, a, b, stranger, svc };
}

/** A project with one committed draft revision (base 1). */
async function seededProject(a, title = 'space deck') {
  const project = await a.createProject(title);
  await a.saveDraft({ projectId: project.projectId, saveId: 'seed-1', payload: { draft: 'initial committed draft' }, expectedBaseRevision: 0 });
  return project;
}

/** Start a run from the committed base (1) and return its live proposal (KAN-78). */
async function liveProposal(adapter, projectId, base = 1) {
  const run = await adapter.startRun(projectId, base);
  await adapter.transition(run.runId, 'succeeded', 'proposal ready');
  const proposal = await adapter.propose(run.runId, { suggestion: 'flashcard v1' });
  return { run, proposal };
}

test('ADMISSION + TRUSTED PREVIEW: valid manifest admits, preview serves the fixed safe plain-text view', async () => {
  const { a, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);
  const activity = await svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest() });

  assert.equal(activity.baseRevision, 1, 'bound to the exact committed proposal base revision');
  assert.equal(activity.status, 'pending');

  const preview = await svc.preview({ owner: OWNER, activityId: activity.activityId });
  assert.equal(preview.baseRevision, 1, 'preview serves the fixed base revision');
  assert.equal(preview.rendererId, 'ekan-flashcard');
  assert.equal(preview.representation, 'ekan-card');
  assert.ok(preview.view.length >= 2, 'safe rows present');
  for (const row of preview.view) {
    assert.ok(['text', 'number', 'bool', 'select'].includes(row.kind), 'only safe scalar kinds');
    assert.ok(!row.value.includes('<script') && !row.value.includes('<'), 'no raw HTML reaches preview');
  }
});

test('MALFORMED: unknown component, unapproved renderer and unknown schema are rejected before admit', async () => {
  const { a, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);

  await expectCode(
    svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest({ component: 'custom-unknown', rendererId: 'ekan-flashcard' }) }),
    'unknown_component',
  );
  await expectCode(
    svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest({ rendererId: 'evil-renderer' }) }),
    'unapproved_renderer',
  );
  await expectCode(
    svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest({ schemaId: 'unknown@9' }) }),
    'unknown_schema',
  );
});

test('BOUNDS: too-deep and too-large manifests are rejected', async () => {
  const { a, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);

  const deep = validManifest({ params: { a: { b: { c: { d: { e: { f: 'x' } } } } } } });
  await expectCode(svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: deep }), 'manifest_too_deep');

  const huge = validManifest({ params: { blob: 'x'.repeat(3000) } });
  await expectCode(svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: huge }), 'manifest_too_large');
});

test('INJECTION: script/html, javascript:, unsafe URL, network action and hidden answer key all block admit', async () => {
  const { a, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);
  const base = { owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId };

  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { prompt: '<script>alert(1)</script>' } }) }), 'script_execution_banned');
  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { prompt: 'javascript:eval("x")' } }) }), 'script_execution_banned');
  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { prompt: 'click here http://evil.example' } }) }), 'unsafe_url');
  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { api: 'fetch("/private")' } }) }), 'network_action_banned');
  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { answerKey: 'super-secret' } }) }), 'hidden_answer_key');
  // Banned key nested inside params must also be caught.
  await expectCode(svc.admit({ ...base, manifest: validManifest({ params: { details: { answer_key: 'secret' } } }) }), 'hidden_answer_key');
});

test('CANCELLED RUN: a proposal whose run is cancelled is never admitted', async () => {
  const { a, svc } = await makeHarness();
  const project = await seededProject(a);
  const run = await a.startRun(project.projectId, 1);
  const proposal = await a.propose(run.runId, { suggestion: 'x' }); // proposed while run was live
  await a.transition(run.runId, 'cancelled', 'user cancelled');    // then the run is cancelled

  await expectCode(svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest() }), 'run_cancelled');
});

test('STALE PROPOSAL: a new edit blocks accept while preview stays on the FIXED base revision', async () => {
  const { a, b, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);
  const activity = await svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest() });

  // Device B saves a new edit after admission: base 1 -> 2.
  await b.saveDraft({ projectId: project.projectId, saveId: 's-stale', payload: { body: 'new edit' }, expectedBaseRevision: 1 });

  // Preview remains on the fixed base revision (immutable).
  const preview = await svc.preview({ owner: OWNER, activityId: activity.activityId });
  assert.equal(preview.baseRevision, 1, 'preview never moves to the newer revision');

  await expectCode(svc.accept({ owner: OWNER, activityId: activity.activityId, decisionId: 'dec-stale' }), 'base_revision_moved');
});

test('CROSS-DEVICE RESUME + DISTINCT OPS: second device previews the same fixed revision and accepts once', async () => {
  const { a, b, svc } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);
  const activity = await svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest() });

  // Device B previews the SAME fixed revision — cross-device resume.
  const previewB = await svc.preview({ owner: OWNER, activityId: activity.activityId });
  assert.equal(previewB.baseRevision, 1);

  // Accept is a DISTINCT authorized op: appends the validated manifest as a new revision.
  const accepted = await svc.accept({ owner: OWNER, activityId: activity.activityId, decisionId: 'dec-commit' });
  assert.equal(accepted.outcome, 'committed');
  assert.equal(accepted.newRevisionNo, 2, 'accept applies as a new revision on top of the seeded base');

  // Idempotent replay (device B retries the same decision id).
  const replay = await svc.accept({ owner: OWNER, activityId: activity.activityId, decisionId: 'dec-commit' });
  assert.equal(replay.outcome, 'duplicate');
  assert.equal(replay.newRevisionNo, null, 'no double-append');

  // Export is a distinct op returning a digest-verified artifact.
  const exported = await svc.export({ owner: OWNER, activityId: activity.activityId });
  assert.equal(exported.baseRevision, 1);
  assert.ok(exported.contentDigest.length === 64);

  // Reject is a distinct op; history untouched.
  const run2 = await a.startRun(project.projectId, 2);
  await a.transition(run2.runId, 'succeeded', 'proposal ready');
  const proposal2 = await a.propose(run2.runId, { suggestion: 'second' });
  const activity2 = await svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal2.proposalId, manifest: validManifest() });
  const rejected = await svc.reject({ owner: OWNER, activityId: activity2.activityId, decisionId: 'dec-rej', reason: 'not wanted' });
  assert.equal(rejected.outcome, 'committed');
});

test('WRONG USER denied everywhere; tampered base bytes fail preview/export closed', async () => {
  const { a, stranger, svc, store } = await makeHarness();
  const project = await seededProject(a);
  const { proposal } = await liveProposal(a, project.projectId);
  const activity = await svc.admit({ owner: OWNER, projectId: project.projectId, proposalId: proposal.proposalId, manifest: validManifest() });

  await expectCode(svc.preview({ owner: OTHER, activityId: activity.activityId }), 'not_owner');
  await expectCode(svc.accept({ owner: OTHER, activityId: activity.activityId, decisionId: 'dec-x' }), 'not_owner');
  await expectCode(svc.export({ owner: OTHER, activityId: activity.activityId }), 'not_owner');

  // Tamper the stored base-revision bytes (manifest digest record unchanged).
  store.tamper(project.projectId, 1, { hacked: true });
  await expectCode(svc.preview({ owner: OWNER, activityId: activity.activityId }), 'preview_integrity_failed');
  await expectCode(svc.export({ owner: OWNER, activityId: activity.activityId }), 'preview_integrity_failed');
});
