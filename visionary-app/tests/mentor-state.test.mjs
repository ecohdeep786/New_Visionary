import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
let now;
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const outcome = (id, kind = 'practice', correct = 1, extra = {}) => ({ id, kind, conceptId: 'sample:cube:concept', sessionId: 'session-one', correct, total: 1, verified: true, ...extra });
function editWorkspace(fn) { const db = JSON.parse(storage.get('visionary_workspace_v2')); fn(db); storage.set('visionary_workspace_v2', JSON.stringify(db)); }
beforeEach(() => {
 storage.clear(); now = new Date('2026-09-23T12:00:00Z'); mentor.configureMentorClock(() => now);
 workspace.configureMock({ latency: 0, fault: 'none', now: () => now }); workspace.seedDemo('adult'); seedConnectedFixtures(localStorage, now);
});

test('Learn checks persist numerator/denominator; Practice adapts and Build adds application evidence without pretending mastery', () => {
 const request = ctx();
 assert.equal(mentor.getStudentState(request).concepts.length, 0);
 assert.equal(mentor.getWeakConcepts(request).length, 0);
 mentor.recordLearningOutcome(request, outcome('check', 'check'));
 let state = mentor.getStudentState(request).concepts[0];
 assert.equal(state.correct, 1); assert.equal(state.total, 1); assert.equal(state.stage, 'Practicing');
 mentor.recordLearningOutcome(request, outcome('practice-right'));
 state = mentor.getStudentState(request).concepts[0]; assert.equal(state.difficulty, 2); assert.equal(state.stage, 'Secure');
 mentor.recordLearningOutcome(request, outcome('practice-wrong', 'practice', 0));
 state = mentor.getStudentState(request).concepts[0]; assert.equal(state.difficulty, 1); assert.equal(state.correct, 2); assert.equal(state.total, 3); assert.equal(state.stage, 'Needs review');
 assert.equal(mentor.getWeakConcepts(request).length, 1);
 mentor.recordLearningOutcome(request, outcome('build', 'application', 0, { total: 0, verified: false }));
 state = mentor.getStudentState(request).concepts[0]; assert.equal(state.applicationCount, 1); assert.equal(state.weightedSignal, 6); assert.notEqual(state.stage, 'Mastered'); assert.equal(state.total, 3);
 assert.deepEqual(mentor.getInteractionEvents(request).map(e => e.app), ['LEARN', 'PRACTICE', 'PRACTICE', 'BUILD']);
 assert.equal(mentor.getInteractionEvents(request).at(-1).verification_result, 'unverified');
});

test('evidence is idempotent, cannot be replaced, and SCM/event/memory storage failure is atomic', () => {
 const request = ctx(); const evidence = outcome('same');
 mentor.recordLearningOutcome(request, evidence); mentor.recordLearningOutcome(request, evidence);
 assert.equal(mentor.getStudentState(request).concepts[0].evidenceCount, 1); assert.equal(mentor.getInteractionEvents(request).length, 1); assert.equal(mentor.getRecentContext(request).length, 1);
 assert.throws(() => mentor.recordLearningOutcome(request, { ...evidence, correct: 0 }), /different evidence/);
 const prior = storage.get('visionary_mentor_v1'); const set = localStorage.setItem; localStorage.setItem = () => { throw Error('storage unavailable'); };
 try { assert.throws(() => mentor.recordLearningOutcome(request, outcome('failed')), /could not be saved/); } finally { localStorage.setItem = set; }
 assert.equal(storage.get('visionary_mentor_v1'), prior);
 assert.throws(() => mentor.recordLearningOutcome(request, outcome('bad', 'practice', 2)), /invalid accuracy/);
});

test('strong verified application plus varied and delayed retrieval establishes mastery, not a single grade', () => {
 const request = ctx(); mentor.recordLearningOutcome(request, outcome('check', 'check'));
 mentor.recordLearningOutcome(request, outcome('application', 'application'));
 assert.notEqual(mentor.getStudentState(request).concepts[0].stage, 'Mastered');
 now = new Date('2026-09-25T12:00:00Z'); mentor.recordLearningOutcome(request, outcome('delayed'));
 assert.equal(mentor.getStudentState(request).concepts[0].stage, 'Mastered');
 now = new Date('2026-10-04T12:00:00Z'); assert.equal(mentor.getStudentState(request).concepts[0].stage, 'Needs review');
});

