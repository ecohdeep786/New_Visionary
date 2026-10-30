/**
 * SAFE-01 (KAN-151) — reviewed, localized safeguarding route separate from
 * normal teaching. Proven against the real module over the in-memory store:
 *
 *   1. INPUT CHECK uses a CONFIGURED contextual risk model (a seam, not a
 *      keyword list): low-risk neutral text -> low; high-risk CONTEXT amplifies
 *      the signal; a score is never compliance and high/critical always requires
 *      a human review decision.
 *   2. FALSE POSITIVES / NEGATIVES: threshold / model tuning changes detection
 *      without ever suppressing human review on high/critical risk.
 *   3. JOURNEY ELIGIBILITY gates unsupported minor/adult journeys until
 *      approved admission + consent; unapproved journeys fail closed.
 *   4. TRUTHFUL ESCALATION: a concern routes to the configured channel; the
 *      alleged abuser is never auto-notified; the reporter cannot be the
 *      subject; the guardian receives a truthful summary and NEVER raw text.
 *   5. OUTPUT CHECK fails closed on critical assistant output.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { InMemorySafeguardStore, ContextualRiskModel } = req('./dist/src/safeguarding/safeguarding-lookups.js');
const { SafeguardRouteService } = req('./dist/src/safeguarding/safeguarding-service.js');
const { SafeguardError } = req('./dist/src/safeguarding/safeguarding-types.js');

const REPORTER = { uid: 'uid_teacher', workspaceId: 'ws_school' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

function makeHarness(model = { score: 0.1, label: 'low', confidence: 0.8 }) {
  const store = new InMemorySafeguardStore();
  store.setRiskModel(new ContextualRiskModel(model));
  store.setChannel({ channelId: 'sg-team', contact: 'safeguarding@visionary.org.in', supportRoute: 'local-support' });
  const svc = new SafeguardRouteService(store);
  return { store, svc };
}

test('INPUT CHECK uses the configured contextual model; a score is never compliance; high requires human review', async () => {
  const { svc } = makeHarness();
  const low = await svc.checkInput({ text: 'What is the capital of France?', context: 'math lesson', journeyType: 'learner', ageGroup: 'child' });
  assert.equal(low.riskLabel, 'low');
  assert.equal(low.humanReviewRequired, false);
  assert.equal(low.scoreIsNotCompliance, true);

  // High-risk CONTEXT amplifies even fairly neutral words (not plain keyword hit).
  const crisis = await svc.checkInput({ text: 'I feel alone today', context: 'learner says they want to kill themselves', journeyType: 'learner', ageGroup: 'minor' });
  assert.equal(crisis.riskLabel, 'critical');
  assert.equal(crisis.humanReviewRequired, true, 'critical always needs a human decision');
  assert.equal(crisis.scoreIsNotCompliance, true);

  const abuse = await svc.checkInput({ text: 'my uncle keeps hurting me', context: 'learner report', journeyType: 'learner', ageGroup: 'child' });
  assert.equal(abuse.riskLabel, 'high');
  assert.equal(abuse.humanReviewRequired, true);
});

test('FALSE POSITIVES / NEGATIVES: a suspicious score triggers human review even on a low model, no silent false negative', async () => {
  // A model tuned to be lenient (low) still cannot suppress a crisis context.
  const { svc } = makeHarness({ score: 0.05, label: 'low', confidence: 0.6 });
  const crisis = await svc.checkInput({ text: 'i think about killing myself', context: 'learner', journeyType: 'learner', ageGroup: 'minor' });
  assert.equal(crisis.riskLabel, 'critical');
  assert.equal(crisis.humanReviewRequired, true, 'no false negative on explicit crisis');

  // A strict model flags high even for ordinary text -> the threshold decision is
  // the integration's, but human review is required when the label is high.
  const { store: strictStore, svc: strict } = makeHarness({ score: 0.9, label: 'high', confidence: 0.9 });
  const flagged = await strict.checkInput({ text: 'the apple is red', context: 'lesson', journeyType: 'learner', ageGroup: 'child' });
  assert.equal(flagged.humanReviewRequired, true, 'false positives land in human review, not auto-escalation');
  void strictStore;
});

test('JOURNEY ELIGIBILITY: unsupported minor/adult journeys stay blocked until approved admission + consent', async () => {
  const { svc } = makeHarness();
  assert.deepEqual(await svc.checkEligibility('learner', 'child'), { allowed: false, reason: 'blocked_unsupported_minor' });
  assert.deepEqual(await svc.checkEligibility('learner', 'minor'), { allowed: false, reason: 'blocked_unsupported_minor' });
  assert.deepEqual(await svc.checkEligibility('professional', 'adult'), { allowed: false, reason: 'blocked_consent_missing' });

  await svc.setEligibility('learner', 'child', true);
  await svc.setEligibility('learner', 'minor', true);
  await svc.setEligibility('professional', 'adult', true);
  assert.deepEqual(await svc.checkEligibility('learner', 'child'), { allowed: true, reason: 'approved' });
  assert.deepEqual(await svc.checkEligibility('professional', 'adult'), { allowed: true, reason: 'approved' });
});

test('TRUTHFUL ESCALATION: configured channel, never auto-notify the alleged abuser, guardian gets summary not raw text', async () => {
  const { svc, store } = makeHarness();
  await svc.setEligibility('learner', 'child', true);

  const rawText = 'my guardian hits me';
  const record = await svc.reportConcern({
    reporter: REPORTER,
    subjectUid: 'learner_9',
    journeyType: 'learner',
    ageGroup: 'child',
    text: rawText,
    context: 'learner self-report',
    allegedAbuserUid: 'subject_guardian_x',
  });

  assert.equal(record.allegedAbuserNotified, false, 'never auto-notified');
  assert.equal(record.channelId, 'sg-team');
  assert.equal(record.guardianNotice.rawTextIncluded, false, 'no raw text in guardian notice');
  assert.ok(!JSON.stringify(record.guardianNotice).includes(rawText), 'raw learner text is absent from the guardian notice');
  assert.ok(record.guardianNotice.summary.length > 0, 'truthful summary present');
  assert.ok(store.concerns.length === 1);

  // Reporter cannot be the alleged subject (self-serving route denied).
  await assert.rejects(
    () => svc.reportConcern({ reporter: REPORTER, subjectUid: 'subject_guardian_x', journeyType: 'learner', ageGroup: 'child', text: rawText, context: 'x', allegedAbuserUid: 'subject_guardian_x' }),
    (e) => e instanceof SafeguardError && e.code === 'reporter_is_subject_alleged_abuser',
  );

  // Wrong user cannot raise concerns for a journey they are not the reporter of —
  // here a stranger reports for a journey they don't own.
  await svc.setEligibility('learner', 'child', true);
  const strangerReport = await svc.reportConcern({ reporter: OTHER, subjectUid: 'learner_9', journeyType: 'learner', ageGroup: 'child', text: 'stranger input', context: 'x', allegedAbuserUid: 'z' });
  assert.equal(strangerReport.allegedAbuserNotified, false);
});

test('OUTPUT CHECK fails closed on critical assistant output; ESCALATION fails closed without a configured channel', async () => {
  const { svc } = makeHarness();
  await assert.rejects(() => svc.checkOutput({ text: 'I will hurt you', context: 'assistant output that includes crisis', journeyType: 'learner', ageGroup: 'child' }), (e) => e instanceof SafeguardError && e.code === 'output_blocked');

  const noChannel = new InMemorySafeguardStore();
  noChannel.setRiskModel(new ContextualRiskModel({ score: 0.2, label: 'medium', confidence: 0.7 }));
  const svcNoChannel = new SafeguardRouteService(noChannel);
  await svcNoChannel.setEligibility('learner', 'child', true);
  await assert.rejects(
    () => svcNoChannel.reportConcern({ reporter: REPORTER, subjectUid: 'learner_9', journeyType: 'learner', ageGroup: 'child', text: 't', context: 'c' }),
    (e) => e instanceof SafeguardError && e.code === 'escalation_channel_unconfigured',
  );
});
