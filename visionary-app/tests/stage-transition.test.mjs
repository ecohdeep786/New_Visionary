import {readStageEditorDraft,saveStageEditorDraft,clearStageEditorDraft,stageEditorRevision} from '../src/services/stageEditorDraft.js';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { workspaceIdentity } from '../src/services/workspaceService.ts';
const stageProfileOf = request => workspaceIdentity(request).person.learningContext || {};
import * as pipeline from '../src/services/learningPipelineService.ts';
import { proposeStageTransition, proposeClassPromotion, confirmStageTransition, postponeStageTransition, undoStageTransition, getActiveTransitionNotice, getParentStageInsight, configureStageTransitionClock, getStageContinuity, getStageProfile, getStageSuggestions, respondStageSuggestion } from '../src/services/stageTransitionService.ts';
import { getOrganizationAggregate } from '../src/services/mentorStateService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';
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

test('class promotion preserves competitive stage and exam through postpone and undo', () => {
 const user = { id: 'competitive-stage', email: 'competitive-stage@visionary.test', full_name: 'Exam Learner', identity: 'student', age_band: 'minor', onboarding_complete: true, education_stage: 'competitive', target_exam: 'JEE Advanced', grade_level: 'Class 11' };
 workspace.bootstrapPerson(user);
 const request = { personId: user.id, workspaceId: `${user.id}:student`, role: 'student', locale: 'en' };
 const transition = proposeStageTransition(request, { classLevel: 'Class 12' }, 'school promotion');
 assert.equal(stageProfileOf(request).stage, 'competitive');
 assert.equal(stageProfileOf(request).exam, 'JEE Advanced');
 postponeStageTransition(request, transition.id);
 assert.equal(stageProfileOf(request).stage, 'competitive');
 assert.equal(stageProfileOf(request).exam, 'JEE Advanced');
 clockAt('2026-10-04T12:00:00Z');
 getActiveTransitionNotice(request);
 undoStageTransition(request, transition.id);
 assert.equal(stageProfileOf(request).classLevel, 'Class 11');
 assert.equal(stageProfileOf(request).stage, 'competitive');
 assert.equal(stageProfileOf(request).exam, 'JEE Advanced');
});

