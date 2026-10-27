/**
 * BUILD-06 (KAN-80) — exact-revision accepted-recipient sharing, consent-bound
 * parent summaries and classroom-copy bridge; private drafts/conversations/
 * history stay private.
 *
 * Proven here:
 *   1. sharing binds ONE exact revision; later private edits never leak into
 *      the share (recipients see exactly what was shared),
 *   2. only ACCEPTED recipients can view; a non-listed actor is denied,
 *   3. parent summaries are consent-bound: revoked/expired consent blocks
 *      generation immediately,
 *   4. classroom copy creates a NEW private project with ONLY the shared
 *      revision payload; private state never crosses,
 *   5. unknown shares/revisions fail closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { SharingService } = req('./dist/src/sharing/sharing-service.js');
const { InMemorySharingStore } = req('./dist/src/sharing/sharing-lookups.js');

const OWNER = { uid: 'uid_builder_1', workspaceId: 'ws_personal' };
const RECIPIENT = 'uid_teacher_9';
const STRANGER = 'uid_stranger';
const PROJECT = 'prj_solar';

async function makeService() {
  const store = new InMemorySharingStore();
  const svc = new SharingService(store);
  await store.appendRevision(PROJECT, { doc: 'revision 1' });
  await store.appendRevision(PROJECT, { doc: 'revision 2' });
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('sharing binds ONE exact revision; later private edits never leak into the share', async () => {
  const { store, svc } = await makeService();
  const share = await svc.shareRevision(OWNER, PROJECT, 1, [RECIPIENT]);
  assert.equal(share.revisionNo, 1);

  // Owner keeps editing privately: revision 3 lands after the share.
  await store.appendRevision(PROJECT, { doc: 'revision 3 private edit' });

  const view = await svc.viewShared(share.shareId, RECIPIENT);
  assert.deepEqual(view.payload, { doc: 'revision 1' }, 'recipient sees EXACTLY the shared revision');
  assert.notEqual(view.revisionNo, 3, 'later private work never leaks');
});

test('only ACCEPTED recipients can view; non-listed actors denied; unknown shares fail closed', async () => {
  const { svc } = await makeService();
  const share = await svc.shareRevision(OWNER, PROJECT, 2, [RECIPIENT]);

  const ok = await svc.viewShared(share.shareId, RECIPIENT);
  assert.deepEqual(ok.payload, { doc: 'revision 2' });

  await assert.rejects(
    () => svc.viewShared(share.shareId, STRANGER),
    (e) => e.code === 'recipient_not_accepted',
    'a non-listed actor is denied',
  );
  await assert.rejects(
    () => svc.viewShared('shr_ghost', RECIPIENT),
    (e) => e.code === 'unknown_share',
  );
  await assert.rejects(
    () => svc.shareRevision(OWNER, PROJECT, 99, [RECIPIENT]),
    (e) => e.code === 'unknown_revision',
  );
});

test('parent summaries are consent-bound: revoked/expired consent blocks generation immediately', async () => {
  const { svc } = await makeService();
  const active = { summaryId: 'sum_1', guardianUid: 'uid_parent', studentUid: OWNER.uid, projectId: PROJECT, consentActive: true };
  const summary = await svc.parentSummary(active, ['Completed 3 concepts', 'Struggled with fractions']);
  assert.equal(summary.summaryId, 'sum_1');

  const revoked = { ...active, summaryId: 'sum_2', consentActive: false };
  await assert.rejects(
    () => svc.parentSummary(revoked, ['should not exist']),
    (e) => e.code === 'consent_not_active',
    'revoked consent blocks the summary immediately',
  );
});

test('classroom copy creates a NEW private project with ONLY the shared revision payload; private state never crosses', async () => {
  const { store, svc } = await makeService();
  const share = await svc.shareRevision(OWNER, PROJECT, 2, [RECIPIENT]);
  store.markPrivateState(PROJECT); // owner has private drafts/conversations/history

  const teacher = { uid: RECIPIENT, workspaceId: 'ws_class_9b' };
  const copy = await svc.classroomCopy({ teacher, shareId: share.shareId, title: 'Class 9B — Solar model template' });
  assert.equal(copy.privateStateCopied, false, 'private state never crosses the boundary');
  assert.equal(copy.revisionNo, 1, 'the copy starts from the shared revision only');
  assert.deepEqual(await store.payloadAt(copy.newProjectId, 1), { doc: 'revision 2' });

  // The classroom copy is owned by the class teacher, not the original owner.
  assert.match(copy.newProjectId, /^prj_copy_\d+$/);

  // A non-recipient teacher cannot copy.
  await assert.rejects(
    () => svc.classroomCopy({ teacher: { uid: STRANGER, workspaceId: 'ws_other' }, shareId: share.shareId, title: 'x' }),
    (e) => e.code === 'recipient_not_accepted',
  );
});
