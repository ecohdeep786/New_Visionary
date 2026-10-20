import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { configureContentRepository } from '../src/services/contentRepository.ts';
import { configureTeachingInterface } from '../src/services/teachingInterface.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
beforeEach(() => {
  memory.clear(); configureContentRepository(null); configureTeachingInterface(null); pipeline.configureLearningSessionAdapter(null);
  workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
  mentor.configureMentorClock(() => new Date('2026-09-23T12:00:00Z'));
  workspace.seedDemo('adult');
});

const selection = { board: 'Reviewed fixture', classLevel: '7', subject: 'Durable loop' };
const graph = () => ({ syllabus: { ...selection, id: 'durable:syllabus', status: 'official', contentLocale: 'en', availableLocales: ['en'], provenance: { provider: 'Synthetic source', sourceId: 'durable:book', version: '2026.1' }, textbooks: [{ id: 'durable:book', title: 'Fixture book', chapterIds: ['durable:chapter'] }], chapters: [{ id: 'durable:chapter', title: 'Fixture chapter', textbookId: 'durable:book', topicIds: ['durable:topic'], status: 'official' }] },
  topics: [{ id: 'durable:topic', title: 'Fixture topic', chapterId: 'durable:chapter', conceptIds: ['durable:concept'], status: 'official' }],
  concepts: [{ id: 'durable:concept', title: 'Durable concept', topicId: 'durable:topic', status: 'official', locale: 'en', availableLocales: ['en'], prerequisiteIds: [], representations: [], explanation: 'Authored explanation', check: { id: 'durable:check', prompt: 'Choose the authored option', options: ['A', 'B', 'C'], answerIndex: 0, source: 'database' }, practice: [{ id: 'durable:practice', prompt: 'Choose again', options: ['A', 'B'], answerIndex: 1, source: 'database' }] }] });

async function sourcedActivity() {
  configureContentRepository({ async getSyllabus() { return graph(); } });
  const request = ctx();
  await pipeline.selectLearningSyllabus(request, selection);
  const unit = await pipeline.startLearningUnit(request, 'durable:concept');
  return { request, unit };
}