test('sign-in bootstrap keeps the active transition instead of restoring stale onboarding stage', () => {
 const user = { id: 'returning-learner', email: 'returning-learner@visionary.test', full_name: 'Returning Learner', identity: 'student', age_band: 'minor', onboarding_complete: true, education_stage: 'secondary', grade_level: 'Class 7' };
 workspace.bootstrapPerson(user);
 const request = { personId: user.id, workspaceId: `${user.id}:student`, role: 'student', locale: 'en' };
 const transition = proposeStageTransition(request, { classLevel: 'Class 8' }, 'end of year');
 assert.equal(stageProfileOf(request).classLevel, 'Class 8');
 workspace.bootstrapPerson(user);
 assert.equal(stageProfileOf(request).classLevel, 'Class 8');
 assert.equal(getActiveTransitionNotice(request)?.id, transition.id);
 undoStageTransition(request, transition.id);
 workspace.bootstrapPerson(user);
 assert.equal(stageProfileOf(request).classLevel, 'Class 7');
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

test('a consented parent sees a minimal class update, then Undo, and loses access on revocation', () => {
 const child = ctx('minor-cbse'); const parent = ctx('parent', 'parent');
 proposeStageTransition(child, { classLevel: '7' }, 'starting class');
 const transition = proposeStageTransition(child, { classLevel: '8' }, 'private teacher reason');
 assert.deepEqual(getParentStageInsight(parent, child.personId), { state: 'applied', from: '7', to: '8', at: at().toISOString() });
 assert.ok(!JSON.stringify(getParentStageInsight(parent, child.personId)).includes('private teacher reason'));
 const subjectChange=proposeStageTransition(child, { subjects: ['Mathematics'] }, 'subject plan');
 assert.equal(getParentStageInsight(parent, child.personId)?.state, 'applied', 'a later subject update keeps the recent class update visible');
 assert.throws(()=>undoStageTransition(child,transition.id),/stage changed after/);
 undoStageTransition(child,subjectChange.id);
 undoStageTransition(child, transition.id);
 assert.deepEqual(getParentStageInsight(parent, child.personId), { state: 'undone', from: '7', to: '8', at: at().toISOString() });
 workspace.changeRelationship(parent, 'demo-parent:demo-minor-cbse', 'revoked');
 assert.equal(workspace.familyReports(parent).some(report => report.id === child.personId), false);
 assert.throws(() => getParentStageInsight(parent, child.personId), /not shared/);
 assert.throws(() => getParentStageInsight(ctx('school-admin', 'organization'), child.personId), /not shared|access/);
});

test('a postponed parent class update uses the postponement date and expires after seven days', () => {
 const child = ctx('minor-cbse'); const parent = ctx('parent', 'parent');
 proposeStageTransition(child, { classLevel: '7' }, 'starting class');
 const transition = proposeStageTransition(child, { classLevel: '8' }, 'promotion');
 clockAt('2026-09-29T12:00:00Z');
 postponeStageTransition(child, transition.id);
 assert.equal(getParentStageInsight(parent, child.personId)?.state, 'postponed');
 assert.equal(getParentStageInsight(parent, child.personId)?.at, '2026-09-29T12:00:00.000Z');
 clockAt('2026-10-05T12:00:00Z');
 assert.equal(getParentStageInsight(parent, child.personId)?.state, 'postponed');
 clockAt('2026-10-07T12:00:00Z');
 assert.equal(getParentStageInsight(parent, child.personId), null);
});

test('organization aggregate stays class-scoped through stage change and drops revoked enrollment', () => {
 seedConnectedFixtures(localStorage, at());
 const child = ctx('minor-cbse'); const organization = ctx('school-admin', 'organization');
 proposeStageTransition(child, { classLevel: '7' }, 'starting class');
 proposeStageTransition(child, { classLevel: '8' }, 'private change reason');
 const before = getOrganizationAggregate(organization);
 assert.equal(before.learnerCount, 2);
 assert.ok(!JSON.stringify(before).includes('private change reason'));
 assert.ok(!('stage' in before));
 const memberships = JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite'));
 memberships.find(item => item.email === 'minor-cbse@visionary.test').status = 'revoked';
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify(memberships));
 assert.equal(getOrganizationAggregate(organization).learnerCount, 1);
});

test('a failed Undo notice write restores the active mapping so retry is safe', () => {
 const request = ctx();
 proposeStageTransition(request, { classLevel: '7' }, 'starting class');
 const transition = proposeStageTransition(request, { classLevel: '8' }, 'promotion');
 const setItem = localStorage.setItem;
 let fail = true;
 localStorage.setItem = (key, value) => {
  if (key === 'visionary_stage_transitions_v1' && fail) { fail = false; throw new Error('Quota exceeded'); }
  setItem(key, value);
 };
 try { assert.throws(() => undoStageTransition(request, transition.id), /could not be saved/); }
 finally { localStorage.setItem = setItem; }
 assert.equal(stageProfileOf(request).classLevel, '8');
 assert.equal(getActiveTransitionNotice(request)?.state, 'applied');
 undoStageTransition(request, transition.id);
 assert.equal(stageProfileOf(request).classLevel, '7');
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

test('the teacher records a class promotion for every enrolled learner', async () => {
 const teacher = ctx('teacher', 'teacher');
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'demo-class-cube', name: 'Space, shape and reasoning', subject: 'Geometry', teacher_email: 'teacher@visionary.test', teacher_id: 'demo-teacher', teacher_name: 'Dev', join_code: 'DEMO-CUBE', color: '#1967d2', createdAt: Date.now() }]));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ id: 'qa-enrollment-aarav', class_id: 'demo-class-cube', student_email: 'minor-cbse@visionary.test', student_id: 'demo-minor-cbse', student_name: 'Aarav', status: 'active', createdAt: Date.now() }, { id: 'qa-enrollment-maya', class_id: 'demo-class-cube', student_email: 'bengali@visionary.test', student_id: 'demo-bengali', student_name: 'Maya', status: 'active', createdAt: Date.now() }]));
 const learner = ctx('minor-cbse', 'student');
 // The learner starts in class 7 with a prior profile to protect.
 proposeStageTransition(learner, { board: 'CBSE', classLevel: '7', subjects: ['Mathematics'] }, 'initial stage');
 await pipeline.selectLearningSyllabus(learner, SAMPLE_SELECTION);
 const savedUnit = await pipeline.startLearningUnit(learner, 'sample:cube:concept');
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
 assert.equal(notice?.diff.unitsKept, 1);
 assert.match(notice?.reason || '', /end of year promotion/);
 const undone = undoStageTransition(learner, notice.id);
 assert.equal(undone.state, 'undone');
 assert.equal(workspaceIdentity(learner).person.learningContext.classLevel, '7');
 assert.equal(pipeline.getLearningWorkspace(learner).units.some(unit => unit.id === savedUnit.id), true);
});

