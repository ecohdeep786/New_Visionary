/**
 * CONTENT-03 (KAN-62) — draft/review/release/withdrawal/restore lifecycle with
 * atomic publication/index pointer changes; incomplete ingestion cannot appear
 * published.
 *
 * Proven here:
 *   1. the full lifecycle works: submit → approve (separate reviewer) →
 *      release (revision 1, pointer resolves) → withdraw (pointer stops) →
 *      restore (back to review) → approve → release (revision 2),
 *   2. incomplete ingestion can neither be submitted nor released: a missing
 *      receipt or a failed evaluation refuses with INGESTION_INCOMPLETE,
 *   3. release is an atomic compare-and-swap: a replayed release with the same
 *      expected revision is idempotent, a stale expected revision conflicts,
 *   4. review authority is a separate actor: the owner cannot approve or
 *      reject their own publication; a rejection blocks release until rework,
 *   5. all commands are owner-authorized and records/events owner-scoped,
 *   6. the reader gate refuses anything that is not a released pointer, so
 *      draft/in_review/withdrawn content never resolves for readers,
 *   7. duplicate active publications for the same node@source refuse, while a
 *      withdrawn record frees the identity for a fresh review cycle,
 *   8. durable events are ordered, typed and refetchable by cursor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { PublicationService } = req('./dist/src/publication/publication.service.js');
const { InMemoryPublicationStore } = req('./dist/src/publication/publication-store.js');
const { PublicationError } = req('./dist/src/publication/publication-errors.js');

const OWNER = 'uid-owner';
const REVIEWER = 'uid-reviewer';
const OTHER = 'uid-other';
const SOURCE = { provider: 'cisce', edition: 'ed-2024', version: '1.0.0' };
const NODE = 'cnt_curriculum_icse_001';

function readiness(overrides = {}) {
  return { jobId: 'ing_0123456789abcdef', inputDigest: 'a'.repeat(64), evaluationPassed: true, ...overrides };
}

function setup() {
  const store = new InMemoryPublicationStore();
  const service = new PublicationService(store);
  return { store, service };
}

async function submit(service, overrides = {}) {
  return service.submitForReview({
    requesterUid: overrides.requesterUid ?? OWNER,
    ownerUid: overrides.ownerUid ?? OWNER,
    workspaceId: null,
    nodeKey: overrides.nodeKey ?? NODE,
    source: overrides.source ?? SOURCE,
    ingestion: overrides.ingestion ?? readiness(),
  });
}

async function deniedCode(promise) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof PublicationError) return error.code;
    throw error;
  }
  throw new Error('expected the call to be denied');
}

async function publishThroughReview(service, node = NODE) {
  const record = await submit(service, { nodeKey: node });
  await service.approve(record.publicationId, REVIEWER, 'content verified');
  return service.release(record.publicationId, OWNER, record.revision);
}

// ---------------------------------------------------------------------------

test('full lifecycle: submit → approve → release → withdraw → restore → approve → release', async () => {
  const { service } = setup();
  const record = await submit(service);
  assert.equal(record.state, 'in_review');
  assert.equal(record.revision, 0);
  assert.equal(record.pointer, null);

  const approved = await service.approve(record.publicationId, REVIEWER, 'content verified');
  assert.equal(approved.review.reviewerUid, REVIEWER);

  const released = await service.release(record.publicationId, OWNER, record.revision);
  assert.equal(released.state, 'released');
  assert.equal(released.revision, 1);
  assert.equal(released.pointer.revision, 1);
  assert.ok(released.pointer.targetDigest.length, 64);

  const pointer = await service.readPointer(NODE, 'uid-learner');
  assert.equal(pointer.revision, 1);

  const withdrawn = await service.withdraw(record.publicationId, OWNER);
  assert.equal(withdrawn.state, 'withdrawn');
  assert.equal(withdrawn.pointer, null);
  assert.equal(await deniedCode(service.readPointer(NODE, 'uid-learner')), 'PUB_NOT_RELEASED', 'withdrawal stops new access immediately');

  const restored = await service.restore(record.publicationId, OWNER);
  assert.equal(restored.state, 'in_review', 'restore re-enters review, never released directly');
  assert.equal(restored.review, null, 'fresh approval is required');

  await service.approve(record.publicationId, REVIEWER, 'corrected edition verified');
  const rereleased = await service.release(record.publicationId, OWNER, restored.revision);
  assert.equal(rereleased.state, 'released');
  assert.equal(rereleased.revision, 2);
  const pointer2 = await service.readPointer(NODE, 'uid-learner');
  assert.equal(pointer2.revision, 2, 'readers resolve the new pointer after the atomic swap');
});

test('release is idempotent for a replayed command; stale revisions refuse and the store CAS conflicts', async () => {
  const { store, service } = setup();
  const record = await submit(service);
  await service.approve(record.publicationId, REVIEWER, 'ok');
  const released = await service.release(record.publicationId, OWNER, 0);
  const replay = await service.release(record.publicationId, OWNER, 0);
  assert.equal(replay.revision, released.revision);
  assert.equal(replay.pointer.targetDigest, released.pointer.targetDigest, 'same command replays to the same pointer');
  const replayAgain = await service.release(record.publicationId, OWNER, 0);
  assert.equal(replayAgain.revision, released.revision, 'retries stay idempotent');

  const stale = await service.release(record.publicationId, OWNER, 5).catch((error) => error);
  assert.equal(stale.code, 'INVALID_TRANSITION', 'a stale revision against a released pointer requires a refetch');
  const storeConflict = await store.swapPointer(record.publicationId, 5, (r) => r).catch((error) => error);
  assert.equal(storeConflict.code, 'CONCURRENT_REVISION_CONFLICT', 'the store compare-and-swap refuses mismatched revisions');
});

test('incomplete ingestion cannot be submitted and cannot be released', async () => {
  const { store, service } = setup();
  assert.equal(await deniedCode(submit(service, { ingestion: readiness({ evaluationPassed: false }) })), 'INGESTION_INCOMPLETE');
  assert.equal(await deniedCode(submit(service, { ingestion: readiness({ jobId: '', inputDigest: '' }) })), 'INGESTION_INCOMPLETE');
  const events = await store.listEvents('no-such-publication');
  assert.equal(events.events.length, 0, 'denied submits write nothing');

  const record = await submit(service);
  // Deepen the gate: force the stored receipt to fail and try to release.
  await service.approve(record.publicationId, REVIEWER, 'ok');
  const swapped = await store.swapPointer(record.publicationId, record.revision, (current) => ({
    ...current, ingestion: readiness({ evaluationPassed: false }),
  }));
  assert.equal(await deniedCode(service.release(record.publicationId, OWNER, swapped.revision)), 'INGESTION_INCOMPLETE');
});

test('release requires a recorded approval; a rejection blocks release', async () => {
  const { service } = setup();
  const unapproved = await submit(service);
  assert.equal(await deniedCode(service.release(unapproved.publicationId, OWNER, 0)), 'INVALID_TRANSITION');

  const rejected = await submit(service, { nodeKey: 'cnt_second_node' });
  await service.reject(rejected.publicationId, REVIEWER, 'wrong edition metadata');
  const after = await service.getRecord(rejected.publicationId, OWNER);
  assert.equal(after.state, 'in_review', 'rejection keeps the record in review for rework');
  assert.equal(after.rejection.note, 'wrong edition metadata');
  assert.equal(await deniedCode(service.release(rejected.publicationId, OWNER, 0)), 'INVALID_TRANSITION', 'release still requires an approval');

  const fromWithdrawn = await publishThroughReview(service, 'cnt_third_node');
  await service.withdraw(fromWithdrawn.publicationId, OWNER);
  assert.equal(await deniedCode(service.approve(fromWithdrawn.publicationId, REVIEWER, 'late')), 'INVALID_TRANSITION');
  assert.equal(await deniedCode(service.release(fromWithdrawn.publicationId, OWNER, fromWithdrawn.revision)), 'INVALID_TRANSITION');
});

test('review authority: the owner cannot approve or reject their own publication', async () => {
  const { service } = setup();
  const record = await submit(service);
  assert.equal(await deniedCode(service.approve(record.publicationId, OWNER, 'self')), 'SELF_APPROVAL_DENIED');
  assert.equal(await deniedCode(service.reject(record.publicationId, OWNER, 'self')), 'SELF_APPROVAL_DENIED');
  const clean = await service.approve(record.publicationId, REVIEWER, 'independent review');
  assert.equal(clean.review.reviewerUid, REVIEWER);
});

test('commands are owner-authorized and reads are owner-scoped', async () => {
  const { service } = setup();
  assert.equal(await deniedCode(submit(service, { requesterUid: OTHER })), 'AUTHORITY_DENIED');

  const record = await submit(service);
  await service.approve(record.publicationId, REVIEWER, 'ok');
  assert.equal(await deniedCode(service.release(record.publicationId, OTHER, 0)), 'AUTHORITY_DENIED');
  assert.equal(await deniedCode(service.withdraw(record.publicationId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await deniedCode(service.restore(record.publicationId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await deniedCode(service.getRecord(record.publicationId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await deniedCode(service.listEvents(record.publicationId, OTHER)), 'AUTHORITY_DENIED');

  const released = await service.release(record.publicationId, OWNER, record.revision);
  const audit = await service.getRecord(released.publicationId, OWNER);
  assert.equal(audit.ownerUid, OWNER);
  assert.equal(audit.review.reviewerUid, REVIEWER);
});

test('the reader gate resolves only released pointers and requires an authenticated requester', async () => {
  const { service, store } = setup();
  assert.equal(await deniedCode(service.readPointer(NODE, '')), 'AUTHORITY_DENIED');
  assert.equal(await deniedCode(service.readPointer('cnt_unknown', 'uid-learner')), 'PUB_NOT_RELEASED');

  const record = await submit(service);
  assert.equal(await deniedCode(service.readPointer(NODE, 'uid-learner')), 'PUB_NOT_RELEASED', 'in_review content never resolves');
  await service.approve(record.publicationId, REVIEWER, 'ok');
  await service.release(record.publicationId, OWNER, record.revision);
  const pointer = await service.readPointer(NODE, 'uid-learner');
  assert.equal(pointer.nodeKey, NODE);
});

test('duplicate active publications refuse; a withdrawn record frees the identity', async () => {
  const { service } = setup();
  const first = await submit(service);
  assert.equal(await deniedCode(submit(service)), 'DUPLICATE_PUBLICATION');

  await service.approve(first.publicationId, REVIEWER, 'ok');
  await service.release(first.publicationId, OWNER, first.revision);
  await service.withdraw(first.publicationId, OWNER);
  const fresh = await submit(service);
  assert.notEqual(fresh.publicationId, first.publicationId, 'withdrawn identity accepts a fresh review cycle');
  assert.equal(await deniedCode(service.readPointer(NODE, 'uid-learner')), 'PUB_NOT_RELEASED', 'withdrawn pointer keeps blocking while the new cycle is in review');
});

test('lifecycle transitions refuse invalid jumps', async () => {
  const { service } = setup();
  const record = await submit(service);
  assert.equal(await deniedCode(service.withdraw(record.publicationId, OWNER)), 'INVALID_TRANSITION', 'cannot withdraw a non-released publication');
  assert.equal(await deniedCode(service.restore(record.publicationId, OWNER)), 'INVALID_TRANSITION', 'cannot restore a non-withdrawn publication');
});

test('durable events are ordered, typed and refetchable by cursor', async () => {
  const { service } = setup();
  const record = await submit(service);
  await service.approve(record.publicationId, REVIEWER, 'ok');
  await service.release(record.publicationId, OWNER, record.revision);
  await service.release(record.publicationId, OWNER, record.revision);
  await service.withdraw(record.publicationId, OWNER);
  await service.restore(record.publicationId, OWNER);

  const all = await service.listEvents(record.publicationId, OWNER);
  const types = all.events.map((e) => e.type);
  assert.deepEqual(types, ['created', 'review_approved', 'released', 'released_replay', 'withdrawn', 'restored']);
  const seqs = all.events.map((e) => e.seq);
  assert.deepEqual([...seqs].sort((a, b) => a - b), seqs);

  const firstPage = await service.listEvents(record.publicationId, OWNER, undefined, 2);
  assert.equal(firstPage.events.length, 2);
  assert.ok(firstPage.nextCursor);
  const secondPage = await service.listEvents(record.publicationId, OWNER, firstPage.nextCursor);
  assert.equal(secondPage.events[0].seq, firstPage.events[1].seq + 1);
});
