import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingLearningContext } from '../src/lib/onboardingLearningContext.js';
import { bootstrapPerson, updateStageProfile, workspaceIdentity, snapshot } from '../src/services/workspaceService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class CustomEvent { constructor(type) { this.type = type; } };

test('school setup keeps several user subjects without inventing a board catalog', () => {
  const context = onboardingLearningContext({ education_stage: 'school', board: 'CBSE', grade_level: 'Class 8', subjects: [' Mathematics ', 'Science', 'Mathematics', ''] });
  assert.equal(context.board, 'CBSE');
  assert.equal(context.classLevel, 'Class 8');
  assert.deepEqual(context.subjects, ['Mathematics', 'Science']);
  assert.deepEqual(onboardingLearningContext({ education_stage: 'school', board: 'CBSE', grade_level: 'Class 8' }).subjects, []);
});

test('higher education uses its institution and term, ignoring an old school choice', () => {
  const context = onboardingLearningContext({ education_stage: 'higher_ed', institution_type: 'university', institution_name: ' Example University ', degree_program: 'B.Sc', semester: 'Semester 2', board: 'CBSE', grade_level: 'Class 12', subjects: ['Chemistry', 'Mathematics'] });
  assert.equal(context.board, 'Example University');
  assert.equal(context.institution, 'Example University');
  assert.equal(context.classLevel, 'B.Sc · Semester 2');
  assert.equal(context.stage, 'higher_ed');
  assert.equal(onboardingLearningContext({ education_stage: 'higher_ed', institution_type: 'college', degree_program: 'BCA' }).board, 'college');
});

test('exam setup uses its examination and retains a declared school level; professional drops school context', () => {
  const exam = onboardingLearningContext({ education_stage: 'competitive', target_exam: 'GATE', board: 'CBSE', grade_level: 'Class 12', subjects: ['Engineering mathematics'] });
  assert.equal(exam.board, 'GATE');
  assert.equal(exam.exam, 'GATE');
  assert.equal(exam.classLevel, 'Class 12');
  const work = onboardingLearningContext({ education_stage: 'professional', board: 'CBSE', grade_level: 'Class 12', target_exam: 'GATE' });
  assert.equal(work.board, undefined);
  assert.equal(work.classLevel, undefined);
  assert.equal(work.exam, undefined);
});

test('higher-education bootstrap persists its context and a later sign-in retains a stage update', () => {
  memory.clear();
  const user = { id: 'higher-context', email: 'higher-context@fixture.test', identity: 'student', education_stage: 'higher_ed', age_band: 'adult', institution_name: 'Example College', degree_program: 'BCA', semester: 'Semester 1', subjects: ['Programming', 'Mathematics'] };
  const created = bootstrapPerson(user);
  const ctx = { personId: user.id, workspaceId: created.active, role: 'student', locale: 'en' };
  assert.equal(workspaceIdentity(ctx).person.learningContext.classLevel, 'BCA · Semester 1');
  assert.deepEqual(workspaceIdentity(ctx).person.learningContext.subjects, ['Programming', 'Mathematics']);
  updateStageProfile(ctx, { stage: 'higher_ed', board: 'Example College', institution: 'Example College', classLevel: 'BCA · Semester 2', subjects: ['Databases'] }, { replace: true });
  bootstrapPerson(user);
  assert.equal(workspaceIdentity(ctx).person.learningContext.classLevel, 'BCA · Semester 2');
  assert.deepEqual(workspaceIdentity(ctx).person.learningContext.subjects, ['Databases']);
});

test('school medium initializes an available teaching locale without overriding explicit preference', () => {
  memory.clear();
  const created = bootstrapPerson({ id: 'medium-context', email: 'medium-context@fixture.test', identity: 'student', education_stage: 'school', medium: 'Bengali' });
  assert.equal(snapshot({ personId: 'medium-context', workspaceId: created.active, role: 'student', locale: 'en' }).preferences.locale, 'bn');
  const explicit = bootstrapPerson({ id: 'explicit-medium', email: 'explicit-medium@fixture.test', identity: 'student', medium: 'Bengali', preferred_language: 'Hindi' });
  assert.equal(snapshot({ personId: 'explicit-medium', workspaceId: explicit.active, role: 'student', locale: 'en' }).preferences.locale, 'hi');
});