test('teacher promotion validates the full roster before changing the first learner', () => {
 const teacher = ctx('teacher', 'teacher');
 const learner = ctx('minor-cbse', 'student');
 proposeStageTransition(learner, { classLevel: '7' }, 'starting class');
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'class-preflight', teacher_id: 'demo-teacher' }]));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([
  { class_id: 'class-preflight', student_id: learner.personId, status: 'active' },
  { class_id: 'class-preflight', student_id: 'missing-learner', status: 'active' },
 ]));
 const before = stageProfileOf(learner);
 const notices = localStorage.getItem('visionary_stage_transitions_v1');
 assert.throws(() => proposeClassPromotion(teacher, 'class-preflight', '8', 'end of year'), /access to this workspace/);
 assert.deepEqual(stageProfileOf(learner), before);
 assert.equal(localStorage.getItem('visionary_stage_transitions_v1'), notices);
});

test('teacher promotion restores the class profile if the notice write fails and retry succeeds once', () => {
 const teacher = ctx('teacher', 'teacher');
 const learner = ctx('minor-cbse', 'student');
 proposeStageTransition(learner, { classLevel: '7' }, 'starting class');
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'class-retry', teacher_id: 'demo-teacher' }]));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ class_id: 'class-retry', student_id: learner.personId, status: 'active' }]));
 const before = stageProfileOf(learner);
 const notices = localStorage.getItem('visionary_stage_transitions_v1');
 const setItem = localStorage.setItem;
 let fail = true;
 localStorage.setItem = (key, value) => {
  if (key === 'visionary_stage_transitions_v1' && fail) { fail = false; throw new Error('Quota exceeded'); }
  setItem(key, value);
 };
 try { assert.throws(() => proposeClassPromotion(teacher, 'class-retry', '8', 'end of year'), /could not be saved/); }
 finally { localStorage.setItem = setItem; }
 assert.deepEqual(stageProfileOf(learner), before);
 assert.equal(localStorage.getItem('visionary_stage_transitions_v1'), notices);
 const result = proposeClassPromotion(teacher, 'class-retry', '8', 'end of year');
 assert.equal(result.promoted.length, 1);
 assert.equal(proposeClassPromotion(teacher, 'class-retry', '8', 'end of year').promoted.length, 0);
 assert.equal(stageProfileOf(learner).classLevel, '8');
});

test('teacher cannot automatically apply a nonadjacent class change', () => {
 const teacher = ctx('teacher', 'teacher');
 const learner = ctx('minor-cbse', 'student');
 proposeStageTransition(learner, { classLevel: '6' }, 'starting class');
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'class-jump', teacher_id: 'demo-teacher' }]));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ class_id: 'class-jump', student_id: learner.personId, status: 'active' }]));
 const result = proposeClassPromotion(teacher, 'class-jump', '8', 'end of year');
 assert.equal(result.promoted.length, 0);
 assert.match(result.skipped[0].reason, /learner confirmation/);
 assert.equal(stageProfileOf(learner).classLevel, '6');
});

