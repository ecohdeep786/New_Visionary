import type { RequestContext } from '../domain/workspace.ts';
import { familyReports, reportDays, snapshot, updateStageProfile, updateStageProfilesBatch, workspaceIdentity } from './workspaceService.ts';
import { getDailyPlan } from './dailyPlanService.ts';
import { getLearningWorkspace } from './learningPipelineService.ts';
import { getStudentClasswork } from './mentorStateService.ts';

// Part W stage-transition engine (M2): an eligible stage change applies itself with
// zero required action, notice + change-diff, Postpone 7d and Undo 14d — through this
// service, with an atomic transition record. Policy: AUTO for ordinary progressions
// (adjacent class promotion, subject updates); CONFIRM for boundary jumps (board or
// institution change, a class jump of more than one grade). Undo restores the exact
// prior mapping while retaining every piece of work created since — history is never
// deleted to obtain snapshot equality. Evidence inference alone is suggestion-only.
export interface StageProfile {
  board?: string; classLevel?: string; subjects?: string[]; stage?: string; exam?: string;
}
export interface StageTransition {
  id: string; personId: string;
  from: StageProfile; to: StageProfile;
  policy: 'AUTO' | 'CONFIRM';
  state: 'notified' | 'applied' | 'postponed' | 'undone' | 'awaiting-confirm';
  reason: string;
  diff: { unitsKept: number; planStepsKept: number; openClassworkKept: number; dueDatesRetained: boolean };
  notifiedAt: string; appliedAt?: string; postponedAt?: string; postponedUntil?: string; undoneAt?: string;
  laterWorkCount?: number;
}
interface TransitionStore { version: 1; transitions: StageTransition[] }
const KEY = 'visionary_stage_transitions_v1';
const POSTPONE_MS = 7 * 86400000;
const UNDO_WINDOW_MS = 14 * 86400000;
let clock = () => new Date();
/** Injectable clock so postpone/undo windows are testable. */
export function configureStageTransitionClock(next: () => Date) { clock = next; }
function check(ctx: RequestContext) { if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); workspaceIdentity(ctx); }
function read(): TransitionStore {
 const raw = localStorage.getItem(KEY); if (!raw) return { version: 1, transitions: [] };
 try { const value = JSON.parse(raw); if (value.version !== 1 || !Array.isArray(value.transitions)) throw Error(); return value; }
 catch { throw new Error('Stage transition records could not be read. Your records have not been changed.'); }
}
function write(store: TransitionStore) {
 try { localStorage.setItem(KEY, JSON.stringify(store)); }
 catch { throw new Error('The stage transition could not be saved on this device. Your stage is unchanged.'); }
 if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('visionary:plan-change'));
}
function writeWithProfile(ctx: RequestContext, store: TransitionStore, next: StageProfile, previous: StageProfile) {
 updateStageProfile(ctx, next, { replace: true });
 try { write(store); }
 catch (error) {
  try { updateStageProfile(ctx, previous, { replace: true }); }
  catch { throw new Error('The stage notice could not be saved and the prior stage could not be restored. Review your stage before retrying.'); }
  throw error;
 }
}
function cleanProfile(profile: StageProfile): StageProfile {
 return {
  board: profile.board?.trim().slice(0, 100) || undefined,
  classLevel: profile.classLevel?.trim().slice(0, 100) || undefined,
  subjects: Array.isArray(profile.subjects) ? profile.subjects.map(s => String(s).trim().slice(0, 100)).filter(Boolean) : [],
  stage: profile.stage?.trim().slice(0, 40) || undefined,
  exam: profile.exam?.trim().slice(0, 60) || undefined,
 };
}
function sameProfile(a: StageProfile, b: StageProfile) {
 return (a.board || '') === (b.board || '') && (a.classLevel || '') === (b.classLevel || '') && (a.subjects || []).join('|') === (b.subjects || []).join('|') && (a.stage || '') === (b.stage || '') && (a.exam || '') === (b.exam || '');
}
function classDistance(fromLevel?: string, toLevel?: string): number {
 const from = Number(String(fromLevel || '').replace(/\D/g, '')); const to = Number(String(toLevel || '').replace(/\D/g, ''));
 if (!String(fromLevel || '').match(/\d/) || !String(toLevel || '').match(/\d/)) return 0;
 if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
 return Math.abs(to - from);
}
function captureEvidence(ctx: RequestContext, profile: StageProfile, strict = false) {
 try {
  const plan = getDailyPlan(ctx);
  return { units: getLearningWorkspace(ctx).units.length, planSteps: plan.steps.filter(s => !s.done).length, openClasswork: ctx.role === 'student' ? getStudentClasswork(ctx).length : 0, stageProfile: profile };
 } catch { if (strict) throw new Error('Learning evidence could not be checked for every learner. No class promotion was applied; retry after restoring the local records.'); return { units: 0, planSteps: 0, openClasswork: 0, stageProfile: profile }; }
}
function assertCanPropose(ctx: RequestContext) {
 check(ctx);
 if (ctx.role === 'student' || ctx.role === 'professional') {
  return 'self';
 }
 throw new Error('Stage transitions belong to a personal learning workspace.');
}
/** Propose a stage change: AUTO applies immediately with notice + diff; boundary jumps await confirmation. */
export function proposeStageTransition(ctx: RequestContext, next: StageProfile, reason: string): StageTransition {
 assertCanPropose(ctx);
 const identity = workspaceIdentity(ctx);
 const from = cleanProfile(identity.person.learningContext || { subjects: [] });
 const to = cleanProfile({ ...from, ...next });
 if (sameProfile(from, to)) throw new Error('This stage profile is already the active one.');
 const store = read();
 // One active transition per person: a new proposal supersedes a postponed/notified one.
 store.transitions = store.transitions.filter(t => !(t.personId === ctx.personId && (t.state === 'notified' || t.state === 'postponed' || t.state === 'awaiting-confirm')));
 const evidence = captureEvidence(ctx, from);
 const boardJump = (from.board || '') !== (to.board || '') && Boolean(from.board) && Boolean(to.board);
 const distance = classDistance(from.classLevel, to.classLevel);
 const policy: StageTransition['policy'] = boardJump || distance > 1 ? 'CONFIRM' : 'AUTO';
 const diff = { unitsKept: evidence.units, planStepsKept: evidence.planSteps, openClassworkKept: evidence.openClasswork, dueDatesRetained: true };
 const transition: StageTransition = { id: crypto.randomUUID(), personId: ctx.personId, from, to, policy, state: policy === 'AUTO' ? 'applied' : 'awaiting-confirm', reason: String(reason || '').trim().slice(0, 200) || 'Stage profile updated', diff, notifiedAt: clock().toISOString(), appliedAt: policy === 'AUTO' ? clock().toISOString() : undefined };
 store.transitions.push(transition);
 if (policy === 'AUTO') writeWithProfile(ctx, store, to, from);
 else write(store);
 return transition;
}
/** Confirm a boundary jump that policy held for explicit confirmation. */
export function confirmStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'awaiting-confirm') throw new Error('This transition is not waiting for confirmation.');
 transition.state = 'applied'; transition.appliedAt = clock().toISOString();
 writeWithProfile(ctx, store, transition.to, transition.from); return transition;
}
/** Postpone: reverses the applied mapping and reevaluates in seven days (D-012). */
export function postponeStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'applied') throw new Error('Only an applied transition can be postponed.');
 transition.state = 'postponed'; transition.postponedAt = clock().toISOString(); transition.postponedUntil = new Date(clock().getTime() + POSTPONE_MS).toISOString();
 writeWithProfile(ctx, store, transition.from, transition.to); return transition;
}
/** Undo within 14 days: restores the exact prior mapping; later work is retained. */
export function undoStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'applied') throw new Error('Only an applied transition can be undone.');
 if (clock().getTime() - new Date(transition.appliedAt || 0).getTime() > UNDO_WINDOW_MS) throw new Error('The 14-day undo window has closed. Your work is retained; change your stage profile instead.');
 const laterUnits = getLearningWorkspace(ctx).units.filter(u => transition.appliedAt && u.updatedAt > transition.appliedAt).length;
 transition.laterWorkCount = laterUnits;
 transition.state = 'undone'; transition.undoneAt = clock().toISOString();
 writeWithProfile(ctx, store, transition.from, transition.to); return transition;
}
type LegacyRow = Record<string, unknown>;
function entityRows(name: string): LegacyRow[] {
 const raw = localStorage.getItem(`visionary_entity_${name}`); if (!raw) return [];
 try { const value = JSON.parse(raw); if (!Array.isArray(value)) throw Error(); return value; }
 catch { throw new Error('Class records are unavailable. Promotion stays restricted until they can be read.'); }
}
/** The teacher-recorded class promotion (Part W's canonical case): every actively
 * enrolled learner moves to the next class level with a notice and full undo. */
