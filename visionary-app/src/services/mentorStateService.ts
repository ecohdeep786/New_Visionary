import type { Database, Locale, MasteryStage, RequestContext, Role } from '../domain/workspace.ts';
import { snapshot, visibleRelationships, workspaceIdentity } from './workspaceService.ts';
import { getContentRepository, type ContentConcept } from './contentRepository.ts';

export type MentorApp = 'LEARN' | 'ASK' | 'PRACTICE' | 'BUILD' | 'COMMUNITY';
export type InteractionAction = 'view' | 'start' | 'request' | 'response' | 'answer' | 'save' | 'complete' | 'resume' | 'delete_memory' | 'remove';
export interface InteractionInput {
 id?: string; app: MentorApp; action: InteractionAction; sessionId?: string; conceptId?: string;
 inputType?: 'text' | 'selection' | 'voice' | 'system'; language?: Locale;
 board?: string; classLevel?: string; exam?: string; pedagogy?: 'explanation' | 'retrieval' | 'practice' | 'application' | 'reflection';
 verification?: 'correct' | 'incorrect' | 'unverified' | 'not_applicable'; verificationResult?: 'correct' | 'incorrect' | 'unverified' | 'not_applicable'; latency?: number; promptVersion?: string;
 intent?: 'understand' | 'solve' | 'check' | 'plan' | 'build'; responseStatus?: 'ready' | 'not_connected' | 'blocked' | 'error';
}
export interface InteractionEvent {
 id: string; user_id: string; role: Role; workspace_id: string; session_id: string | null; app: MentorApp;
 action: InteractionAction; concept_id: string | null; input_type: 'text' | 'selection' | 'voice' | 'system'; language: Locale;
 board?: string; class?: string; exam?: string; pedagogy_used: string | null; verification_result: string;
 latency: number | null; timestamp: string; prompt_version?: string; intent?: string; response_status?: string;
}
export interface LearningOutcome {
 id: string; conceptId: string; kind: 'check' | 'practice' | 'application'; correct?: number; total?: number;
 verified?: boolean; sessionId: string; classId?: string; language?: Locale; board?: string; classLevel?: string;
}
interface Evidence extends LearningOutcome { at: string; correct: number; total: number; verified: boolean }
export interface ConceptState {
 conceptId: string; correct: number; total: number; accuracy: number | null; stage: MasteryStage;
 difficulty: number; dueAt?: string; lastPracticedAt?: string; evidenceCount: number; applicationCount: number; weightedSignal: number;
}
export interface StudentState { studentId: string; workspaceId: string; concepts: ConceptState[]; updatedAt?: string }
export interface MemoryObservation { id: string; text: string; conceptId?: string; count: number; kind: 'practice' | 'application' | 'improvement' | 'activity' }
interface MemoryEntry { id: string; at: string; app: MentorApp; action: InteractionAction; conceptId?: string }
interface MentorSpace { owner: string; role: Role; evidence: Evidence[]; events: InteractionEvent[]; memory: MemoryEntry[]; memoryDeletedAt?: string; memoryEpoch: number }
interface MentorDatabase { version: 1; spaces: Record<string, MentorSpace> }
export interface AggregateConcept { conceptId: string; learners: number; correct: number; total: number; accuracy: number | null; needsReview: number }
type LegacyRow = Record<string, unknown>;
const KEY = 'visionary_mentor_v1';
let clock = () => new Date();
/** Injectable clock for pipeline tests; no model output is generated here. */
export function configureMentorClock(next: () => Date) { clock = next; }
function check(ctx: RequestContext) { if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); return workspaceIdentity(ctx); }
function read(): MentorDatabase {
 const raw = localStorage.getItem(KEY); if (!raw) return { version: 1, spaces: {} };
 try {
  const value = JSON.parse(raw);
  if (value.version !== 1 || !value.spaces || typeof value.spaces !== 'object' || Array.isArray(value.spaces)) throw Error();
  for (const target of Object.values(value.spaces) as MentorSpace[]) if (!target || typeof target.owner !== 'string' || !Array.isArray(target.evidence) || !Array.isArray(target.events) || !Array.isArray(target.memory)) throw Error();
  return value;
 }
 catch { throw new Error('Saved learning state could not be read. Your existing records have not been changed.'); }
}
function write(ctx: RequestContext, db: MentorDatabase) {
 check(ctx); try { localStorage.setItem(KEY, JSON.stringify(db)); }
 catch { throw new Error('Learning progress could not be saved on this device. Your previous records are unchanged.'); }
 if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('visionary:mentor-change'));
}
function space(db: MentorDatabase, ctx: RequestContext): MentorSpace {
 const existing = db.spaces[ctx.workspaceId];
 if (existing && (existing.owner !== ctx.personId || existing.role !== ctx.role)) throw new Error('You do not have access to this learning state.');
 return existing ?? (db.spaces[ctx.workspaceId] = { owner: ctx.personId, role: ctx.role, evidence: [], events: [], memory: [], memoryEpoch: 0 });
}
function rows(name: 'Classroom' | 'Enrollment' | 'OrganizationInvite' | 'Submission' | 'Assignment'): LegacyRow[] {
 try { const value = JSON.parse(localStorage.getItem(`visionary_entity_${name}`) || '[]'); if (!Array.isArray(value)) throw Error(); return value; }
 catch { throw new Error('Connection records are unavailable. Access remains restricted until they can be read.'); }
}
function alive(row: LegacyRow) { return row.status === 'active' && (!row.expiresAt || new Date(String(row.expiresAt)).getTime() > clock().getTime()); }
function schoolMembership(email: string, organization: unknown, role?: Role) { return !organization || rows('OrganizationInvite').some(r => r.email === email && r.organization_email === organization && (!role || r.role === role) && alive(r)); }
function classesFor(ctx: RequestContext) {
 const { person, workspace } = check(ctx);
 if (ctx.role !== 'teacher' && ctx.role !== 'organization') throw new Error('An assigned teacher or organization workspace is required.');
 return rows('Classroom').filter(c => {
  if (ctx.role === 'organization') return c.organization_email === person.email;
  return (!workspace.organizationId || c.organization_email === workspace.organizationId) &&
   (c.teacher_email === person.email || c.teacher_id === person.id || c.created_by_id === person.id || c.created_by === person.email) &&
   schoolMembership(person.email, c.organization_email, 'teacher');
 });
}
function enrolled(classroom: LegacyRow) { return rows('Enrollment').filter(e => e.class_id === classroom.id && alive(e) && schoolMembership(String(e.student_email || ''), classroom.organization_email)); }
function assertClassEvidence(ctx: RequestContext, classId: string) {
 const { person, workspace } = check(ctx);
 const classroom = rows('Classroom').find(c => c.id === classId);
 if (!['student', 'professional'].includes(ctx.role) || !classroom || (workspace.organizationId && classroom.organization_email !== workspace.organizationId) ||
  !enrolled(classroom).some(e => e.student_email === person.email || e.student_id === person.id)) throw new Error('This class is not active for your learning workspace.');
}
// Telemetry uses stable opaque references, never raw input or identifiers that can embed names/email/phone numbers.
// These are local pseudonyms, not a claim of anonymization or a production privacy boundary.
function ref(value: string) { let a = 2166136261; let b = 3339675911; for (const char of value) { const code = char.codePointAt(0)!; a = Math.imul(a ^ code, 16777619); b = Math.imul(b ^ code, 2246822519); } return `ref-${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`; }
function select<T extends string>(value: unknown, values: readonly T[], fallback: T): T { return values.includes(value as T) ? value as T : fallback; }
function eventFor(ctx: RequestContext, input: InteractionInput): InteractionEvent {
 if (!['LEARN', 'ASK', 'PRACTICE', 'BUILD', 'COMMUNITY'].includes(input.app) || !['view', 'start', 'request', 'response', 'answer', 'save', 'complete', 'resume', 'delete_memory', 'remove'].includes(input.action)) throw new Error('Unknown interaction type.');
 const event: InteractionEvent = {
  id: ref(input.id || crypto.randomUUID()), user_id: ref(ctx.personId), workspace_id: ref(ctx.workspaceId), role: ctx.role,
  session_id: input.sessionId ? ref(input.sessionId) : null, app: input.app, action: input.action,
  concept_id: input.conceptId ? ref(input.conceptId) : null, input_type: select(input.inputType, ['text', 'selection', 'voice', 'system'], 'selection'),
  language: select(input.language || ctx.locale, ['en', 'hi', 'bn'], 'en'),
  pedagogy_used: input.pedagogy ? select(input.pedagogy, ['explanation', 'retrieval', 'practice', 'application', 'reflection'], 'explanation') : null,
  verification_result: select(input.verification ?? input.verificationResult, ['correct', 'incorrect', 'unverified', 'not_applicable'], 'not_applicable'),
  latency: typeof input.latency === 'number' && Number.isFinite(input.latency) ? Math.max(0, input.latency) : null,
  timestamp: clock().toISOString(),
 };
 if (input.board) event.board = ref(input.board); if (input.classLevel) event.class = ref(input.classLevel); if (input.exam) event.exam = ref(input.exam);
 if (input.promptVersion) event.prompt_version = ref(input.promptVersion);
 if (input.intent) event.intent = select(input.intent, ['understand', 'solve', 'check', 'plan', 'build'], 'understand');
 if (input.responseStatus) event.response_status = select(input.responseStatus, ['ready', 'not_connected', 'blocked', 'error'], 'error');
 return event;
}
function addEvent(ctx: RequestContext, target: MentorSpace, input: InteractionInput, memoryEnabled: boolean) {
 const event = eventFor(ctx, input); const prior = target.events.find(e => e.id === event.id); if (prior) return prior;
 target.events.push(event);
 if (memoryEnabled && event.action !== 'delete_memory') target.memory.push({ id: event.id, at: event.timestamp, app: input.app, action: input.action, conceptId: input.conceptId });
 return event;
}
export function emitInteractionEvent(ctx: RequestContext, input: InteractionInput) {
 check(ctx); const db = read(); const target = space(db, ctx); const event = addEvent(ctx, target, input, snapshot(ctx).preferences.memory); write(ctx, db); return structuredClone(event);
}
function conceptsFor(evidence: Evidence[]): ConceptState[] {
 return [...new Set(evidence.map(e => e.conceptId))].map(conceptId => {
  const records = evidence.filter(e => e.conceptId === conceptId).sort((a, b) => a.at.localeCompare(b.at));
  const measured = records.filter(e => e.verified && e.total > 0); const latest = measured.at(-1);
  const correct = measured.reduce((sum, e) => sum + e.correct, 0); const total = measured.reduce((sum, e) => sum + e.total, 0);
  let difficulty = 1; for (const e of measured.filter(e => e.kind === 'practice')) difficulty = Math.max(1, Math.min(5, difficulty + (e.correct / e.total >= 0.7 ? 1 : -1)));
  const passed = measured.filter(e => e.correct / e.total >= 0.7); const kinds = new Set(passed.map(e => e.kind));
  const delayed = passed.some(e => e.kind === 'practice' && new Date(e.at).getTime() - new Date(passed[0]!.at).getTime() >= 86400000);
  let stage: MasteryStage = measured.length ? 'Practicing' : 'Exploring';
  if (kinds.has('check') && kinds.has('practice')) stage = 'Secure';
  if (kinds.has('application') && kinds.has('check') && kinds.has('practice') && delayed) stage = 'Mastered';
  if (latest && (latest.correct / latest.total < 0.7 || clock().getTime() - new Date(latest.at).getTime() > 7 * 86400000)) stage = 'Needs review';
  const dueAt = latest ? new Date(new Date(latest.at).getTime() + (latest.correct / latest.total < 0.7 ? 86400000 : 7 * 86400000)).toISOString() : undefined;
  return { conceptId, correct, total, accuracy: total ? correct / total : null, stage, difficulty, dueAt, lastPracticedAt: records.filter(e => e.kind === 'practice').at(-1)?.at, evidenceCount: records.length, applicationCount: records.filter(e => e.kind === 'application').length, weightedSignal: records.reduce((sum, e) => sum + (e.kind === 'application' ? 3 : 1), 0) };
 });
}
export function getStudentState(ctx: RequestContext, studentId = ctx.personId): StudentState {
 check(ctx); if (studentId !== ctx.personId) throw new Error('Individual learning state is private. Use an authorized summary.');
 const target = space(read(), ctx); return { studentId, workspaceId: ctx.workspaceId, concepts: conceptsFor(target.evidence), updatedAt: target.evidence.at(-1)?.at };
}
export function recordLearningOutcome(ctx: RequestContext, input: LearningOutcome) {
 check(ctx); if (ctx.role === 'parent' || ctx.role === 'organization') throw new Error('Use a personal learning workspace to record learning.');
 if (!input.id || !input.conceptId || !input.sessionId || !['check', 'practice', 'application'].includes(input.kind)) throw new Error('The learning result is incomplete.');
 const correct = input.correct ?? 0; const total = input.total ?? 0;
 if (!Number.isInteger(correct) || !Number.isInteger(total) || correct < 0 || total < 0 || correct > total || total > 1000) throw new Error('The learning result has invalid accuracy counts.');
 if (input.classId) assertClassEvidence(ctx, input.classId);
 const db = read(); const target = space(db, ctx); const previous = target.evidence.find(e => e.id === input.id);
 if (previous) {
  if (previous.conceptId !== input.conceptId || previous.kind !== input.kind || previous.correct !== correct || previous.total !== total || previous.sessionId !== input.sessionId || previous.verified !== Boolean(input.verified) || previous.classId !== input.classId) throw new Error('This result has already been recorded with different evidence.');
  return getStudentState(ctx);
 }
 const evidence: Evidence = { id: input.id, conceptId: input.conceptId, kind: input.kind, correct, total, verified: Boolean(input.verified), sessionId: input.sessionId, classId: input.classId, language: select<Locale>(input.language || ctx.locale, ['en', 'hi', 'bn'], 'en'), at: clock().toISOString() };
 target.evidence.push(evidence);
 addEvent(ctx, target, { id: `outcome:${input.id}`, app: input.kind === 'check' ? 'LEARN' : input.kind === 'practice' ? 'PRACTICE' : 'BUILD', action: input.kind === 'application' ? 'complete' : 'answer', sessionId: input.sessionId, conceptId: input.conceptId, language: evidence.language, board: input.board, classLevel: input.classLevel, pedagogy: input.kind === 'check' ? 'retrieval' : input.kind, verification: !evidence.verified || !total ? 'unverified' : correct / total >= 0.7 ? 'correct' : 'incorrect' }, snapshot(ctx).preferences.memory);
 // SCM, the interaction event, and memory commit in one local-storage write.
 write(ctx, db); return getStudentState(ctx);
}
export const updateMastery = recordLearningOutcome;
export function getWeakConcepts(ctx: RequestContext, threshold = 0.7) { return getStudentState(ctx).concepts.filter(c => c.accuracy !== null && (c.accuracy < threshold || c.stage === 'Needs review')); }
export function getReadyConcepts<T extends { id: string; prerequisiteIds: string[] }>(ctx: RequestContext, concepts: T[]): T[] {
 const state = getStudentState(ctx); return concepts.filter(c => c.prerequisiteIds.every(id => state.concepts.some(s => s.conceptId === id && ['Secure', 'Mastered'].includes(s.stage))));
}
export async function getPrerequisitePath(ctx: RequestContext, conceptId: string): Promise<ContentConcept[]> {
 check(ctx); const content = getContentRepository(ctx); const visiting = new Set<string>(); const visited = new Set<string>(); const path: ContentConcept[] = [];
 async function visit(id: string) {
  if (visiting.has(id)) throw new Error('The curriculum prerequisite path contains a cycle. Your progress has not changed.');
  if (visited.has(id)) return;
  const concept = await content.getConcept(id); check(ctx); if (!concept) throw new Error('A prerequisite is not available in this workspace.');
  visiting.add(id); for (const prerequisite of concept.prerequisiteIds) await visit(prerequisite); visiting.delete(id); visited.add(id); path.push(concept);
 }
 await visit(conceptId); return path;
}
export function getInteractionEvents(ctx: RequestContext) { check(ctx); return structuredClone(space(read(), ctx).events); }
/** Structured memory shares the event transaction; arbitrary conversation text is never accepted. */
export const saveEpisodicEvent = emitInteractionEvent;
export function getRecentContext(ctx: RequestContext, userId = ctx.personId) {
 check(ctx); if (userId !== ctx.personId) throw new Error('Memory is private to its owner.');
 // Turning personalization off stops new capture; it must not hide already retained
 // records from the owner's view/delete control.
 return structuredClone(space(read(), ctx).memory.slice(-20).reverse());
}
function observations(target: MentorSpace, cutoff: number): MemoryObservation[] {
 const recent = target.memory.filter(e => new Date(e.at).getTime() >= cutoff && ['answer', 'complete', 'start'].includes(e.action));
 const concepts = [...new Set(recent.map(e => e.conceptId).filter((id): id is string => Boolean(id)))];
 const results: MemoryObservation[] = [];
 for (const conceptId of concepts) {
  const practice = recent.filter(e => e.conceptId === conceptId && e.app === 'PRACTICE' && e.action === 'answer');
  const application = recent.filter(e => e.conceptId === conceptId && e.app === 'BUILD' && e.action === 'complete');
  const visibleEvidence = target.evidence.filter(e => e.conceptId === conceptId && e.verified && e.total > 0 && practice.some(p => p.id === ref(`outcome:${e.id}`))).sort((a, b) => a.at.localeCompare(b.at));
  const first = visibleEvidence[0]; const last = visibleEvidence.at(-1);
  if (first && last && visibleEvidence.length >= 2 && last.correct / last.total > first.correct / first.total) results.push({ id: `improvement:${ref(conceptId)}`, kind: 'improvement', conceptId, count: practice.length, text: `You practised this concept ${practice.length} times this week. Your latest recorded accuracy improved from ${first.correct}/${first.total} to ${last.correct}/${last.total}.` });
  else if (practice.length) results.push({ id: `practice:${ref(conceptId)}`, kind: 'practice', conceptId, count: practice.length, text: `You practised this concept ${practice.length} time${practice.length === 1 ? '' : 's'} this week.` });
  if (application.length) results.push({ id: `application:${ref(conceptId)}`, kind: 'application', conceptId, count: application.length, text: `You completed ${application.length} application${application.length === 1 ? '' : 's'} for this concept this week. Completion is not a verified mastery assessment.` });
 }
 if (!results.length && recent.length) results.push({ id: 'activity:week', kind: 'activity', count: recent.length, text: `You recorded ${recent.length} learning interaction${recent.length === 1 ? '' : 's'} this week.` });
 return results;
}
export function getWeeklyObservations(ctx: RequestContext, userId = ctx.personId) {
 check(ctx); if (userId !== ctx.personId) throw new Error('Memory is private to its owner.');
 if (!snapshot(ctx).preferences.memory) return [];
 return observations(space(read(), ctx), clock().getTime() - 7 * 86400000);
}
export function deleteMemory(ctx: RequestContext) {
 check(ctx); const db = read(); const target = space(db, ctx); target.memory = []; target.memoryDeletedAt = clock().toISOString(); target.memoryEpoch++;
 // Observations use only retained memory, never reconstruct deleted memory from SCM or L7 history.
 addEvent(ctx, target, { id: `memory-delete:${target.memoryEpoch}`, app: 'ASK', action: 'delete_memory', inputType: 'system' }, false); write(ctx, db);
}
function workspaceDatabase(): Database {
 try { const db = JSON.parse(localStorage.getItem('visionary_workspace_v2') || '{}'); if (db.version !== 2 || !Array.isArray(db.workspaces) || !Array.isArray(db.people)) throw Error(); return db; }
 catch { throw new Error('Learning sharing is unavailable until connection records can be read.'); }
}
export function getParentSummary(ctx: RequestContext, childId: string) {
 check(ctx); if (ctx.role !== 'parent' || !visibleRelationships(ctx).some(r => r.type === 'guardian' && r.from === ctx.personId && r.to === childId && r.status === 'active' && r.scope.includes('progress-summary') && (!r.expiresAt || new Date(r.expiresAt).getTime() > clock().getTime()))) throw new Error('An active, consent-scoped child connection is required.');
 const db = read(); const workspaces = workspaceDatabase(); const childSpaces = workspaces.workspaces.filter(w => w.personId === childId && w.role === 'student' && !w.organizationId);
 const cutoff = clock().getTime() - 7 * 86400000;
 const evidence = childSpaces.flatMap(w => db.spaces[w.id]?.evidence || []).filter(e => new Date(e.at).getTime() >= cutoff);
 const memory = childSpaces.flatMap(w => workspaces.data[w.id]?.preferences.memory ? db.spaces[w.id]?.memory || [] : []);
 const combined: MentorSpace = { owner: childId, role: 'student', evidence, events: [], memory, memoryEpoch: 0 };
 return { childId, period: 'Last 7 days' as const, concepts: conceptsFor(evidence).map(({ conceptId, correct, total, accuracy, stage }) => ({ conceptId, correct, total, accuracy, stage })), observations: observations(combined, cutoff), completedApplications: evidence.filter(e => e.kind === 'application').length };
}
function scopedClassEvidence(classroom: LegacyRow) {
 const db = read(); const workspaces = workspaceDatabase(); const members = enrolled(classroom);
 const people = workspaces.people.filter(p => members.some(e => e.student_email === p.email || e.student_id === p.id));
 return people.map(person => ({ personId: person.id, evidence: workspaces.workspaces.filter(w => w.personId === person.id && ['student', 'professional'].includes(w.role)).flatMap(w => db.spaces[w.id]?.evidence || []).filter(e => e.classId === classroom.id) }));
}
function aggregate(learners: { personId: string; evidence: Evidence[] }[]): AggregateConcept[] {
 const ids = [...new Set(learners.flatMap(l => l.evidence.map(e => e.conceptId)))];
 return ids.map(conceptId => {
  const states = learners.map(l => conceptsFor(l.evidence).find(c => c.conceptId === conceptId)).filter((c): c is ConceptState => Boolean(c));
  const correct = states.reduce((sum, c) => sum + c.correct, 0); const total = states.reduce((sum, c) => sum + c.total, 0);
  return { conceptId, learners: states.length, correct, total, accuracy: total ? correct / total : null, needsReview: states.filter(c => c.stage === 'Needs review').length };
 });
}
export function getAssignedClasses(ctx: RequestContext) {
 if (ctx.role !== 'teacher') { check(ctx); throw new Error('Open an assigned teacher workspace.'); }
 return classesFor(ctx).map(c => ({ id: String(c.id), name: String(c.name || 'Class'), learnerCount: enrolled(c).length }));
}
/** Only published work in classes where this learner has an active enrollment. */
export function getStudentClasswork(ctx: RequestContext) {
 const { person, workspace } = check(ctx);
 if (ctx.role !== 'student') throw new Error('Open your student workspace to view classwork.');
 const classes = rows('Classroom').filter(classroom =>
  (!workspace.organizationId || classroom.organization_email === workspace.organizationId) &&
  enrolled(classroom).some(item => item.student_id === person.id || item.student_email === person.email));
 const submissions = rows('Submission').filter(item => item.student_id === person.id || item.student_email === person.email);
 return rows('Assignment').filter(item => item.status === 'published' && classes.some(classroom => classroom.id === item.class_id))
  .map(item => ({ id: String(item.id), title: String(item.title || 'Classwork'), classId: String(item.class_id), className: String(classes.find(classroom => classroom.id === item.class_id)?.name || 'Class'), dueAt: typeof item.due_date === 'string' ? item.due_date : undefined, submitted: submissions.some(row => row.assignment_id === item.id && ['submitted', 'graded', 'returned'].includes(String(row.status))) }))
  .filter(item => !item.submitted).sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'));
}
/** A class supplies learning context, never private classmate data or an assumed concept match. */
export function getStudentClassLearningContext(ctx: RequestContext, classId: string) {
 const { person, workspace } = check(ctx);
 if (ctx.role !== 'student') throw new Error('Open your student workspace to view class learning.');
 const classroom = rows('Classroom').find(item => item.id === classId &&
  (!workspace.organizationId || item.organization_email === workspace.organizationId) &&
  enrolled(item).some(enrollment => enrollment.student_id === person.id || enrollment.student_email === person.email));
 if (!classroom) throw new Error('This class is not connected to your student workspace.');
 return { id: String(classroom.id), name: String(classroom.name || 'Class'), subject: typeof classroom.subject === 'string' ? classroom.subject.trim().slice(0, 100) : '' };
}
export function getClassAggregate(ctx: RequestContext, classId: string) {
 if (ctx.role !== 'teacher') { check(ctx); throw new Error('Only assigned teachers can open a class summary.'); }
 const classroom = classesFor(ctx).find(c => c.id === classId); if (!classroom) throw new Error('This class is not assigned to your active workspace.');
 const learners = scopedClassEvidence(classroom);
 return { classId, name: String(classroom.name || 'Class'), learnerCount: enrolled(classroom).length, participatingLearners: learners.filter(l => l.evidence.length).length, pendingSubmissions: rows('Submission').filter(s => s.class_id === classId && s.status === 'submitted').length, concepts: aggregate(learners) };
}
export function getOrganizationAggregate(ctx: RequestContext) {
 const { person } = check(ctx); if (ctx.role !== 'organization') throw new Error('Open an organization workspace.');
 const classes = classesFor(ctx); const records = classes.flatMap(c => scopedClassEvidence(c));
 const grouped = [...new Set(records.map(r => r.personId))].map(personId => ({ personId, evidence: records.filter(r => r.personId === personId).flatMap(r => r.evidence) }));
 const memberships = rows('OrganizationInvite').filter(r => r.organization_email === person.email && alive(r));
 return { classCount: classes.length, learnerCount: new Set(classes.flatMap(c => enrolled(c).map(e => String(e.student_id || e.student_email)))).size, activeMemberships: memberships.length, pendingSubmissions: rows('Submission').filter(s => classes.some(c => c.id === s.class_id) && s.status === 'submitted').length, concepts: aggregate(grouped) };
}

