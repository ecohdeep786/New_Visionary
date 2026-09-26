import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import { getDailyPlan, configureDailyPlanClock, deferPlanStep } from '../src/services/dailyPlanService.ts';
import { getHome } from '../src/services/homeService.ts';
import { configureMentorClock } from '../src/services/mentorStateService.ts';
import { SAMPLE_SELECTION } from '../src/services/contentRepository.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const at = () => new Date('2026-09-23T12:00:00Z');
const moveTo = iso => { configureDailyPlanClock(() => new Date(iso)); configureMentorClock(() => new Date(iso)); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date(iso) }); };
beforeEach(() => { memory.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: at }); configureDailyPlanClock(at); configureMentorClock(at); workspace.seedDemo('adult'); });

async function runSampleUnit(request) {
 await pipeline.selectLearningSyllabus(request, SAMPLE_SELECTION);
 const unit = await pipeline.startLearningUnit(request, 'sample:fractions:concept');
 await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
 const check = await pipeline.beginComprehension(request, unit.id);
 await pipeline.answerLearningQuestion(request, unit.id, check.question.answerIndex);
 return unit;
}

test('the daily plan sequences classwork and the open unit from real evidence without a duplicate review', async () => {
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'plan-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-25' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const request = ctx('minor-cbse');
 const unit = await runSampleUnit(request);
 moveTo('2026-10-01T12:00:00Z');
 const plan = getDailyPlan(request);
 assert.equal(plan.date, '2026-10-01');
 assert.deepEqual(plan.steps.map(step => [step.kind, step.title]), [['classwork', 'Make a model'], ['learn', unit.title]]);
 assert.equal(plan.steps[0].action.path, '/dashboard/classes?class=demo-class-cube');
 assert.match(plan.steps[0].detail, /Due 2026-09-25/);
 assert.equal(plan.steps[1].action.path, `/dashboard/learn?unit=${unit.id}`);
 // The unit is still open, so the due review is reached by continuing it, not repeated.
 assert.equal(plan.steps.some(step => step.kind === 'review'), false);
 assert.equal(plan.steps.every(step => step.reason && step.source), true);
});

test('a due review appears once its unit is finished and keeps an honest, evidence-backed wording', async () => {
 const request = ctx('adult');
 const unit = await runSampleUnit(request);
 let practiced = await pipeline.nextLearningQuestion(request, unit.id);
 practiced = await pipeline.answerLearningQuestion(request, unit.id, practiced.question.answerIndex);
 const artifact = await pipeline.createLearningProject(request, unit.id);
 workspace.saveArtifact(request, { ...artifact, body: 'A planned and made prototype.', milestones: [true, true, true], status: 'completed' });
 pipeline.recordProjectSave(request, workspace.snapshot(request).artifacts[0]);
 moveTo('2026-10-01T12:00:00Z');
 const plan = getDailyPlan(request);
 assert.deepEqual(plan.steps.map(step => step.kind), ['review']);
 assert.equal(plan.steps[0].title, `Review: ${unit.title}`);
 assert.match(plan.steps[0].detail, /not a claim about your ability/);
 assert.equal(plan.steps[0].action.path, '/dashboard/practice');
});

test('work verified earlier today closes the day instead of reopening it', async () => {
 const request = ctx('adult');
 const unit = await runSampleUnit(request);
 let practiced = await pipeline.nextLearningQuestion(request, unit.id);
 practiced = await pipeline.answerLearningQuestion(request, unit.id, practiced.question.answerIndex);
 const artifact = await pipeline.createLearningProject(request, unit.id);
 workspace.saveArtifact(request, { ...artifact, body: 'A planned and made prototype.', milestones: [true, true, true], status: 'completed' });
 const completed = workspace.snapshot(request).artifacts[0];
 pipeline.recordProjectSave(request, completed);
 const plan = getDailyPlan(request);
 assert.deepEqual(plan.steps.map(step => [step.kind, step.done]), [['learn', true], ['build', true]]);
 assert.ok(plan.steps.every(step => step.detail.startsWith('Done today')));
 // The linked project is not repeated next to its completed unit.
 assert.equal(plan.steps.filter(step => step.kind === 'build').length, 1);
 assert.equal(plan.steps.some(step => step.action.path === `/dashboard/learn?unit=${unit.id}`), true);
});