export function proposeClassPromotion(ctx: RequestContext, classId: string, nextClassLevel: string, reason: string): { classId: string; nextClassLevel: string; promoted: Array<{ personId: string; name: string }>; skipped: Array<{ personId: string; reason: string }> } {
 check(ctx);
 if (ctx.role !== 'teacher') throw new Error('Only a teacher records a class promotion.');
 const level = String(nextClassLevel || '').trim();
 const classroom = entityRows('Classroom').find(c => c.id === classId);
 if (!classroom) throw new Error('This class does not exist.');
 const identity = workspaceIdentity(ctx);
 const owned = (classroom.teacher_email === identity.person.email || classroom.teacher_id === identity.person.id || classroom.created_by_id === identity.person.id || classroom.created_by === identity.person.email);
 if (!owned) throw new Error('Only the assigned teacher can record a promotion for this class.');
 if (!level.match(/^[0-9]{1,2}$/)) throw new Error('Enter the class level learners are moving to, for example 8.');
 const promoted: Array<{ personId: string; name: string }> = []; const skipped: Array<{ personId: string; reason: string }> = [];
 const enrollments = entityRows('Enrollment').filter(e => e.class_id === classId && e.status === 'active');
 if (!enrollments.length) throw new Error('No actively enrolled learners in this class.');
 const store = read();
 const changes: Array<{ ctx: RequestContext; from: StageProfile; to: StageProfile; transition: StageTransition; name: string }> = [];
 const seen = new Set<string>();
 // Read and authorize the entire roster before writing any learner. A missing
 // second workspace must not leave the first learner silently promoted.
 for (const enrollment of enrollments) {
  const learnerId = String(enrollment.student_id || enrollment.student_email || '');
  if (seen.has(learnerId)) continue;
  seen.add(learnerId);
  const learnerCtx: RequestContext = { ...ctx, personId: learnerId, workspaceId: `${learnerId}:student`, role: 'student' };
  const learner = workspaceIdentity(learnerCtx).person;
  const current = cleanProfile(learner.learningContext || { subjects: [] });
  const currentLevel = Number(String(current.classLevel || '').match(/\d+/)?.[0]);
  if (currentLevel === Number(level)) { skipped.push({ personId: learnerId, reason: 'already in ' + level }); continue; }
  if (!currentLevel || Number(level) - currentLevel !== 1) { skipped.push({ personId: learnerId, reason: 'not an adjacent promotion; learner confirmation is required' }); continue; }
  const to = { ...current, classLevel: level };
  const evidence = captureEvidence(learnerCtx, current, true);
  const transition: StageTransition = { id: crypto.randomUUID(), personId: learnerId, from: current, to, policy: 'AUTO', state: 'applied', reason: String(reason || '').trim().slice(0, 200) || `Class promotion to ${level} recorded by the teacher`, diff: { unitsKept: evidence.units, planStepsKept: evidence.planSteps, openClassworkKept: evidence.openClasswork, dueDatesRetained: true }, notifiedAt: clock().toISOString(), appliedAt: clock().toISOString() };
  changes.push({ ctx: learnerCtx, from: current, to, transition, name: learner.name });
 }
 if (changes.length) {
  updateStageProfilesBatch(changes.map(({ ctx: learnerCtx, to }) => ({ ctx: learnerCtx, profile: to })));
  store.transitions.push(...changes.map(change => change.transition));
  try { write(store); }
  catch (error) {
   try { updateStageProfilesBatch(changes.map(({ ctx: learnerCtx, from }) => ({ ctx: learnerCtx, profile: from }))); }
   catch { throw new Error('The promotion notice could not be saved and the prior class levels could not be restored. Review each learner before retrying.'); }
   throw error;
  }
  promoted.push(...changes.map(change => ({ personId: change.ctx.personId, name: change.name })));
 }
 return { classId, nextClassLevel: level, promoted, skipped };
}

