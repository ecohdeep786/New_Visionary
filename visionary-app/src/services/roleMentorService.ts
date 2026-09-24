import type { RequestContext } from '../domain/workspace.ts';
import { familyReports, getWorkspace, saveResource, snapshot, visibleRelationships, workspaceIdentity } from './workspaceService.ts';
import { getAssignedClasses, getClassAggregate, getOrganizationAggregate, getParentSummary, getStudentState } from './mentorStateService.ts';
import { getTeachingInterface } from './teachingInterface.ts';
import { getLearningWorkspace } from './learningPipelineService.ts';

function requireRole(ctx: RequestContext, role: RequestContext['role']) {
  const identity=workspaceIdentity(ctx);
  if (ctx.role !== role) throw new Error(`Open your ${role} workspace to use this view.`);
  if (role === 'professional' && identity.person.ageBand !== 'adult') throw new Error('Professional journeys are available only to adult profiles.');
  if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
}

/** Role views consume authorized summaries, never generic learner collections or private events. */
export async function getRoleMentorView(ctx: RequestContext, selection = '') {
  const data = await getWorkspace(ctx);
  if (ctx.role === 'teacher') {
    const classes = getAssignedClasses(ctx);
    const classId = selection || classes[0]?.id;
    return { role: 'teacher' as const, classes, aggregate: classId ? getClassAggregate(ctx, classId) : null, own: getStudentState(ctx), preparation: data.resources.find(r => r.kind === 'lesson' && r.status !== 'archived') };
  }
  if (ctx.role === 'parent') {
    const children = familyReports(ctx).map(child => ({ id: child.id, name: child.name }));
    // A stale or forged selection must fail closed, not silently select a different child.
    if (selection && !children.some(child => child.id === selection)) throw new Error('This child’s summary is no longer shared with you. Check your family connections.');
    const childId = selection || children[0]?.id;
    const connections = visibleRelationships(ctx).filter(r => r.type === 'guardian' && r.from === ctx.personId).map(r => ({ id: r.id, name: r.name, status: r.status, expiresAt: r.expiresAt }));
    return { role: 'parent' as const, children, connections, summary: childId ? getParentSummary(ctx, childId) : null };
  }
  if (ctx.role === 'professional') {
    requireRole(ctx, 'professional');
    return { role: 'professional' as const, own: getStudentState(ctx), goal: data.resources.find(r => r.kind === 'goal' && r.status !== 'archived'), projects: data.artifacts.length };
  }
  if (ctx.role === 'organization') {
    return { role: 'organization' as const, aggregate: getOrganizationAggregate(ctx), cohorts: data.resources.filter(r => r.kind === 'cohort' && r.status !== 'archived').length, curriculum: data.resources.filter(r => r.kind === 'curriculum' && r.status === 'reviewed').length, library: data.resources.filter(r => r.kind === 'lesson' && r.status === 'reviewed').length };
  }
  throw new Error('This role has its own learning workspace.');
}

export async function requestTeacherSupport(ctx: RequestContext, input: { mode: 'quiz' | 'lesson' | 'coach'; brief: string; classId?: string }) {
  requireRole(ctx, 'teacher');
  if (!input.brief.trim()) throw new Error('Add an objective or question first.');
  if (!['quiz', 'lesson', 'coach'].includes(input.mode)) throw new Error('Choose an available preparation mode.');
  const aggregate = input.classId ? getClassAggregate(ctx, input.classId) : null;
  const weakConcepts = aggregate?.concepts.filter(c => c.total > 0 && c.accuracy !== null && c.accuracy < 0.7).map(c => ({ conceptId: c.conceptId, correct: c.correct, total: c.total })) ?? [];
  const teaching = getTeachingInterface(ctx);
  const packet = { input: input.brief.trim().slice(0, 6000), intent: input.mode === 'quiz' ? 'check' as const : 'plan' as const, language: ctx.locale, context: { purpose: input.mode, classId: aggregate?.classId, weakConcepts } };
  const response = await (input.mode === 'quiz' ? teaching.requestPracticeQuestion(packet) : teaching.requestExplanation(packet));
  // Consent/class assignment may change while a remote request is in flight.
  requireRole(ctx, 'teacher');
  if (input.classId) getClassAggregate(ctx, input.classId);
  return response;
}

export function saveTeacherPreparation(ctx: RequestContext, input: { title: string; body: string }) {
  requireRole(ctx, 'teacher');
  return saveResource(ctx, { title: input.title.trim().slice(0, 160), body: input.body.slice(0, 16000), kind: 'lesson', status: 'draft', audience: 'Personal' });
}

/** Personal career view: goal, saved learning evidence, and artifacts share one workspace scope. */
export function getCareerPath(ctx: RequestContext) {
  requireRole(ctx, 'professional');
  const data = snapshot(ctx);
  const states = getStudentState(ctx).concepts;
  const units = getLearningWorkspace(ctx).units;
  const capabilities = [...new Map([...units].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).map(unit => [unit.conceptId, unit])).values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(unit => ({ conceptId: unit.conceptId, title: unit.title, unitId: unit.id, activityStage: unit.stage, evidence: states.find(item => item.conceptId === unit.conceptId) ?? null }));
  const goal = data.resources.find(resource => resource.kind === 'goal' && resource.status !== 'archived') ?? null;
  return { goal, capabilities, target: capabilities.find(item => item.conceptId === goal?.conceptId) ?? null,
    portfolio: data.artifacts.map(artifact => ({ id: artifact.id, title: artifact.title, conceptId: artifact.conceptId, status: artifact.status, visibility: artifact.visibility, updatedAt: artifact.updatedAt })) };
}

export function saveCareerTarget(ctx: RequestContext, input: { title: string; body: string; id?: string; conceptId?: string }) {
  requireRole(ctx, 'professional');
  const saved = input.id ? snapshot(ctx).resources.find(resource => resource.id === input.id && resource.kind === 'goal') : null;
  if (input.id && !saved) throw new Error('This career target is not available in your workspace.');
  const conceptId = input.conceptId === undefined ? saved?.conceptId : input.conceptId || undefined;
  if (conceptId && !getLearningWorkspace(ctx).units.some(unit => unit.conceptId === conceptId)) throw new Error('Choose a capability from your own learning outline.');
  return saveResource(ctx, { id: input.id, title: input.title.trim().slice(0, 160), body: input.body.slice(0, 6000), conceptId, kind: 'goal', status: 'draft', audience: 'Personal' });
}
