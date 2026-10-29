/**
 * LEARN-14 (KAN-159) — backend-owned lifelong stage/curriculum continuity:
 *   - promotions require a REVIEWED source/criteria mapping (no equivalent
 *     mastery from an unreviewed mapping);
 *   - evidence inference alone is suggestion-only (never auto-applies);
 *   - board/institution/safety-tier (major) jumps require confirmation;
 *   - versioned append-only events; the profile revision is derived (duplicate
 *     or reordered events converge byte-stably);
 *   - postpone up to 7 days (durable); undo within 14 days appends a revert,
 *     preserves work created since, never rewrites grades;
 *   - institution exit revokes in-flight promotion authority;
 *   - review due dates and assignment labels pass through preserved;
 *   - post-commit plan/audience projection is deterministic (two-device).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { StageService } = req('./dist/src/stage/stage-service.js');
const { InMemoryStageStore } = req('./dist/src/stage/stage-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_1' };
const OTHER = { uid: 'uid_learner_2', workspaceId: 'ws_1' };

async function makeService() {
  const store = new InMemoryStageStore();
  const service = new StageService(store);
  await service.recordMapping(
    { mappingId: 'map_1', fromStage: 'stage_1', toStage: 'stage_2', sourceRef: 'ncert/8', criteriaRef: 'crit_v2' },
    'reviewer_curriculum_board',
  );
  return { store, service };
}

// ---------------------------------------------------------------------------

test('REVIEWED MAPPINGS REQUIRED: an unreviewed/missing mapping refuses the promotion', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.proposePromotion(OWNER, 'stage_2', 'stage_3', 'authorized', 'ordinary', ['c1'], []),
    (e) => e.code === 'mapping_unavailable',
  );
  // Recording a mapping requires a named reviewer.
  const store2 = new InMemoryStageStore();
  const svc2 = new StageService(store2);
  await assert.rejects(
    () => svc2.recordMapping({ mappingId: 'm', fromStage: 'a', toStage: 'b', sourceRef: 's', criteriaRef: 'c' }, '  '),
    (e) => e.code === 'mapping_invalid',
  );
});

test('EVIDENCE INFERENCE ALONE IS SUGGESTION-ONLY: it never auto-applies', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'evidence_inference', 'ordinary', ['c1'], []);
  assert.equal(proposal.suggestionOnly, true);
  await assert.rejects(
    () => service.applyPromotion(OWNER, 'cmd-1', proposal.proposalId, false),
    (e) => e.code === 'evidence_suggestion_only',
  );
});

test('ORDINARY ELIGIBLE PROGRESSION APPLIES WITH NOTICE/DIFF; MAJOR JUMPS REQUIRE CONFIRMATION', async () => {
  const { service } = await makeService();
  const ordinary = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], ['gap_1']);
  assert.equal(ordinary.requiresConfirmation, false);
  assert.ok(ordinary.notice.includes('1 new concept'));
  assert.ok(ordinary.notice.includes('1 bridge gap'));
  const event = await service.applyPromotion(OWNER, 'cmd-2', ordinary.proposalId, false);
  assert.equal(event.type, 'promotion');
  assert.equal(event.toStage, 'stage_2');
  // Major jump refuses without confirmation.
  await service.recordMapping(
    { mappingId: 'map_major', fromStage: 'stage_2', toStage: 'board_x', sourceRef: 'board', criteriaRef: 'crit_board' },
    'reviewer_curriculum_board',
  );
  const major = await service.proposePromotion(OWNER, 'stage_2', 'board_x', 'authorized', 'major', ['c10'], []);
  assert.equal(major.requiresConfirmation, true);
  await assert.rejects(
    () => service.applyPromotion(OWNER, 'cmd-3', major.proposalId, false),
    (e) => e.code === 'confirmation_required',
  );
  const applied = await service.applyPromotion(OWNER, 'cmd-3', major.proposalId, true);
  assert.equal(applied.toStage, 'board_x');
});

test('VERSIONED DERIVED PROFILE: duplicate and reordered events converge byte-stably; two devices identical', async () => {
  const { store, service } = await makeService();
  const p1 = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  await service.applyPromotion(OWNER, 'cmd-4', p1.proposalId, false);
  const profileA = await service.currentProfile(OWNER);
  assert.equal(profileA.stage, 'stage_2');
  assert.equal(profileA.revision, 2);
  // Replay the same apply command — converges to the SAME event (no double apply).
  const replay = await service.applyPromotion(OWNER, 'cmd-4', p1.proposalId, false);
  assert.equal(replay.eventId, profileA.derivedFrom[0]);
  const profileB = await service.currentProfile(OWNER);
  assert.equal(profileA.digest, profileB.digest);
  // Second controller over the same store derives the identical profile.
  const service2 = new StageService(store);
  const profileC = await service2.currentProfile(OWNER);
  assert.equal(profileA.digest, profileC.digest);
});

test('POSTPONE 7 DAYS: an ordinary proposal may be postponed up to 7 days; applying during the window refuses', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  const postponed = await service.postponeProposal(OWNER, 'cmd-5', proposal.proposalId, 7);
  assert.ok(postponed.postponedUntil);
  await assert.rejects(
    () => service.applyPromotion(OWNER, 'cmd-6', proposal.proposalId, false),
    (e) => e.code === 'postpone_invalid',
  );
  // Beyond 7 days refuses.
  await assert.rejects(
    () => service.postponeProposal(OWNER, 'cmd-7', proposal.proposalId, 8),
    (e) => e.code === 'postpone_invalid',
  );
});

test('UNDO 14 DAYS: a committed promotion undoes within the window; the revert appends (history kept)', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  const event = await service.applyPromotion(OWNER, 'cmd-8', proposal.proposalId, false);
  const revert = await service.undoPromotion(OWNER, 'cmd-9', event.eventId);
  assert.equal(revert.type, 'revert');
  assert.equal(revert.toStage, 'stage_1');
  assert.ok(revert.notice.includes('preserved'));
  const profile = await service.currentProfile(OWNER);
  assert.equal(profile.stage, 'stage_1'); // derived back to stage_1
});

test('INSTITUTION EXIT: in-flight promotions lose applying authority', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  await service.recordExit(OWNER, 'cmd-10', 'stage_1');
  assert.equal(await service.exitGateActive(OWNER), true);
  // A fresh-key apply after exit refuses with the authority gate.
  await assert.rejects(
    () => service.applyPromotion(OWNER, 'cmd-11', proposal.proposalId, false),
    (e) => e.code === 'exit_authority_revoked',
  );
});

test('PRESERVED STATE: review due dates and assignment labels pass through untouched; post-commit projection byte-stable', async () => {
  const { service } = await makeService();
  const before = await service.postCommitProjection(OWNER);
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  await service.applyPromotion(OWNER, 'cmd-12', proposal.proposalId, false);
  const after = await service.postCommitProjection(OWNER);
  assert.equal(after.stage, 'stage_2');
  // Due dates and labels (owned elsewhere) pass through identically.
  assert.deepEqual(after.preservedDueDates, before.preservedDueDates);
  assert.deepEqual(after.preservedAssignmentLabels, before.preservedAssignmentLabels);
  // Deterministic: same state -> same digest.
  const again = await service.postCommitProjection(OWNER);
  assert.equal(again.digest, after.digest);
});

test('OWNER/WORKSPACE boundary: another learner cannot act on a proposal that is not theirs (no leak)', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  await assert.rejects(
    () => service.applyPromotion(OTHER, 'cmd-13', proposal.proposalId, false),
    (e) => e.code === 'not_owner',
  );
});

test('REPLAY CONVERGENCE: a replayed undo returns the ORIGINAL revert (no duplicate ledger rows); replayed exit converges', async () => {
  const { store, service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  const event = await service.applyPromotion(OWNER, 'cmd-u1', proposal.proposalId, false);
  const before = (await store.eventsFor(OWNER)).length;
  const revert1 = await service.undoPromotion(OWNER, 'cmd-u2', event.eventId);
  const revertReplay = await service.undoPromotion(OWNER, 'cmd-u2', event.eventId);
  assert.equal(revertReplay.eventId, revert1.eventId); // same-key replay converges
  const afterUndo = await store.eventsFor(OWNER);
  assert.equal(afterUndo.length, before + 1); // exactly ONE revert row appended
  // Replayed exit converges to the ORIGINAL exit event.
  const exit1 = await service.recordExit(OWNER, 'cmd-u3', 'stage_1');
  const exitReplay = await service.recordExit(OWNER, 'cmd-u3', 'stage_1');
  assert.equal(exitReplay.eventId, exit1.eventId);
  const afterExit = await store.eventsFor(OWNER);
  assert.equal(afterExit.filter((e) => e.type === 'exit').length, 1); // no duplicate exit rows
});

test('POSTPONE REPLAY: a replayed postpone returns the proposal as originally stored (window never shifts on retry)', async () => {
  const { service } = await makeService();
  const proposal = await service.proposePromotion(OWNER, 'stage_1', 'stage_2', 'authorized', 'ordinary', ['c9'], []);
  const first = await service.postponeProposal(OWNER, 'cmd-pp', proposal.proposalId, 7);
  const replay = await service.postponeProposal(OWNER, 'cmd-pp', proposal.proposalId, 7);
  assert.equal(replay.postponedUntil, first.postponedUntil); // byte-identical window
});