/** The active notice for Home: the newest transition for this person — an applied
 * change (undo available), a postponed reevaluation notice, a CONFIRM awaiting action —
 * or null when nothing is pending. */
export function getActiveTransitionNotice(ctx: RequestContext): StageTransition | null {
 check(ctx);
 const store = read(); const now = clock().getTime();
 const transition = store.transitions.filter(t => t.personId === ctx.personId).at(-1);
 if (!transition) return null;
 if (transition.state === 'postponed' && transition.postponedUntil && new Date(transition.postponedUntil).getTime() <= now) {
  // Reevaluation due: the postponed change re-applies itself (D-012), unless the
  // learner has since set a different profile of their own.
  const current = cleanProfile(workspaceIdentity(ctx).person.learningContext || { subjects: [] });
  if (sameProfile(current, transition.from)) {
   transition.state = 'applied'; transition.appliedAt = clock().toISOString();
   writeWithProfile(ctx, store, transition.to, transition.from);
  } else {
   transition.state = 'undone'; transition.undoneAt = clock().toISOString(); write(store);
   return null;
  }
 }
 if (transition.state === 'undone') return null;
 if (transition.state === 'applied' && transition.appliedAt && now - new Date(transition.appliedAt).getTime() > UNDO_WINDOW_MS) return null;
 return transition;
}

