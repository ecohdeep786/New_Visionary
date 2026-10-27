/**
 * LEARN-07 (KAN-73) — verify concept → check/practice → private project →
 * save → second-device resume, including source withdrawal, concurrent edits,
 * failed saves and session expiry.
 *
 * Proven here:
 *   1. the happy path: concept → practice → draft save → second-device resume
 *      carries the committed journey (the exit),
 *   2. source withdrawal mid-journey: new commands denied (preserved local);
 *      the committed journey stays resumable with honest `withdrawn`,
 *   3. concurrent edits: stale revisions refused with visible preservation and
 *      the committed revision for rebase,
 *   4. failed saves preserve local work; nothing partial persists,
 *   5. duplicate submissions deduplicate,
 *   6. wrong users denied everywhere,
 *   7. session expiry refuses new commands; committed state resumable,
 *   8. journeys start only from released revisions.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { LearnerJourneyService } = req('./dist/src/journey/journey.js');
const { InMemoryJourneyStore } = req('./dist/src/journey/journey-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const CONCEPT = 'c_integers';
const VERSION = '1.1.0';

async function makeService() {
  const store = new InMemoryJourneyStore();
  await store.setSourceAvailable(CONCEPT, VERSION, true);
  return { store, svc: new LearnerJourneyService(store) };
}

// ---------------------------------------------------------------------------

test('happy path: concept → practice → private draft save → second-device resume carries the committed journey (the exit)', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);

  const a1 = await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_1', checkId: 'chk_1', answer: { choiceIndex: 2 }, expectedRevision: 1 });
  assert.equal(a1.outcome, 'committed');
  const d1 = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_project', payload: { title: 'My number line', notes: 'half done' }, expectedRevision: a1.revision });
  assert.equal(d1.outcome, 'committed');

  // ANOTHER DEVICE resumes the same committed journey.
  const resume = await svc.resume(journeyId, OWNER);
  assert.equal(resume.journeyId, journeyId);
  assert.equal(resume.conceptId, CONCEPT);
  assert.equal(resume.sourceVersion, VERSION);
  assert.equal(resume.sourceAvailability, 'available');
  assert.equal(resume.attempts.length, 1);
  assert.deepEqual(resume.attempts[0].answer, { choiceIndex: 2 });
  assert.deepEqual(resume.latestDraft.payload, { title: 'My number line', notes: 'half done' });
  assert.equal(resume.revision, d1.revision);
  assert.equal(resume.state, 'active');
});

test('source withdrawal mid-journey: new commands denied with preserved local; committed journey resumable with honest withdrawn state', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);
  await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_1', checkId: 'chk_1', answer: { choiceIndex: 1 }, expectedRevision: 1 });

  await svc.withdrawSource(CONCEPT, VERSION);

  const denied = await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_2', checkId: 'chk_1', answer: { choiceIndex: 3 }, expectedRevision: 2 });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'source_withdrawn');
  assert.equal(denied.preservedLocal, true, 'local work preserved visibly on withdrawal');

  const deniedDraft = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_2', payload: { x: 1 }, expectedRevision: 2 });
  assert.equal(deniedDraft.reason, 'source_withdrawn');

  // The committed journey is still resumable — honestly marked withdrawn.
  const resume = await svc.resume(journeyId, OWNER);
  assert.equal(resume.sourceAvailability, 'withdrawn');
  assert.equal(resume.attempts.length, 1, 'committed attempt survives withdrawal');
  assert.equal(resume.state, 'active');
});

test('concurrent edits: stale revision refused with preserved local and committed revision for rebase', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);

  // Device A commits revision 1 -> 2.
  await svc.practice({ journeyId, owner: OWNER, submissionId: 'a1', checkId: 'chk_1', answer: {}, expectedRevision: 1 });
  // Device B is stale.
  const stale = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_b', payload: { from: 'deviceB' }, expectedRevision: 1 });
  assert.equal(stale.ok, false);
  assert.equal(stale.reason, 'revision_conflict');
  assert.equal(stale.preservedLocal, true);
  assert.equal(stale.currentRevision, 2, 'committed revision returned for rebase');

  // Rebased command commits.
  const rebased = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_b', payload: { from: 'deviceB' }, expectedRevision: 2 });
  assert.equal(rebased.outcome, 'committed');
  assert.equal(rebased.revision, 3);
});

test('failed saves preserve local work visibly; nothing partial persists and a retry succeeds', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);

  const failed = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_x', payload: { essay: 'draft text' }, expectedRevision: 1, failSave: true });
  assert.equal(failed.ok, false);
  assert.equal(failed.reason, 'save_failed');
  assert.equal(failed.preservedLocal, true, 'failed save keeps the local draft visible');

  // Nothing partial persisted.
  const before = await svc.resume(journeyId, OWNER);
  assert.equal(before.latestDraft, null);

  // Retry (store healthy) commits cleanly.
  const retry = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'draft_x', payload: { essay: 'draft text' }, expectedRevision: 1 });
  assert.equal(retry.outcome, 'committed');
});

test('duplicate practice submissions deduplicate (idempotent, no double-advance)', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);
  const first = await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_dup', checkId: 'chk_1', answer: {}, expectedRevision: 1 });
  const replay = await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_dup', checkId: 'chk_1', answer: {}, expectedRevision: 1 });
  assert.equal(first.outcome, 'committed');
  assert.equal(replay.outcome, 'duplicate');
  assert.equal(replay.revision, first.revision);
  const resume = await svc.resume(journeyId, OWNER);
  assert.equal(resume.attempts.length, 1, 'no duplicate attempt row');
  assert.equal(resume.revision, 2, 'revision advanced exactly once');
});

test('wrong users denied on every operation; unknown journeys fail closed', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);

  const strangerPractice = await svc.practice({ journeyId, owner: OTHER, submissionId: 's1', checkId: 'c', answer: {}, expectedRevision: 1 });
  assert.equal(strangerPractice.reason, 'not_owner');
  const strangerDraft = await svc.saveDraft({ journeyId, owner: OTHER, draftId: 'd', payload: {}, expectedRevision: 1 });
  assert.equal(strangerDraft.reason, 'not_owner');
  const strangerResume = await svc.resume(journeyId, OTHER);
  assert.equal(strangerResume.reason, 'not_owner');
  assert.equal(strangerResume.preservedLocal, true);
  const strangerExpire = await svc.expire(journeyId, OTHER);
  assert.equal(strangerExpire.reason, 'not_owner');

  const unknown = await svc.resume('jn_missing', OWNER);
  assert.equal(unknown.reason, 'unknown_journey');
});

test('session expiry: new commands refused honestly; committed state remains resumable as expired', async () => {
  const { svc } = await makeService();
  const journeyId = await svc.startJourney(OWNER, CONCEPT, VERSION);
  await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_1', checkId: 'chk_1', answer: {}, expectedRevision: 1 });

  const expired = await svc.expire(journeyId, OWNER);
  assert.deepEqual(expired, { ok: true, state: 'expired' });
  const again = await svc.expire(journeyId, OWNER);
  assert.deepEqual(again, { ok: true, state: 'expired' }, 'expire is idempotent');

  const denied = await svc.practice({ journeyId, owner: OWNER, submissionId: 'sub_2', checkId: 'chk_1', answer: {}, expectedRevision: 2 });
  assert.equal(denied.reason, 'journey_expired');
  assert.equal(denied.preservedLocal, true);

  const deniedDraft = await svc.saveDraft({ journeyId, owner: OWNER, draftId: 'd2', payload: {}, expectedRevision: 2 });
  assert.equal(deniedDraft.reason, 'journey_expired');

  const resume = await svc.resume(journeyId, OWNER);
  assert.equal(resume.state, 'expired', 'resume reports expiry honestly');
  assert.equal(resume.attempts.length, 1, 'committed work survives expiry');
});

test('journeys start only from released source revisions; unknown revisions refused before anything persists', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.startJourney(OWNER, CONCEPT, '9.9.9'),
    (e) => e.code === 'source_revision_unknown',
  );
  await assert.rejects(
    () => svc.startJourney(OWNER, 'c_ghost', VERSION),
    (e) => e.code === 'source_revision_unknown',
  );
  const ok = await svc.startJourney(OWNER, CONCEPT, VERSION);
  assert.match(ok, /^jn_\d+$/);
});
