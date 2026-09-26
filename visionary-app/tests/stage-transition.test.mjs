import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { workspaceIdentity } from '../src/services/workspaceService.ts';
const stageProfileOf = request => workspaceIdentity(request).person.learningContext || {};
import * as pipeline from '../src/services/learningPipelineService.ts';
import { proposeStageTransition, proposeClassPromotion, confirmStageTransition, postponeStageTransition, undoStageTransition, getActiveTransitionNotice, configureStageTransitionClock } from '../src/services/stageTransitionService.ts';
import { SAMPLE_SELECTION } from '../src/services/contentRepository.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
globalThis.crypto ??= { randomUUID: () => 'id-' + Math.random().toString(16).slice(2) };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const at = () => new Date('2026-09-26T12:00:00Z');
const clockAt = iso => { configureStageTransitionClock(() => new Date(iso)); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date(iso) }); };
beforeEach(() => {
 memory.clear();
 clockAt('2026-09-26T12:00:00Z');
 workspace.seedDemo('adult');
});

test('an adjacent class promotion applies automatically with notice, diff and retained work', async () => {
 const request = ctx();
 await pipeline.selectLearningSyllabus(request, SAMPLE_SELECTION);
 const transition = proposeStageTransition(request, { board: 'Sample', classLevel: '7', subjects: ['Mathematics'] }, 'class 6 to 7 promotion recorded');
 assert.equal(transition.policy, 'AUTO');
 assert.equal(transition.state, 'applied');
 assert.equal(transition.diff.unitsKept, 0);
 assert.equal(transition.diff.dueDatesRetained, true);
 // The active profile is the new one.
 assert.equal(stageProfileOf(request).classLevel, '7');
 // The notice is active with the undo window open.
 const notice = getActiveTransitionNotice(request);
 assert.equal(notice?.id, transition.id);
 assert.equal(notice?.state, 'applied');
});

