import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';
import { getAssignedClasses, getStudentClasswork, getStudentClassLearningContext, recordLearningOutcome, getRecentContext, deleteMemory } from '../src/services/mentorStateService.ts';
import { getRoleMentorView, getCareerPath, requestTeacherSupport, saveCareerTarget } from '../src/services/roleMentorService.ts';
import { configureContentRepository, getContentRepository, PROFESSIONAL_SAMPLE_SELECTION } from '../src/services/contentRepository.ts';
import { configureTeachingInterface } from '../src/services/teachingInterface.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import { getHome } from '../src/services/homeService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person, role) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
beforeEach(() => { memory.clear(); configureContentRepository(null); configureTeachingInterface(null); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') }); workspace.seedDemo('adult'); seedConnectedFixtures(localStorage, new Date('2026-09-23T12:00:00Z')); });

test('five roles share scoped mentor services without exposing private student events', async () => {
 const student = ctx('minor-cbse', 'student');
 recordLearningOutcome(student, { id: 'class-evidence', conceptId: 'sample:cube:concept', kind: 'check', correct: 1, total: 1, verified: true, sessionId: 'learning-session', classId: 'demo-class-cube' });
 assert.equal(getStudentClasswork(student).length, 0); // Demo assignment was already submitted.
 assert.equal(getAssignedClasses(ctx('teacher', 'teacher')).length > 0, true);
 const teacher = await getRoleMentorView(ctx('teacher', 'teacher'));
 assert.equal(teacher.role, 'teacher'); assert.equal(teacher.aggregate.concepts.length, 1);
 assert.equal(JSON.stringify(teacher).includes('learning-session'), false);
 const parent = await getRoleMentorView(ctx('parent', 'parent'));
 assert.equal(parent.role, 'parent'); assert.equal(parent.summary.childId, 'demo-minor-cbse');
 assert.equal(JSON.stringify(parent).includes('learning-session'), false);
 const professional = await getRoleMentorView(ctx('adult', 'professional'));
 assert.equal(professional.role, 'professional'); assert.equal(professional.own.concepts.length, 0);
 const organization = await getRoleMentorView(ctx('school-admin', 'organization'));
 assert.equal(organization.role, 'organization'); assert.equal(JSON.stringify(organization).includes('learning-session'), false);
});

test('teacher requests use the disconnected teaching seam and never create a model answer', async () => {
 const request = ctx('teacher', 'teacher'); const classId = getAssignedClasses(request)[0].id;
 const response = await requestTeacherSupport(request, { mode: 'quiz', brief: 'Review cube volume', classId });
 assert.equal(response.status, 'not_connected');
 await assert.rejects(requestTeacherSupport(request, { mode: 'lesson', brief: 'Prepare', classId: 'unassigned' }), /not assigned/);
});

test('published classwork is visible only to actively enrolled students', () => {
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'new-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-25' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 assert.equal(getStudentClasswork(ctx('minor-cbse', 'student'))[0].id, 'new-classwork');
 assert.equal(getStudentClasswork(ctx('bengali', 'student')).some(item => item.id === 'new-classwork'), false);
 assert.throws(() => getStudentClasswork(ctx('parent', 'parent')), /student workspace/);
});

test('class learning context carries only an enrolled learner’s subject into Learn', () => {
 const student = ctx('minor-cbse', 'student');
 const connected = getStudentClassLearningContext(student, 'demo-class-cube');
 assert.equal(connected.id, 'demo-class-cube');
 assert.equal(typeof connected.subject, 'string');
 assert.equal(Object.hasOwn(connected, 'enrollments'), false);
 assert.throws(() => getStudentClassLearningContext(ctx('bengali', 'student'), 'demo-class-cube'), /not connected/);
 assert.throws(() => getStudentClassLearningContext(ctx('parent', 'parent'), 'demo-class-cube'), /student workspace/);
 const enrollments = JSON.parse(localStorage.getItem('visionary_entity_Enrollment'));
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify(enrollments.map(item => item.class_id === 'demo-class-cube' && item.student_id === student.personId ? { ...item, status: 'revoked' } : item)));
 assert.throws(() => getStudentClassLearningContext(student, 'demo-class-cube'), /not connected/);
});

test('professional target is personal and adult-only; guardian revocation closes the report', async () => {
 const professional = ctx('adult', 'professional');
 const target = saveCareerTarget(professional, { title: 'Data interpretation', body: 'Create a portfolio report.' });
 assert.equal((await getRoleMentorView(professional)).goal.id, target.id);
 await assert.rejects(getRoleMentorView(ctx('minor-cbse', 'professional')), /access|Professional journeys/);
 const parent = ctx('parent', 'parent'); const relationship = workspace.visibleRelationships(parent).find(item => item.to === 'demo-minor-cbse' && item.status === 'active');
 workspace.changeRelationship(parent, relationship.id, 'revoked');
 const view = await getRoleMentorView(parent);
 assert.equal(view.children.some(child => child.id === 'demo-minor-cbse'), false);
 await assert.rejects(getRoleMentorView(parent, 'demo-minor-cbse'), /no longer shared/);
});

test('professional goal links only owned capability evidence and a private portfolio project', async () => {
 const professional = ctx('professional', 'professional');
 const repository = getContentRepository(professional);
 const outline = await pipeline.selectLearningSyllabus(professional, PROFESSIONAL_SAMPLE_SELECTION);
 assert.equal(outline.status, 'sample');
 assert.equal(outline.chapters.length, 1);
 const topic = (await repository.getTopics(outline.chapters[0].id))[0];
 const concept = (await repository.getConcepts(topic.id))[0];
 assert.equal(concept.audience, 'adult');
 assert.equal(concept.id, 'sample:data:concept');
 for (const [locale, script] of [['hi', /[\u0900-\u097f]/], ['bn', /[\u0980-\u09ff]/]]) {
  const localized = await getContentRepository({ ...professional, locale }).getConcept(concept.id);
  assert.match(localized.title, script);
  assert.equal(localized.check.source, 'authored-sample');
 }
 assert.throws(() => saveCareerTarget(professional, { title: 'Invented skill', body: '', conceptId: 'another-workspace-concept' }), /own learning outline/);
 const unlinked = saveCareerTarget(professional, { title: 'Data-informed decisions', body: 'Write a sample report.' });
 assert.match((await getHome(professional)).priority.title, /Data-informed decisions/);
 const unit = await pipeline.startLearningUnit(professional, concept.id);
 const goal = saveCareerTarget(professional, { id: unlinked.id, title: 'Data-informed decisions', body: 'Write a sample report.', conceptId: concept.id });
 assert.equal((await getHome(professional)).priority.action.path, `/dashboard/learn?unit=${unit.id}`, 'an open learning unit outranks the saved target');
 assert.equal(getCareerPath(professional).target.unitId, unit.id);
 assert.equal(getCareerPath(professional).target.evidence, null);
 await pipeline.requestUnitTeaching(professional, unit.id, 'explanation');
 const check = await pipeline.beginComprehension(professional, unit.id);
 await pipeline.answerLearningQuestion(professional, unit.id, check.question.answerIndex);
 const practice = await pipeline.nextLearningQuestion(professional, unit.id);
 await pipeline.answerLearningQuestion(professional, unit.id, practice.question.answerIndex);
 const artifact = await pipeline.createLearningProject(professional, unit.id);
 const completed = workspace.saveArtifact(professional, { ...artifact, body: 'Fictional task totals and a limitation.', milestones: [true, true, true], status: 'completed' });
 pipeline.recordProjectSave(professional, completed);
 const path = getCareerPath(professional);
 assert.equal(path.goal.id, goal.id);
 assert.equal(path.target.evidence.total, 2);
 assert.equal(path.portfolio.find(item => item.id === artifact.id).conceptId, concept.id);
 assert.equal(path.portfolio.find(item => item.id === artifact.id).visibility, 'private');
 assert.equal(JSON.stringify(getCareerPath(ctx('employee', 'professional'))).includes(goal.title), false);
 assert.throws(() => getCareerPath(ctx('parent', 'parent')), /professional workspace/);
 assert.throws(() => saveCareerTarget(ctx('employee', 'professional'), { id: goal.id, title: 'Take over', body: '' }), /not available/);
 const minor = ctx('minor-cbse', 'student');
 const minorOutline = await getContentRepository(minor).getSyllabus(PROFESSIONAL_SAMPLE_SELECTION.board, PROFESSIONAL_SAMPLE_SELECTION.classLevel, PROFESSIONAL_SAMPLE_SELECTION.subject);
 assert.equal(minorOutline.status, 'provisional');
});

test('turning personalization off keeps retained memory visible to its owner for deletion', () => {
 const student = ctx('adult', 'student');
 recordLearningOutcome(student, { id: 'observed', conceptId: 'sample:fractions:concept', kind: 'practice', correct: 1, total: 1, verified: true, sessionId: 'local-session' });
 assert.equal(getRecentContext(student).length, 1);
 workspace.updatePreferences(student, { memory: false });
 assert.equal(getRecentContext(student).length, 1);
 deleteMemory(student);
 assert.deepEqual(getRecentContext(student), []);
});