const fakeServer = ({ grader } = {}) => {
  const sessions = new Map(), issued = new Map();
  const calls = { start: [], get: [], present: [], assess: [], cancel: [] };
  let lostAssess = false, rejectedAssess = null;
  const state = session => ({ version: 1, uid: 'demo-adult', sessionId: session.id, workspaceId: session.workspaceId, status: session.status,
    phase: session.phase, revision: session.revision, failedChecks: session.failedChecks, maxFailedChecks: session.maxFailedChecks,
    previousStrategy: session.previousStrategy, checkPassed: session.phase === 'check_passed', reviewSuggested: session.phase === 'review_suggested',
    check: session.check ? { checkId: session.check.checkId, strategy: session.check.strategy, optionCount: session.check.options.length } : null,
    createdAt: session.createdAt, updatedAt: session.createdAt });
  const conflict = message => Object.assign(new Error(message), { status: 409 });
  const missing = () => Object.assign(new Error('This learning session is unavailable.'), { status: 404 });
  return {
    calls,
    session: sessionId => sessions.get(sessionId || [...sessions.keys()][0]),
    loseNextAssess() { lostAssess = true; },
    rejectNextAssess(message) { rejectedAssess = message; },
    async start(command) {
      calls.start.push(command);
      if (issued.has(command.commandId)) return issued.get(command.commandId);
      const session = { id: crypto.randomUUID(), workspaceId: command.workspaceId, conceptId: command.conceptId, sourceVersion: command.sourceVersion, criteriaVersion: command.criteriaVersion,
        maxFailedChecks: command.maxFailedChecks || 3, status: 'active', phase: 'explain', revision: 0, failedChecks: 0, previousStrategy: null, check: null, createdAt: '2026-10-18T00:00:00.000Z' };
      sessions.set(session.id, session);
      const receipt = state(session); issued.set(command.commandId, receipt); return receipt;
    },
    async get(sessionId) {
      calls.get.push(sessionId);
      const session = sessions.get(sessionId); if (!session) throw missing();
      return state(session);
    },
    async present(sessionId, command) {
      calls.present.push({ sessionId, command });
      if (issued.has(command.commandId)) return issued.get(command.commandId);
      const session = sessions.get(sessionId); if (!session) throw missing();
      if (session.phase !== 'explain' || command.expectedRevision !== session.revision) throw conflict('This learning activity changed on another device or tab. Load the saved activity before continuing.');
      session.phase = 'check'; session.revision += 1; session.previousStrategy = command.strategy;
      session.check = { checkId: command.checkId, strategy: command.strategy, options: command.options, answerIndex: command.answerIndex };
      const receipt = state(session); issued.set(command.commandId, receipt); return receipt;
    },
    async assess(sessionId, command) {
      calls.assess.push({ sessionId, command });
      if (rejectedAssess) { const message = rejectedAssess; rejectedAssess = null; throw conflict(message); }
      if (issued.has(command.commandId)) return issued.get(command.commandId);
      const session = sessions.get(sessionId); if (!session) throw missing();
      if (session.phase !== 'check' || command.expectedRevision !== session.revision) throw conflict('This learning activity changed on another device or tab. Load the saved activity before continuing.');
      const passed = grader ? grader(command, session) === true : command.selection === session.check.answerIndex;
      session.revision += 1;
      if (!passed) session.failedChecks += 1;
      session.previousStrategy = session.check.strategy; session.check = null;
      session.phase = passed ? 'check_passed' : session.failedChecks >= session.maxFailedChecks ? 'review_suggested' : 'explain';
      const receipt = { ...state(session), receipt: { id: command.commandId, checkId: command.checkId, passed } };
      issued.set(command.commandId, receipt);
      if (lostAssess) { lostAssess = false; throw new Error('Learning progress could not be confirmed. Your saved work is kept; retry when connected.'); }
      return receipt;
    },
    async cancel(sessionId, command) {
      calls.cancel.push({ sessionId, command });
      if (issued.has(command.commandId)) return issued.get(command.commandId);
      const session = sessions.get(sessionId); if (!session) throw missing();
      if (command.expectedRevision !== session.revision) throw conflict('This learning activity changed on another device or tab. Load the saved activity before continuing.');
      session.status = 'cancelled'; session.revision += 1;
      const receipt = state(session); issued.set(command.commandId, receipt); return receipt;
    },
  };
};

test('a connected check is presented with pinned scope echoes, the server revision and an allowed strategy', async () => {
  const server = fakeServer(); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  const started = server.calls.start[0];
  assert.equal(started.workspaceId, 'demo-adult:student'); assert.equal(started.conceptId, 'durable:concept');
  assert.equal(started.sourceVersion, '2026.1'); assert.equal(started.criteriaVersion, '2026.1');
  assert.equal(started.provider, 'Synthetic source'); assert.equal(started.sourceId, 'durable:book'); assert.equal(started.maxFailedChecks, 3);
  assert.equal(unit.durableSessionId, server.session().id); assert.equal(unit.durableRevision, 0);
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  const checked = await pipeline.beginComprehension(request, unit.id);
  const command = server.calls.present[0].command;
  assert.equal(command.checkId, 'durable:check'); assert.equal(command.validation, 'passed'); assert.equal(command.strategy, 'worked_example');
  assert.equal(command.workspaceId, 'demo-adult:student'); assert.equal(command.sourceVersion, '2026.1'); assert.equal(command.criteriaVersion, '2026.1');
  assert.equal(command.expectedRevision, 0); assert.deepEqual(command.options, ['A', 'B', 'C']); assert.equal(command.answerIndex, 0);
  assert.equal(checked.durableRevision, 1); assert.equal(checked.durableCheckId, 'durable:check');
  assert.equal(checked.stage, 'check'); assert.equal(checked.question.id, 'durable:check');
  assert.equal(checked.durableReviewSuggested, false); assert.equal(checked.checkPassed, false);
});