test('events support all apps and allowlist fields, scrub raw and encoded identifiers, and ignore forged ownership', () => {
 const request = ctx(); const privateText = 'person@example.com +91 9876543210';
 for (const app of ['LEARN', 'ASK', 'PRACTICE', 'BUILD']) mentor.emitInteractionEvent(request, { app, action: 'request', sessionId: privateText, conceptId: encodeURIComponent(privateText), board: privateText, classLevel: privateText, exam: privateText, promptVersion: privateText, text: privateText, metadata: { privateText }, user_id: privateText, role: 'organization', inputType: 'raw secret', language: 'raw secret', verification: privateText, intent: privateText, responseStatus: privateText, latency: 23 });
 const events = mentor.getInteractionEvents(request); const json = JSON.stringify(events);
 assert.equal(events.length, 4); assert.ok(events.every(e => e.role === 'student' && e.latency === 23 && e.timestamp === now.toISOString()));
 for (const secret of ['example.com', '9876543210', '%40', 'privateText', 'raw secret', 'metadata']) assert.ok(!json.includes(secret));
 for (const e of events) for (const field of ['user_id', 'role', 'session_id', 'app', 'concept_id', 'input_type', 'language', 'pedagogy_used', 'verification_result', 'latency', 'timestamp']) assert.ok(field in e);
 assert.throws(() => mentor.emitInteractionEvent(request, { app: 'LEARN', action: privateText }), /Unknown interaction/);
});

test('memory observations are evidence-based; disabled or deleted memory cannot be rebuilt from prior SCM/events', () => {
 const request = ctx(); assert.deepEqual(mentor.getWeeklyObservations(request), []);
 mentor.recordLearningOutcome(request, outcome('wrong', 'practice', 0)); now = new Date('2026-09-23T13:00:00Z'); mentor.recordLearningOutcome(request, outcome('right'));
 const observation = mentor.getWeeklyObservations(request)[0]; assert.equal(observation.kind, 'improvement'); assert.match(observation.text, /0\/1 to 1\/1/);
 mentor.deleteMemory(request); assert.deepEqual(mentor.getWeeklyObservations(request), []); assert.deepEqual(mentor.getRecentContext(request), []);
 assert.equal(mentor.getStudentState(request).concepts[0].evidenceCount, 2); assert.equal(mentor.getInteractionEvents(request).length, 3);
 mentor.recordLearningOutcome(request, outcome('right')); assert.deepEqual(mentor.getWeeklyObservations(request), []);
 workspace.updatePreferences(request, { memory: false }); mentor.recordLearningOutcome(request, outcome('disabled')); assert.deepEqual(mentor.getRecentContext(request), []);
 workspace.updatePreferences(request, { memory: true }); assert.deepEqual(mentor.getRecentContext(request), []);
 mentor.recordLearningOutcome(request, outcome('new')); assert.equal(mentor.getWeeklyObservations(request)[0].count, 1); assert.equal(mentor.getWeeklyObservations(request)[0].kind, 'practice');
});

test('individual state and events are workspace isolated; forged contexts and cross-person state fail closed', () => {
 mentor.recordLearningOutcome(ctx(), outcome('private'));
 assert.equal(mentor.getStudentState(ctx('adult', 'professional')).concepts.length, 0);
 assert.equal(mentor.getInteractionEvents(ctx('adult', 'teacher')).length, 0);
 assert.throws(() => mentor.getStudentState(ctx(), 'demo-minor-cbse'), /private/);
 assert.throws(() => mentor.getStudentState({ ...ctx(), personId: 'demo-parent' }), /access/);
 assert.throws(() => mentor.getRecentContext(ctx(), 'demo-parent'), /private/);
 const controller = new AbortController(); controller.abort(); assert.throws(() => mentor.getStudentState({ ...ctx(), signal: controller.signal }), { name: 'AbortError' });
 assert.throws(() => mentor.recordLearningOutcome(ctx('adult', 'organization'), outcome('org')), /personal learning/);
});

test('readiness depends on verified prerequisite evidence; unattempted concepts are not weaknesses', () => {
 const request = ctx(); const graph = [{ id: 'first', prerequisiteIds: [] }, { id: 'next', prerequisiteIds: ['sample:cube:concept'] }];
 assert.deepEqual(mentor.getReadyConcepts(request, graph).map(c => c.id), ['first']); assert.equal(mentor.getWeakConcepts(request).length, 0);
 mentor.recordLearningOutcome(request, outcome('check', 'check')); mentor.recordLearningOutcome(request, outcome('practice'));
 assert.deepEqual(mentor.getReadyConcepts(request, graph).map(c => c.id), ['first', 'next']);
});