test('stage continuity keeps exact saved positions, source outline and review dates without new-stage mastery',async()=>{const request=ctx();await pipeline.selectLearningSyllabus(request,SAMPLE_SELECTION);proposeStageTransition(request,{board:'Sample',classLevel:'6',subjects:['Mathematics','Art']},'Starting profile');const unit=await pipeline.startLearningUnit(request,'sample:cube:concept');await pipeline.updateLearningLanguage(request,unit.id,'en');await pipeline.requestUnitTeaching(request,unit.id,'explanation');await pipeline.beginComprehension(request,unit.id);await pipeline.answerLearningQuestion(request,unit.id,pipeline.getLearningUnit(request,unit.id).question.answerIndex);const prior=memory.get('visionary_learning_pipeline_v1');const transition=proposeStageTransition(request,{classLevel:'7',subjects:['Mathematics','Science']},'Next class');const detail=getStageContinuity(request,transition.id);assert.deepEqual(detail.subjects,{kept:['Mathematics'],added:['Science'],removed:['Art']});assert.equal(detail.mappingStatus,'awaiting-reviewed-mapping');assert.equal(detail.sourceSelection.classLevel,'6');assert.equal(detail.activities[0].path,'/dashboard/learn?unit='+encodeURIComponent(unit.id));assert.equal(detail.activities[0].stage,pipeline.getLearningUnit(request,unit.id).stage);assert.ok(detail.activities[0].dueAt);assert.equal(memory.get('visionary_learning_pipeline_v1'),prior);assert.throws(()=>getStageContinuity(ctx('bengali'),transition.id),/unavailable/);undoStageTransition(request,transition.id);assert.equal(getStageContinuity(request,transition.id).activities[0].id,unit.id);});
test('stale confirmation and expired postponement cannot rewrite a newer profile',()=>{const request=ctx();proposeStageTransition(request,{board:'Sample',classLevel:'6'},'Start');const pending=proposeStageTransition(request,{board:'CBSE'},'Boundary');workspace.updateStageProfile(request,{classLevel:'9'});const before=memory.get('visionary_workspace_v2');assert.throws(()=>confirmStageTransition(request,pending.id),/stage changed after/);assert.equal(memory.get('visionary_workspace_v2'),before);const next=proposeStageTransition(request,{classLevel:'10'},'Adjacent');clockAt('2026-10-12T12:00:00Z');assert.throws(()=>postponeStageTransition(request,next.id),/14-day/);});
test('unreadable retained learning blocks a personal transition without swapping the profile',()=>{const request=ctx(),before=memory.get('visionary_workspace_v2');memory.set('visionary_learning_pipeline_v1','{broken');assert.throws(()=>proposeStageTransition(request,{classLevel:'7'},'Change'),/evidence could not be checked/);assert.equal(memory.get('visionary_workspace_v2'),before);assert.equal(memory.get('visionary_learning_pipeline_v1'),'{broken');});

