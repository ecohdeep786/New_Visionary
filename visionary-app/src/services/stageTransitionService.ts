import type { RequestContext } from '../domain/workspace.ts';
import { snapshot, updateStageProfile, workspaceIdentity } from './workspaceService.ts';
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
  notifiedAt: string; appliedAt?: string; postponedUntil?: string; undoneAt?: string;
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
 return (a.board || '') === (b.board || '') && (a.classLevel || '') === (b.classLevel || '') && (a.subjects || []).join('|') === (b.subjects || []).join('|');
}
function classDistance(fromLevel?: string, toLevel?: string): number {
 const from = Number(String(fromLevel || '').replace(/\D/g, '')); const to = Number(String(toLevel || '').replace(/\D/g, ''));
 if (!String(fromLevel || '').match(/\d/) || !String(toLevel || '').match(/\d/)) return 0;
 if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
 return Math.abs(to - from);
}
function captureEvidence(ctx: RequestContext, profile: StageProfile) {
 try {
  const plan = getDailyPlan(ctx);
  return { units: getLearningWorkspace(ctx).units.length, planSteps: plan.steps.filter(s => !s.done).length, openClasswork: ctx.role === 'student' ? getStudentClasswork(ctx).length : 0, stageProfile: profile };
 } catch { return { units: 0, planSteps: 0, openClasswork: 0, stageProfile: profile }; }
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
 const to = cleanProfile(next);
 const from = cleanProfile(identity.person.learningContext || { subjects: [] });
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
 if (policy === 'AUTO') updateStageProfile(ctx, to, { replace: true });
 store.transitions.push(transition); write(store);
 return transition;
}
/** Confirm a boundary jump that policy held for explicit confirmation. */
export function confirmStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'awaiting-confirm') throw new Error('This transition is not waiting for confirmation.');
 transition.state = 'applied'; transition.appliedAt = clock().toISOString();
 updateStageProfile(ctx, transition.to, { replace: true });
 write(store); return transition;
}
/** Postpone: reverses the applied mapping and reevaluates in seven days (D-012). */
export function postponeStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'applied') throw new Error('Only an applied transition can be postponed.');
 transition.state = 'postponed'; transition.postponedUntil = new Date(clock().getTime() + POSTPONE_MS).toISOString();
 updateStageProfile(ctx, transition.from, { replace: true });
 write(store); return transition;
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
 updateStageProfile(ctx, transition.from, { replace: true });
 write(store); return transition;
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
 for (const enrollment of enrollments) {
  const learnerId = String(enrollment.student_id || enrollment.student_email || '');
  const learner = workspaceIdentity({ ...ctx, personId: learnerId, workspaceId: `${learnerId}:student`, role: 'student' }).person;
  const current = cleanProfile(learner.learningContext || { subjects: [] });
  if ((current.classLevel || '') === level) { skipped.push({ personId: learnerId, reason: 'already in ' + level }); continue; }
  const to = { ...current, classLevel: level };
  const store = read();
  const transition: StageTransition = { id: crypto.randomUUID(), personId: learnerId, from: current, to, policy: 'AUTO', state: 'applied', reason: String(reason || '').trim().slice(0, 200) || `Class promotion to ${level} recorded by the teacher`, diff: { unitsKept: 0, planStepsKept: 0, openClassworkKept: 0, dueDatesRetained: true }, notifiedAt: clock().toISOString(), appliedAt: clock().toISOString() };
  updateStageProfile({ ...ctx, personId: learnerId, workspaceId: `${learnerId}:student`, role: 'student' }, to, { replace: true });
  store.transitions.push(transition); write(store);
  promoted.push({ personId: learnerId, name: learner.name });
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
   updateStageProfile(ctx, transition.to, { replace: true });
   write(store);
  } else {
   transition.state = 'undone'; transition.undoneAt = clock().toISOString(); write(store);
   return null;
  }
 }
 if (transition.state === 'undone') return null;
 if (transition.state === 'applied' && transition.appliedAt && now - new Date(transition.appliedAt).getTime() > UNDO_WINDOW_MS) return null;
 return transition;
}