test('the server verdict grades the answer; local keys and client fields never override it', async () => {
  const server = fakeServer({ grader: () => false }); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  await pipeline.beginComprehension(request, unit.id);
  const graded = await pipeline.answerLearningQuestion(request, unit.id, 0);
  const command = server.calls.assess[0].command;
  assert.equal('passed' in command, false); assert.equal('correct' in command, false);
  assert.equal(command.checkId, 'durable:check'); assert.equal(command.selection, 0); assert.equal(command.expectedRevision, 1);
  assert.equal(graded.answer.correct, false); assert.equal(graded.checkPassed, false);
  assert.equal(graded.answer.id, command.commandId);
  assert.equal(graded.attempts.filter(item => item.kind === 'check').length, 1);
  assert.equal(graded.attempts.at(-1).correct, false);
  assert.equal(graded.durableFailedChecks, 1); assert.equal(graded.durableReviewSuggested, false); assert.equal(graded.durableCheckId, undefined);
});

test('a lost assessment response retries the identical command and records one graded answer', async () => {
  const server = fakeServer(); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  await pipeline.beginComprehension(request, unit.id);
  server.loseNextAssess();
  await assert.rejects(pipeline.answerLearningQuestion(request, unit.id, 0), /Learning progress could not be confirmed/);
  const kept = pipeline.getLearningUnit(request, unit.id);
  assert.equal(kept.answer, undefined);
  assert.ok(kept.durableAssess, 'the exact command identity is kept for retry');
  assert.equal(kept.durableCheckId, 'durable:check');
  const retried = await pipeline.answerLearningQuestion(request, unit.id, 0);
  const commands = server.calls.assess.map(call => call.command);
  assert.equal(commands.length, 2); assert.deepEqual(commands[1], commands[0]);
  assert.equal(retried.answer.correct, true); assert.equal(retried.checkPassed, true);
  assert.equal(retried.attempts.filter(item => item.kind === 'check').length, 1);
});

test('a refused assessment keeps the private draft, records no grade and still reuses one identity', async () => {
  const server = fakeServer(); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  const checked = await pipeline.beginComprehension(request, unit.id);
  pipeline.saveLearningAnswerDraft(request, unit.id, 1, JSON.stringify(checked.question), checked.practiceRound);
  server.rejectNextAssess('This learning activity changed on another device or tab. Load the saved activity before continuing.');
  await assert.rejects(pipeline.answerLearningQuestion(request, unit.id, 1), /changed on another device/);
  const kept = pipeline.getLearningUnit(request, unit.id);
  assert.deepEqual(kept.answerDraft, { questionVersion: JSON.stringify(kept.question), round: kept.practiceRound, index: 1 });
  assert.equal(kept.answer, undefined); assert.equal(kept.attempts, undefined); assert.equal(kept.checkPassed, false);
  const retried = await pipeline.answerLearningQuestion(request, unit.id, 1);
  const commands = server.calls.assess.map(call => call.command);
  assert.equal(commands.length, 2); assert.equal(commands[1].commandId, commands[0].commandId); assert.equal(commands[1].selection, 1);
  assert.equal(retried.answer.correct, false); assert.equal(retried.durableFailedChecks, 1);
});

test('three server-assessed failures rotate strategies and stop with a bounded review suggestion', async () => {
  const server = fakeServer({ grader: () => false }); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  await pipeline.beginComprehension(request, unit.id);
  let graded = await pipeline.answerLearningQuestion(request, unit.id, 1);
  graded = await pipeline.beginComprehension(request, unit.id);
  graded = await pipeline.answerLearningQuestion(request, unit.id, 1);
  graded = await pipeline.beginComprehension(request, unit.id);
  graded = await pipeline.answerLearningQuestion(request, unit.id, 1);
  assert.deepEqual(server.calls.present.map(call => call.command.strategy), ['worked_example', 'analogy', 'practice']);
  assert.equal(graded.durableFailedChecks, 3); assert.equal(graded.durableReviewSuggested, true);
  assert.equal(graded.checkPassed, false); assert.equal(graded.stage, 'check');
  await assert.rejects(pipeline.beginComprehension(request, unit.id), /bounded check limit/);
  assert.equal(server.calls.present.length, 3);
  const stored = pipeline.getLearningUnit(request, unit.id);
  assert.equal(stored.durableReviewSuggested, true); assert.equal(stored.attempts.length, 3);
  assert.doesNotMatch(JSON.stringify(stored), /master|escalat|teacherContact/);
});