test('calendar events cannot bypass pending decisions and stable retries never reapply postponed work',()=>{const request=ctx();proposeStageTransition(request,{classLevel:'6'},'Start');clockAt('2026-10-12T12:00:00Z');const change=proposeStageTransition(request,{classLevel:'7'},'Calendar fixture',{trigger:'calendar',eventId:'year:2026'});postponeStageTransition(request,change.id);const before=memory.get('visionary_stage_transitions_v1');assert.equal(proposeStageTransition(request,{classLevel:'7'},'Retry',{trigger:'calendar',eventId:'year:2026'}).state,'postponed');assert.throws(()=>proposeStageTransition(request,{classLevel:'8'},'Another calendar event',{trigger:'calendar',eventId:'year:2027'}),/takes priority/);assert.equal(stageProfileOf(request).classLevel,'6');assert.equal(memory.get('visionary_stage_transitions_v1'),before);assert.throws(()=>proposeStageTransition(request,{classLevel:'9'},'Changed retry',{trigger:'calendar',eventId:'year:2026'}),/identifier/);});
test('evidence is suggestion-only and acceptance preserves pending boundaries and rollback',()=>{const request=ctx();proposeStageTransition(request,{board:'Sample',classLevel:'6'},'Start');const active=getActiveTransitionNotice(request);const suggestion=proposeStageTransition(request,{classLevel:'7'},'Evidence fixture only',{trigger:'evidence',eventId:'signal:1'});assert.equal(suggestion.state,'suggested');assert.equal(stageProfileOf(request).classLevel,'6');assert.equal(getActiveTransitionNotice(request).id,active.id);assert.equal(getStageSuggestions(request).length,1);const original=localStorage.setItem;localStorage.setItem=(key,value)=>{if(key==='visionary_stage_transitions_v1')throw Error('Full');original(key,value);};assert.throws(()=>respondStageSuggestion(request,suggestion.id,true),/could not be saved/);localStorage.setItem=original;assert.equal(stageProfileOf(request).classLevel,'6');assert.equal(getStageSuggestions(request).length,1);const applied=respondStageSuggestion(request,suggestion.id,true);assert.equal(applied.trigger,'self-confirmation');assert.equal(stageProfileOf(request).classLevel,'7');assert.equal(getStageSuggestions(request).length,0);const boundary=proposeStageTransition(request,{board:'CBSE'},'Boundary suggestion',{trigger:'evidence',eventId:'signal:2'});assert.equal(respondStageSuggestion(request,boundary.id,true).state,'awaiting-confirm');assert.equal(stageProfileOf(request).board,'Sample');});
test('institution and education boundaries retain age permissions and exact institution on Undo',()=>{const request=ctx();proposeStageTransition(request,{institution:'School A',stage:'school',classLevel:'6'},'Start');const boundary=proposeStageTransition(request,{institution:'School B',stage:'higher_ed'},'New institution');assert.equal(boundary.policy,'CONFIRM');assert.deepEqual(boundary.boundaryReasons,['Institution change','Education stage change']);assert.equal(stageProfileOf(request).institution,'School A');confirmStageTransition(request,boundary.id);assert.equal(stageProfileOf(request).institution,'School B');undoStageTransition(request,boundary.id);assert.equal(stageProfileOf(request).institution,'School A');const minor=ctx('minor-cbse');const before=workspaceIdentity(minor).person.ageBand;const safety=proposeStageTransition(minor,{stage:'higher_ed'},'Education boundary');assert.equal(safety.state,'awaiting-confirm');confirmStageTransition(minor,safety.id);assert.equal(workspaceIdentity(minor).person.ageBand,before);});
test('stale editor profile and spoofed teacher authority cannot overwrite current state',()=>{const request=ctx(),base=JSON.stringify(getStageProfile(request));proposeStageTransition(request,{classLevel:'6'},'Newer profile');assert.throws(()=>proposeStageTransition(request,{classLevel:'7'},'Stale editor',{expectedProfile:base}),/profile changed/);assert.throws(()=>proposeStageTransition(request,{classLevel:'7'},'Spoofed',{trigger:'teacher-promotion'}),/trigger/);assert.equal(stageProfileOf(request).classLevel,'6');});

test('teacher promotion retry preserves the same postponed event and records authority only through its class service',()=>{const learner=ctx(),teacher=ctx('teacher','teacher');proposeStageTransition(learner,{classLevel:'6'},'Start');localStorage.setItem('visionary_entity_Classroom',JSON.stringify([{id:'policy-class',teacher_id:'demo-teacher',teacher_email:'teacher@visionary.test',name:'Policy class',subject:'Mathematics'}]));localStorage.setItem('visionary_entity_Enrollment',JSON.stringify([{id:'policy-enrollment',class_id:'policy-class',student_id:'demo-adult',student_email:workspaceIdentity(learner).person.email,status:'active'}]));assert.equal(proposeClassPromotion(teacher,'policy-class','7','Promotion').promoted.length,1);const notice=getActiveTransitionNotice(learner);assert.equal(notice.trigger,'teacher-promotion');assert.deepEqual(notice.classScope,{classId:'policy-class'});postponeStageTransition(learner,notice.id);const before=memory.get('visionary_stage_transitions_v1');const retry=proposeClassPromotion(teacher,'policy-class','7','Retry');assert.equal(retry.promoted.length,0);assert.equal(retry.skipped.length,1);assert.equal(stageProfileOf(learner).classLevel,'6');assert.equal(memory.get('visionary_stage_transitions_v1'),before);});