test('parent sees only consent-scoped connected child summary, not events or private conversations', () => {
 const child = ctx('minor-cbse'); const parent = ctx('parent', 'parent');
 mentor.recordLearningOutcome(child, outcome('child'));
 const conversation = workspace.newConversation(child, 'PRIVATE TITLE'); workspace.updateConversation(child, conversation.id, { draft: 'PRIVATE DOUBT' });
 const summary = mentor.getParentSummary(parent, child.personId); assert.equal(summary.concepts[0].total, 1); assert.equal(summary.observations.length, 1);
 assert.ok(!JSON.stringify(summary).includes('PRIVATE')); assert.ok(!('events' in summary)); assert.ok(!('messages' in summary));
 assert.throws(() => mentor.getParentSummary(parent, 'demo-adult'), /connection/);
 for (const status of ['pending', 'expired', 'revoked']) {
  editWorkspace(db => { db.relationships.find(r => r.to === child.personId).status = status; });
  assert.throws(() => mentor.getParentSummary(parent, child.personId), /connection/);
 }
 editWorkspace(db => { const relation = db.relationships.find(r => r.to === child.personId); relation.status = 'active'; relation.expiresAt = '2026-09-20T00:00:00Z'; });
 assert.throws(() => mentor.getParentSummary(parent, child.personId), /connection/);
 editWorkspace(db => { const relation = db.relationships.find(r => r.to === child.personId); delete relation.expiresAt; relation.scope = ['shared-resources']; });
 assert.throws(() => mentor.getParentSummary(parent, child.personId), /connection/);
});

test('teacher accesses assigned class aggregates only; personal evidence and revoked memberships are excluded', () => {
 const child = ctx('minor-cbse'); const teacher = ctx('teacher', 'teacher'); workspace.seedDemo('teacher');
 mentor.recordLearningOutcome(child, outcome('personal', 'practice', 0));
 mentor.recordLearningOutcome(child, outcome('class', 'check', 1, { classId: 'demo-class-cube' }));
 assert.deepEqual(mentor.getAssignedClasses(teacher).map(c => c.id), ['demo-class-cube']);
 const result = mentor.getClassAggregate(teacher, 'demo-class-cube'); assert.equal(result.concepts[0].correct, 1); assert.equal(result.concepts[0].total, 1); assert.equal(result.pendingSubmissions, 1);
 assert.ok(!JSON.stringify(result).includes('demo-minor-cbse')); assert.ok(!('students' in result));
 assert.throws(() => mentor.getClassAggregate(teacher, 'demo-class-fractions'), /not assigned/);
 assert.throws(() => mentor.recordLearningOutcome(child, outcome('forged', 'practice', 1, { classId: 'demo-class-fractions' })), /not active/);
 const memberships = JSON.parse(storage.get('visionary_entity_OrganizationInvite')); memberships.find(m => m.email === 'minor-cbse@visionary.test').status = 'revoked'; storage.set('visionary_entity_OrganizationInvite', JSON.stringify(memberships));
 assert.equal(mentor.getClassAggregate(teacher, 'demo-class-cube').concepts.length, 0);
 memberships.find(m => m.email === 'teacher@visionary.test').status = 'revoked'; storage.set('visionary_entity_OrganizationInvite', JSON.stringify(memberships));
 assert.throws(() => mentor.getClassAggregate(teacher, 'demo-class-cube'), /not assigned/);
});

test('organization gets aggregate-only class evidence, never personal learner SCM or unrelated classes', () => {
 workspace.seedDemo('school-admin'); const organization = ctx('school-admin', 'organization'); const child = ctx('minor-cbse');
 mentor.recordLearningOutcome(child, outcome('personal', 'practice', 0)); mentor.recordLearningOutcome(child, outcome('class', 'check', 1, { classId: 'demo-class-cube' }));
 const result = mentor.getOrganizationAggregate(organization); assert.equal(result.classCount, 2); assert.equal(result.learnerCount, 2); assert.equal(result.concepts[0].correct, 1); assert.equal(result.concepts[0].total, 1);
 assert.ok(!JSON.stringify(result).includes('demo-minor-cbse')); assert.ok(!('evidence' in result));
 assert.throws(() => mentor.getStudentState(organization, child.personId), /private/);
 assert.throws(() => mentor.getClassAggregate(organization, 'demo-class-cube'), /assigned teachers/);
 assert.throws(() => mentor.getOrganizationAggregate(child), /organization/);
 workspace.seedDemo('company-admin'); assert.equal(mentor.getOrganizationAggregate(ctx('company-admin', 'organization')).classCount, 0);
});