/** A minimal recent class update for a consented parent report. Private work,
 * transition reasons and the learner's own Undo control never leave their space. */
export function getParentStageInsight(ctx: RequestContext, childId: string, days: 7 | 30 = 7): { state: 'applied' | 'postponed' | 'undone'; from: string; to: string; at: string } | null {
 reportDays(days);
 check(ctx);
 if (ctx.role !== 'parent' || !familyReports(ctx).some(child => child.id === childId)) throw new Error('This child’s stage update is not shared with you.');
 const transition = read().transitions.filter(item => item.personId === childId && item.from.classLevel && item.to.classLevel && item.from.classLevel !== item.to.classLevel).at(-1);
 if (!transition || !['applied', 'postponed', 'undone'].includes(transition.state)) return null;
 const state = transition.state as 'applied' | 'postponed' | 'undone';
 const at = state === 'undone' ? transition.undoneAt : state === 'applied' ? transition.appliedAt : transition.postponedAt || transition.notifiedAt;
 if (!at || !Number.isFinite(new Date(at).getTime()) || Math.abs(clock().getTime() - new Date(at).getTime()) > days * 86400000) return null;
 const current = cleanProfile(workspaceIdentity({ ...ctx, personId: childId, workspaceId: `${childId}:student`, role: 'student' }).person.learningContext || { subjects: [] });
 if (current.classLevel !== (state === 'applied' ? transition.to.classLevel : transition.from.classLevel)) return null;
 return { state, from: transition.from.classLevel!, to: transition.to.classLevel!, at };
}