test('stage editor drafts resume their original profile revision and reject stale tab overwrites',()=>{const request=ctx(),base=JSON.stringify(getStageProfile(request));const first=saveStageEditorDraft(request,{board:'Sample',classLevel:'7',subjectsText:'Mathematics'},base,'null');assert.equal(readStageEditorDraft(request).fields.classLevel,'7');assert.equal(readStageEditorDraft(request).base,base);const changed=saveStageEditorDraft(request,{classLevel:'8'},base,stageEditorRevision(first));assert.throws(()=>saveStageEditorDraft(request,{classLevel:'9'},base,stageEditorRevision(first)),/another tab/);assert.throws(()=>clearStageEditorDraft(request,stageEditorRevision(first)),/newer editor/);assert.equal(readStageEditorDraft(request).fields.classLevel,'8');clearStageEditorDraft(request,stageEditorRevision(changed));assert.equal(readStageEditorDraft(request),null);});
test('failed and unreadable stage editor backups preserve saved bytes',()=>{const request=ctx(),base=JSON.stringify(getStageProfile(request)),draft=saveStageEditorDraft(request,{classLevel:'7'},base,'null'),key='visionary_stage_editor_v1:'+request.workspaceId,before=memory.get(key),original=localStorage.setItem;try{localStorage.setItem=()=>{throw Error('Full');};assert.throws(()=>saveStageEditorDraft(request,{classLevel:'8'},base,stageEditorRevision(draft)),/backed up/);}finally{localStorage.setItem=original;}assert.equal(memory.get(key),before);memory.set(key,'{broken stage');assert.throws(()=>readStageEditorDraft(request),/could not be read/);assert.throws(()=>saveStageEditorDraft(request,{classLevel:'8'},base,'null'),/could not be read/);assert.equal(memory.get(key),'{broken stage');});

test('organization Work scope cannot edit or back up the personal stage profile',()=>{
 seedConnectedFixtures(localStorage,at());
 const request=ctx('minor-cbse'),db=JSON.parse(memory.get('visionary_workspace_v2'));
 const membership=JSON.parse(memory.get('visionary_entity_OrganizationInvite')).find(row=>row.email==='minor-cbse@visionary.test'&&row.status==='active');
 const work={...db.workspaces.find(row=>row.id===request.workspaceId),id:'stage-work-scope',organizationId:membership.organization_email};
 db.workspaces.push(work);db.data[work.id]=structuredClone(db.data[request.workspaceId]);memory.set('visionary_workspace_v2',JSON.stringify(db));
 const workRequest={...request,workspaceId:work.id},before=memory.get('visionary_workspace_v2');
 assert.throws(()=>getStageProfile(workRequest),/personal learning workspace/);
 assert.throws(()=>proposeStageTransition(workRequest,{classLevel:'9'},'Work edit'),/personal learning workspace/);
 assert.throws(()=>saveStageEditorDraft(workRequest,{},'base','null'),/personal learning workspace/);
 assert.equal(memory.get('visionary_workspace_v2'),before);
 assert.equal(memory.get('visionary_stage_editor_v1:'+work.id),undefined);
});

test('clearing established source, institution or education stage still requires confirmation',()=>{
 const request=ctx();proposeStageTransition(request,{board:'Sample',institution:'School A',stage:'school'},'Initial profile');
 const cleared=proposeStageTransition(request,{board:undefined,institution:undefined,stage:undefined},'Clear fields');
 assert.equal(cleared.state,'awaiting-confirm');assert.deepEqual(cleared.boundaryReasons,['Board change','Institution change','Education stage change']);
 assert.equal(getStageProfile(request).institution,'School A');confirmStageTransition(request,cleared.id);assert.equal(getStageProfile(request).institution,undefined);
 undoStageTransition(request,cleared.id);assert.equal(getStageProfile(request).institution,'School A');
});