test('postpone reverses the mapping and reevaluation re-applies after seven days', async () => {
 const request = ctx();
 proposeStageTransition(request, { board: 'Sample', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 const transition = proposeStageTransition(request, { classLevel: '8' }, 'class 7 to 8 promotion');
 assert.equal(stageProfileOf(request).classLevel, '8');
 const postponed = postponeStageTransition(request, transition.id);
 assert.equal(postponed.state, 'postponed');
 assert.equal(stageProfileOf(request).classLevel, '7');
 // Before seven days: still postponed.
 clockAt('2026-10-01T12:00:00Z');
 assert.equal(getActiveTransitionNotice(request)?.state, 'postponed');
 assert.equal(stageProfileOf(request).classLevel, '7');
 // After seven days: reevaluation re-applies the postponed change.
 clockAt('2026-10-04T12:00:00Z');
 const notice = getActiveTransitionNotice(request);
 assert.equal(notice?.state, 'applied');
 assert.equal(stageProfileOf(request).classLevel, '8');
});

test('undo restores the exact prior mapping while work created since is retained', async () => {
 const request = ctx();
 await pipeline.selectLearningSyllabus(request, SAMPLE_SELECTION);
 proposeStageTransition(request, { board: 'Sample', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 configureStageTransitionClock(() => new Date(Date.now() - 60000));
 workspace.configureMock({ now: () => new Date(Date.now() - 60000) });
 const transition = proposeStageTransition(request, { classLevel: '8' }, 'promotion');
 // Work created after the transition: the mock clock moves back to the present first.
 configureStageTransitionClock(() => new Date());
 workspace.configureMock({ now: () => new Date() });
 const unit = await pipeline.startLearningUnit(request, 'sample:cube:concept');
 assert.equal(stageProfileOf(request).classLevel, '8');
 const undone = undoStageTransition(request, transition.id);
 assert.equal(undone.state, 'undone');
 assert.equal(undone.laterWorkCount, 1);
 assert.equal(stageProfileOf(request).classLevel, '7');
 // Later work survives the undo.
 assert.equal(pipeline.getLearningWorkspace(request).units.some(u => u.id === unit.id), true);
 // Double undo is refused.
 assert.throws(() => undoStageTransition(request, transition.id), /applied/);
 // After the undo the notice is no longer active.
 assert.equal(getActiveTransitionNotice(request), null);
});

test('boundary jumps are CONFIRM: board change and a two-grade jump wait for the learner', () => {
 const request = ctx();
 // A prior stage exists, so switching boards is a genuine boundary jump.
 proposeStageTransition(request, { board: 'Sample', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 const boardJump = proposeStageTransition(request, { board: 'CBSE', classLevel: '7' }, 'family moved to CBSE board');
 assert.equal(boardJump.policy, 'CONFIRM');
 assert.equal(boardJump.state, 'awaiting-confirm');
 assert.equal(stageProfileOf(request).board || '', 'Sample', 'nothing applied before confirmation');
 const notice = getActiveTransitionNotice(request);
 assert.equal(notice?.id, boardJump.id);
 confirmStageTransition(request, boardJump.id);
 assert.equal(stageProfileOf(request).board || '', 'CBSE');
 const farJump = proposeStageTransition(request, { classLevel: '10' }, 'records corrected');
 assert.equal(farJump.policy, 'CONFIRM');
 assert.equal(farJump.state, 'awaiting-confirm');
});

test('identity is enforced: another account cannot propose, confirm, postpone or undo', async () => {
 const request = ctx();
 const transition = proposeStageTransition(request, { classLevel: '8' }, 'promotion');
 const other = ctx('bengali');
 const own = proposeStageTransition(other, { classLevel: '9' }, 'their own change');
 assert.equal(own.personId, 'demo-bengali', 'another learner changes their own profile only');
 assert.throws(() => confirmStageTransition(other, transition.id), /waiting for confirmation|personal learning/);
 assert.throws(() => postponeStageTransition(other, transition.id), /applied transition|personal learning/);
 assert.throws(() => undoStageTransition(other, transition.id), /applied transition|personal learning/);
 assert.equal(stageProfileOf(request).classLevel, '8');
});

test('an identical profile is refused and pending proposals do not stack', () => {
 const request = ctx();
 assert.throws(() => proposeStageTransition(request, { subjects: [] }, 'no change'), /already the active one/);
 proposeStageTransition(request, { board: 'Sample', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 const first = proposeStageTransition(request, { board: 'CBSE' }, 'switch to CBSE board');
 assert.equal(first.state, 'awaiting-confirm');
 // A newer proposal supersedes the pending one instead of stacking behind it.
 const second = proposeStageTransition(request, { classLevel: '8' }, 'corrected proposal');
 assert.equal(second.state, 'applied');
 const store = JSON.parse(localStorage.getItem('visionary_stage_transitions_v1'));
 const pending = store.transitions.filter(t => t.personId === 'demo-adult' && t.state === 'awaiting-confirm');
 assert.equal(pending.length, 0, 'the older pending proposal was superseded');
 assert.equal(workspaceIdentity(request).person.learningContext.classLevel, '8');
});

test('the teacher records a class promotion for every enrolled learner', () => {
 const teacher = ctx('teacher', 'teacher');
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'demo-class-cube', name: 'Space, shape and reasoning', subject: 'Geometry', teacher_email: 'teacher@visionary.test', teacher_id: 'demo-teacher', teacher_name: 'Dev', join_code: 'DEMO-CUBE', color: '#1967d2', createdAt: Date.now() }]));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ id: 'qa-enrollment-aarav', class_id: 'demo-class-cube', student_email: 'minor-cbse@visionary.test', student_id: 'demo-minor-cbse', student_name: 'Aarav', status: 'active', createdAt: Date.now() }, { id: 'qa-enrollment-maya', class_id: 'demo-class-cube', student_email: 'bengali@visionary.test', student_id: 'demo-bengali', student_name: 'Maya', status: 'active', createdAt: Date.now() }]));
 const learner = ctx('minor-cbse', 'student');
 // The learner starts in class 7 with a prior profile to protect.
 proposeStageTransition(learner, { board: 'CBSE', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 // A second learner in the same class, already in class 8.
 workspace.seedDemo('bengali');
 const maya = ctx('bengali', 'student');
 proposeStageTransition(maya, { board: 'CBSE', classLevel: '8', subjects: ['Mathematics'] }, 'already promoted');
 // An unassigned teacher is denied; so is a learner.
 assert.throws(() => proposeClassPromotion(ctx('school-teacher', 'teacher'), 'demo-class-cube', '8', 'end of year'), /assigned teacher/);
 assert.throws(() => proposeClassPromotion(learner, 'demo-class-cube', '8', 'end of year'), /Only a teacher/);
 const summary = proposeClassPromotion(teacher, 'demo-class-cube', '8', 'end of year promotion');
 assert.equal(summary.promoted.length, 1);
 assert.equal(summary.skipped.length, 1);
 assert.equal(workspaceIdentity(learner).person.learningContext.classLevel, '8');
 // The learner's own notice is active with the teacher's reason, and undo works.
 const notice = getActiveTransitionNotice(learner);
 assert.equal(notice?.state, 'applied');
 assert.match(notice?.reason || '', /end of year promotion/);
 const undone = undoStageTransition(learner, notice.id);
 assert.equal(undone.state, 'undone');
 assert.equal(workspaceIdentity(learner).person.learningContext.classLevel, '7');
});