test('cancellation and reconnect read-back converge and an explicit new check opens a fresh session', async () => {
  const server = fakeServer(); pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  await pipeline.beginComprehension(request, unit.id);
  const cancelled = await pipeline.cancelLearningSession(request, unit.id);
  assert.equal(cancelled.durableCancelled, true); assert.equal(cancelled.durableCheckId, undefined);
  assert.equal(server.calls.cancel[0].command.expectedRevision, 1);
  assert.equal(server.calls.cancel[0].command.sourceVersion, '2026.1');
  const resumed = await pipeline.resumeLearningSession(request, unit.id);
  assert.equal(resumed.durableCancelled, true); assert.equal(resumed.durableRevision, cancelled.durableRevision);
  assert.equal(resumed.stage, 'check');
  await assert.rejects(pipeline.answerLearningQuestion(request, unit.id, 0), /cancelled/);
  assert.equal(pipeline.getLearningUnit(request, unit.id).answer, undefined);
  const restarted = await pipeline.beginComprehension(request, unit.id);
  assert.equal(restarted.durableCancelled, false);
  assert.notEqual(restarted.durableSessionId, cancelled.durableSessionId);
  assert.equal(restarted.durableRevision, 1); assert.equal(restarted.durableCheckId, 'durable:check');
  assert.equal(server.calls.start.length, 2); assert.equal(server.session(restarted.durableSessionId).phase, 'check');
  const graded = await pipeline.answerLearningQuestion(request, unit.id, 1);
  assert.equal(graded.durableFailedChecks, 1); assert.equal(graded.durableReviewSuggested, false);
});

test('an unconfigured adapter keeps the verified local flow and sends no server commands', async () => {
  const { request, unit } = await sourcedActivity();
  assert.equal(pipeline.learningSessionAdapterConfigured(), false);
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  const checked = await pipeline.beginComprehension(request, unit.id);
  assert.equal(checked.durableSessionId, undefined); assert.equal(checked.durableRevision, undefined); assert.equal(checked.durablePresent, undefined);
  const graded = await pipeline.answerLearningQuestion(request, unit.id, 0);
  assert.equal(graded.answer.correct, true); assert.match(graded.answer.id, /:check:0:durable:check$/);
  assert.equal(graded.checkPassed, true);
});


for (const [field, mutate] of [
  ['session', x => ({ ...x, sessionId: crypto.randomUUID() })],
  ['workspace', x => ({ ...x, workspaceId: 'other-workspace' })],
  ['command', x => ({ ...x, receipt: { ...x.receipt, id: crypto.randomUUID() } })],
]) test(`a mismatched ${field} assessment keeps the draft and cannot advance local learning evidence`, async () => {
  const server = fakeServer(), assess = server.assess.bind(server);
  server.assess = async (id, command) => mutate(await assess(id, command));
  pipeline.configureLearningSessionAdapter(server);
  const { request, unit } = await sourcedActivity();
  await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
  const checked = await pipeline.beginComprehension(request, unit.id);
  const revision = checked.durableRevision, knowledge = JSON.stringify(mentor.getStudentState(request));
  await assert.rejects(pipeline.answerLearningQuestion(request, unit.id, 0), /did not confirm/);
  const saved = pipeline.getLearningUnit(request, unit.id);
  assert.equal(saved.durableRevision, revision); assert.equal(saved.durableCheckId, checked.durableCheckId);
  assert.equal(saved.durableSessionId, checked.durableSessionId); assert.ok(saved.durableAssess);
  assert.equal(saved.stage, checked.stage); assert.equal(JSON.stringify(mentor.getStudentState(request)), knowledge);
});