test('an empty record produces an empty plan and non-learner roles are refused', () => {
 const request = ctx();
 assert.deepEqual(getDailyPlan(request), { date: '2026-09-23', steps: [] });
 assert.throws(() => getDailyPlan(ctx('teacher', 'teacher')), /personal learning workspace/);
 assert.throws(() => getDailyPlan(ctx('parent', 'parent')), /personal learning workspace/);
 assert.throws(() => getDailyPlan(ctx('school-admin', 'organization')), /personal learning workspace/);
 workspace.seedDemo('minor-cbse');
 // A minor professional workspace cannot legitimately exist, so either the workspace or
 // the adult-only guard refuses first; both are honest refusals.
 assert.throws(() => getDailyPlan(ctx('minor-cbse', 'professional')), /adult|access/);
});

test('Home shows the plan as one Today’s plan module instead of scattered classwork and build lists', async () => {
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'plan-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-25' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const request = ctx('minor-cbse');
 await runSampleUnit(request);
 const home = await getHome(request);
 const planModule = home.modules.find(module => module.id === 'daily-plan');
 assert.ok(planModule, 'Today’s plan module is present');
 assert.deepEqual(planModule.rows.map(row => row.id), ['classwork:plan-classwork', `unit:${(await pipeline.getLearningWorkspace(request)).units[0].id}`]);
 assert.equal(home.priority.id, planModule.rows[0].id, 'the primary action and the first plan step must agree');
 assert.equal(home.priority.action.path, planModule.rows[0].action.path);
 assert.equal(home.modules.some(module => ['classwork', 'build'].includes(module.id)), false);
 const fresh = await getHome(ctx());
 assert.equal(fresh.modules.some(module => module.id === 'daily-plan'), false);
 assert.throws(getDailyPlan.bind(null, ctx('teacher', 'teacher')), /personal learning workspace/);
});

test('urgent classwork takes the one primary action; a later assignment does not interrupt an active conversation', async () => {
 seedConnectedFixtures(localStorage, at());
 const request = ctx('minor-cbse');
 const conversation = workspace.newConversation(request);
 workspace.startJourney(request, conversation.id, 'cube');
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'urgent-classwork', class_id: 'demo-class-cube', title: 'Due now', status: 'published', due_date: '2026-09-23' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 let home = await getHome(request);
 assert.equal(home.priority.id, 'classwork:urgent-classwork');
 assert.equal(home.priority.action.path, '/dashboard/classes?class=demo-class-cube');
 assignments[assignments.length - 1].due_date = '2026-10-30';
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 home = await getHome(request);
 assert.match(home.priority.action.path, /ask\?session=/);
 assert.equal(home.modules.find(module => module.id === 'daily-plan').rows[0].title, 'Due now');
});

test('classwork without a due date remains actionable when no activity is open', async () => {
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'undated-classwork', class_id: 'demo-class-cube', title: 'Open inquiry', status: 'published' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const home = await getHome(ctx('minor-cbse'));
 assert.equal(home.priority.id, 'classwork:undated-classwork');
 assert.equal(home.priority.source, 'Connected classwork');
});

test('a deferred step hides for today and returns tomorrow, scoped to the workspace', async () => {
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'defer-classwork', class_id: 'demo-class-cube', title: 'Bring the model', status: 'published', due_date: '2026-09-26' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const request = ctx('minor-cbse');
 const plan = getDailyPlan(request);
 const step = plan.steps.find(s => s.id === 'classwork:defer-classwork');
 assert.ok(step, 'the classwork step is planned');
 deferPlanStep(request, step.id);
 assert.equal(getDailyPlan(request).steps.some(s => s.id === step.id), false, 'hidden for today');
 // Another workspace's plan is unaffected by this deferral (Maya is not enrolled here).
 assert.equal(getDailyPlan(ctx('bengali')).steps.some(s => s.id === step.id), false, 'other workspace unaffected');
 // Tomorrow the step returns on its own.
 configureDailyPlanClock(() => new Date(Date.parse('2026-09-25T12:00:00Z') + 86400000));
 assert.equal(getDailyPlan(request).steps.some(s => s.id === step.id), true, 'back tomorrow');
 // Non-learner roles have no plan to defer.
 assert.throws(() => deferPlanStep(ctx('teacher', 'teacher'), step.id), /personal learning workspace/);
});