export interface SCMService {
 getStudentState(studentId?: string): StudentState;
 updateMastery(event: LearningOutcome): StudentState;
 getWeakConcepts(threshold?: number): ConceptState[];
 getReadyConcepts(concepts: ContentConcept[]): ContentConcept[];
 getPrerequisitePath(conceptId: string): Promise<ContentConcept[]>;
}
export function getSCMService(ctx: RequestContext): SCMService {
 check(ctx); return { getStudentState: id => getStudentState(ctx, id), updateMastery: event => recordLearningOutcome(ctx, event), getWeakConcepts: threshold => getWeakConcepts(ctx, threshold), getReadyConcepts: concepts => getReadyConcepts(ctx, concepts), getPrerequisitePath: id => getPrerequisitePath(ctx, id) };
}
export interface MemoryService {
 saveEpisodicEvent(event: InteractionInput): InteractionEvent;
 getRecentContext(userId?: string): MemoryEntry[];
 getWeeklyObservations(userId?: string): MemoryObservation[];
 deleteMemory(): void;
}
export function getMemoryService(ctx: RequestContext): MemoryService {
 check(ctx); return { saveEpisodicEvent: event => saveEpisodicEvent(ctx, event), getRecentContext: id => getRecentContext(ctx, id), getWeeklyObservations: id => getWeeklyObservations(ctx, id), deleteMemory: () => deleteMemory(ctx) };
}
