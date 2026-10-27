/**
 * BUILD-01 (KAN-75) — private projects, immutable revisions/manifests,
 * conditional draft saves, history and restore-as-new-revision with
 * actor/workspace ownership.
 *
 * Proven here:
 *   1. projects are private and owner-scoped (wrong actor/workspace denied),
 *   2. conditional draft saves: revision-fenced; stale bases refused with
 *      visible local preservation and the current revision for rebase,
 *   3. revisions are immutable with SHA-256 manifests; history is append-only
 *      and byte-stable; tampered payloads are detectable,
 *   4. duplicate saves are idempotent by save id,
 *   5. restore-as-new-revision: restoring appends a new revision recording
 *      restoredFrom; history never rewrites.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { PrivateProjectService } = req('./dist/src/projects/project-service.js');
const { InMemoryProjectStore } = req('./dist/src/projects/project-lookups.js');

const OWNER = { uid: 'uid_builder_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

async function makeService() {
  const store = new InMemoryProjectStore();
  const svc = new PrivateProjectService(store);
  const project = await svc.createProject(OWNER, 'Solar system model');
  return { store, svc, project };
}

// ---------------------------------------------------------------------------

test('projects are private and owner-scoped: wrong uid and wrong workspace denied before anything persists', async () => {
  const { svc, project } = await makeService();
  const stranger = await svc.saveDraft({ projectId: project.projectId, owner: OTHER, saveId: 's1', payload: { x: 1 }, expectedBaseRevision: 0 });
  assert.equal(stranger.ok, false);
  assert.equal(stranger.reason, 'not_owner');
  assert.equal(stranger.preservedLocal, true);

  const wrongWs = await svc.saveDraft({ projectId: project.projectId, owner: { uid: OWNER.uid, workspaceId: 'ws_other' }, saveId: 's1', payload: { x: 1 }, expectedBaseRevision: 0 });
  assert.equal(wrongWs.reason, 'not_owner');

  const strangerHistory = await svc.history(project.projectId, OTHER);
  assert.equal(strangerHistory.ok, false);
  assert.equal(strangerHistory.reason, 'not_owner');
});

test('conditional draft saves: revision-fenced; stale base refused with visible preservation and rebase revision', async () => {
  const { svc, project } = await makeService();
  const first = await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's1', payload: { slide: 1 }, expectedBaseRevision: 0 });
  assert.equal(first.outcome, 'committed');
  assert.equal(first.revisionNo, 1);

  // Stale base (0 already consumed).
  const stale = await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's2', payload: { slide: 2 }, expectedBaseRevision: 0 });
  assert.equal(stale.ok, false);
  assert.equal(stale.reason, 'revision_conflict');
  assert.equal(stale.preservedLocal, true);
  assert.equal(stale.currentRevision, 1, 'current revision returned for rebase');

  // Rebased save commits.
  const rebased = await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's2', payload: { slide: 2 }, expectedBaseRevision: 1 });
  assert.equal(rebased.outcome, 'committed');
  assert.equal(rebased.revisionNo, 2);
});

test('revisions are immutable with SHA-256 manifests; history is append-only and byte-stable; tampering detectable', async () => {
  const { store, svc, project } = await makeService();
  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's1', payload: { slide: 1 } , expectedBaseRevision: 0 });
  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's2', payload: { slide: 2 }, expectedBaseRevision: 1 });

  let history = await svc.history(project.projectId, OWNER);
  assert.equal(history.length, 2);
  const snapshot = JSON.stringify(history);
  for (const rev of history) {
    assert.ok(PrivateProjectService.verifyManifest(rev), 'manifest digest matches payload');
  }

  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's3', payload: { slide: 3 }, expectedBaseRevision: 2 });
  history = await svc.history(project.projectId, OWNER);
  assert.equal(history.length, 3, 'append-only growth');
  assert.equal(JSON.stringify(history.slice(0, 2)), snapshot, 'earlier revisions byte-stable');

  // Tampering detection: mutate a payload copy, digest no longer matches.
  const tampered = { ...history[0], payload: { slide: 999 } };
  assert.equal(PrivateProjectService.verifyManifest(tampered), false, 'tampered payload detected by manifest digest');
});

test('duplicate saves are idempotent by save id: same revision returned, no duplicate row', async () => {
  const { store, svc, project } = await makeService();
  const first = await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 'save_retry', payload: { doc: 'v1' }, expectedBaseRevision: 0 });
  assert.equal(first.outcome, 'committed');
  const replay = await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 'save_retry', payload: { doc: 'v1' }, expectedBaseRevision: 0 });
  assert.equal(replay.outcome, 'duplicate');
  assert.equal(replay.revisionNo, first.revisionNo);
  const history = await svc.history(project.projectId, OWNER);
  assert.equal(history.length, 1, 'no duplicate revision row');
});

test('restore-as-new-revision: restoring an earlier revision appends a NEW revision recording restoredFrom; history never rewrites', async () => {
  const { svc, project } = await makeService();
  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's1', payload: { doc: 'v1' }, expectedBaseRevision: 0 });
  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's2', payload: { doc: 'v2' }, expectedBaseRevision: 1 });
  await svc.saveDraft({ projectId: project.projectId, owner: OWNER, saveId: 's3', payload: { doc: 'v3' }, expectedBaseRevision: 2 });
  const before = await svc.history(project.projectId, OWNER);
  const beforeSnapshot = JSON.stringify(before);

  const restored = await svc.restore({ projectId: project.projectId, owner: OWNER, saveId: 'restore_1', fromRevisionNo: 1, expectedBaseRevision: 3 });
  assert.equal(restored.outcome, 'committed');
  assert.equal(restored.revisionNo, 4, 'restore APPENDS a new revision');
  assert.equal(restored.manifest.restoredFrom, 1, 'manifest records the restore provenance');

  const history = await svc.history(project.projectId, OWNER);
  assert.equal(history.length, 4);
  assert.equal(JSON.stringify(history.slice(0, 3)), beforeSnapshot, 'history never rewritten by restore');
  assert.deepEqual(history[3].payload, { doc: 'v1' }, 'restored content matches the source revision');
  assert.ok(PrivateProjectService.verifyManifest(history[3]), 'restored revision manifest intact');

  await assert.rejects(
    () => svc.restore({ projectId: project.projectId, owner: OWNER, saveId: 'restore_2', fromRevisionNo: 99, expectedBaseRevision: 4 }),
    (e) => e.code === 'unknown_revision',
  );
});
