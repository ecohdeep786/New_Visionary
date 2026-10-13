import type { RequestContext } from '../domain/workspace.ts';
import { familyReports, reportDays, snapshot, updateStageProfile, updateStageProfilesBatch, workspaceIdentity } from './workspaceService.ts';
import { getDailyPlan } from './dailyPlanService.ts';
import { getLearningWorkspace, getLearningReviewQueue } from './learningPipelineService.ts';
import { getStudentClasswork } from './mentorStateService.ts';

// Part W stage-transition engine (M2): an eligible stage change applies itself with
// zero required action, notice + change-diff, Postpone 7d and Undo 14d — through this
// service, with recoverable local writes across the profile and notice stores. Policy: AUTO for ordinary progressions
// (adjacent class promotion, subject updates); CONFIRM for boundary jumps (board or
// institution change, a class jump of more than one grade). Undo restores the exact
// prior mapping while retaining every piece of work created since — history is never
// deleted to obtain snapshot equality. Evidence inference alone is suggestion-only.
export interface StageProfile {
  board?: string; classLevel?: string; subjects?: string[]; stage?: string; exam?: string; institution?:string;
}
export interface StageTransition {
  id: string; personId: string;
  from: StageProfile; to: StageProfile;
  policy: 'AUTO' | 'CONFIRM';
  state: 'notified' | 'applied' | 'postponed' | 'undone' | 'awaiting-confirm' | 'suggested' | 'superseded';
  trigger?:'teacher-promotion'|'self-confirmation'|'user-declared'|'calendar'|'evidence'; eventId?:string; actor?:string; boundaryReasons?:string[];
  classScope?:{classId:string;organizationEmail?:string};
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
  institution:profile.institution?.trim().slice(0,100)||undefined,
 };
}
function sameProfile(a: StageProfile, b: StageProfile) {
 return (a.board || '') === (b.board || '') && (a.classLevel || '') === (b.classLevel || '') && JSON.stringify(a.subjects||[])===JSON.stringify(b.subjects||[]) && (a.stage || '') === (b.stage || '') && (a.exam || '') === (b.exam || '') && (a.institution||'')===(b.institution||'');
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
 if (workspaceIdentity(ctx).workspace.organizationId) throw new Error('Stage transitions belong to a personal learning workspace.');
 if (ctx.role === 'student' || ctx.role === 'professional') {
  return 'self';
 }
 throw new Error('Stage transitions belong to a personal learning workspace.');
}
/** Propose a stage change: AUTO applies immediately with notice + diff; boundary jumps await confirmation. */
export function proposeStageTransition(ctx: RequestContext, next: StageProfile, reason: string, event:{trigger?:'self-confirmation'|'user-declared'|'calendar'|'evidence';eventId?:string;expectedProfile?:string}={}): StageTransition {
 assertCanPropose(ctx);
 const identity = workspaceIdentity(ctx);
 const from = cleanProfile(identity.person.learningContext || { subjects: [] });
 const to = cleanProfile({ ...from, ...next });
 const trigger=event.trigger||'user-declared';
 if(!['self-confirmation','user-declared','calendar','evidence'].includes(trigger))throw Error('This stage trigger is not available to a personal workspace.');
 if(event.expectedProfile!==undefined&&event.expectedProfile!==JSON.stringify(from))throw Error('Your stage profile changed. Reload the current profile before saving; your edits are retained.');
 if(event.eventId!==undefined&&(typeof event.eventId!=='string'||!event.eventId.trim()||event.eventId.length>160))throw Error('Use a valid stage event identifier.');
 if(['calendar','evidence'].includes(trigger)&&!event.eventId)throw Error('This stage trigger requires a stable event identifier.');
 const store = read();
 const prior=event.eventId?store.transitions.find(item=>item.personId===ctx.personId&&item.trigger===trigger&&item.eventId===event.eventId):undefined;
 if(prior){if(!sameProfile(prior.to,to))throw Error('This stage event identifier already belongs to another profile.');return structuredClone(prior);}
 if (sameProfile(from, to)) throw new Error('This stage profile is already the active one.');
 const latest=store.transitions.filter(item=>item.personId===ctx.personId&&!['suggested','superseded'].includes(item.state)).at(-1);
 if(trigger==='calendar'&&latest&&(['postponed','awaiting-confirm'].includes(latest.state)||latest.state==='applied'&&clock().getTime()-Date.parse(latest.appliedAt||'')<=UNDO_WINDOW_MS))throw Error('An existing stage decision takes priority. Calendar reevaluation cannot bypass its postponement or confirmation.');
 if(trigger!=='evidence')for(const item of store.transitions.filter(item=>item.personId===ctx.personId&&['notified','postponed','awaiting-confirm'].includes(item.state)))item.state='superseded';
 const evidence = captureEvidence(ctx, from, true);
 const boardJump = (from.board || '') !== (to.board || '') && Boolean(from.board);
 const distance = classDistance(from.classLevel, to.classLevel);
 const boundaryReasons=[...(boardJump?['Board change']:[]),...((from.institution||'')!==(to.institution||'')&&Boolean(from.institution)?['Institution change']:[]),...(distance>1?['More than one class level']:[]),...((from.stage&&from.stage!==to.stage)||identity.person.ageBand!=='adult'&&['higher_ed','professional'].includes(to.stage||'')?['Education stage change']:[])];
 const policy: StageTransition['policy'] = boundaryReasons.length ? 'CONFIRM' : 'AUTO';
 const diff = { unitsKept: evidence.units, planStepsKept: evidence.planSteps, openClassworkKept: evidence.openClasswork, dueDatesRetained: true };
 const transition: StageTransition = { id: crypto.randomUUID(), personId: ctx.personId, from, to, policy, state: trigger==='evidence'?'suggested':policy === 'AUTO' ? 'applied' : 'awaiting-confirm',trigger,eventId:event.eventId,actor:ctx.personId,boundaryReasons, reason: String(reason || '').trim().slice(0, 200) || 'Stage profile updated', diff, notifiedAt: clock().toISOString(), appliedAt: trigger!=='evidence'&&policy === 'AUTO' ? clock().toISOString() : undefined };
 if(trigger==='self-confirmation'&&event.eventId?.startsWith('suggestion:')){const suggestion=store.transitions.find(item=>item.id===event.eventId!.slice(11)&&item.personId===ctx.personId&&item.state==='suggested');if(suggestion)suggestion.state='superseded';}
 store.transitions.push(transition);
 if (trigger!=='evidence'&&policy === 'AUTO') writeWithProfile(ctx, store, to, from);
 else write(store);
 return transition;
}
function requireCurrentTransition(ctx: RequestContext, store: TransitionStore, transition: StageTransition, expected: StageProfile) {
 assertCanPropose(ctx);
 const latest=store.transitions.filter(item=>item.personId===ctx.personId&&!['undone','superseded','suggested'].includes(item.state)).at(-1);
 const current=cleanProfile(workspaceIdentity(ctx).person.learningContext||{subjects:[]});
 if(latest?.id!==transition.id||!sameProfile(current,expected))throw Error('Your stage changed after this notice. Refresh Home before changing it; your saved work is retained.');
}
function requireOpenWindow(transition: StageTransition) {
 if(clock().getTime()-new Date(transition.appliedAt||0).getTime()>UNDO_WINDOW_MS)throw Error('The 14-day change window has closed. Your work is retained; change your stage profile instead.');
}
/** Read-only continuity details. Retention is not proof of a new curriculum mapping. */
export function getStageContinuity(ctx: RequestContext, transitionId: string) {
 assertCanPropose(ctx);
 const store=read(),transition=store.transitions.find(item=>item.id===transitionId&&item.personId===ctx.personId);
 if(!transition)throw Error('This stage change is unavailable in your learning workspace.');
 const before=transition.from.subjects||[],after=transition.to.subjects||[];
 const learning=getLearningWorkspace(ctx),reviews=new Map(getLearningReviewQueue(ctx).map(item=>[item.unit.id,item.dueAt]));
 return {from:structuredClone(transition.from),to:structuredClone(transition.to),state:transition.state,
 subjects:{kept:after.filter(subject=>before.includes(subject)),added:after.filter(subject=>!before.includes(subject)),removed:before.filter(subject=>!after.includes(subject))},
 activities:learning.units.map(unit=>({id:unit.id,title:unit.title,stage:unit.stage,locale:unit.locale,classId:unit.classId,dueAt:reviews.get(unit.id),path:'/dashboard/learn?unit='+encodeURIComponent(unit.id)})),
 classwork:ctx.role==='student'?getStudentClasswork(ctx).map(item=>({...item,path:'/dashboard/learn?assignment='+encodeURIComponent(item.id)})):[],
 sourceSelection:learning.selection?structuredClone(learning.selection):null,
 isLatest:store.transitions.filter(item=>item.personId===ctx.personId&&item.state!=='undone').at(-1)?.id===transition.id,
 mappingStatus:'awaiting-reviewed-mapping' as const};
}
/** Confirm a boundary jump that policy held for explicit confirmation. */
export function confirmStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'awaiting-confirm') throw new Error('This transition is not waiting for confirmation.');
 requireCurrentTransition(ctx,store,transition,transition.from);
 transition.state = 'applied'; transition.appliedAt = clock().toISOString();
 writeWithProfile(ctx, store, transition.to, transition.from); return transition;
}
/** Postpone: reverses the applied mapping and reevaluates in seven days (D-012). */
export function postponeStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'applied') throw new Error('Only an applied transition can be postponed.');
 requireCurrentTransition(ctx,store,transition,transition.to); requireOpenWindow(transition);
 transition.state = 'postponed'; transition.postponedAt = clock().toISOString(); transition.postponedUntil = new Date(clock().getTime() + POSTPONE_MS).toISOString();
 writeWithProfile(ctx, store, transition.from, transition.to); return transition;
}
/** Undo within 14 days: restores the exact prior mapping; later work is retained. */
export function undoStageTransition(ctx: RequestContext, transitionId: string): StageTransition {
 check(ctx);
 const store = read(); const transition = store.transitions.find(t => t.id === transitionId && t.personId === ctx.personId);
 if (!transition || transition.state !== 'applied') throw new Error('Only an applied transition can be undone.');
 requireCurrentTransition(ctx,store,transition,transition.to);
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
 if((identity.workspace.organizationId||'')!==String(classroom.organization_email||''))throw Error('Open the matching class workspace before recording a promotion.');
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
  const eventId=`${classId}:${level}:${clock().getUTCFullYear()}`;
  if(store.transitions.some(item=>item.personId===learnerId&&item.trigger==='teacher-promotion'&&item.eventId===eventId)){skipped.push({personId:learnerId,reason:'This promotion event was already recorded; retained notice and reversal are unchanged'});continue;}
  const current = cleanProfile(learner.learningContext || { subjects: [] });
  const currentLevel = Number(String(current.classLevel || '').match(/\d+/)?.[0]);
  if (currentLevel === Number(level)) { skipped.push({ personId: learnerId, reason: 'already in ' + level }); continue; }
  if (!currentLevel || Number(level) - currentLevel !== 1) { skipped.push({ personId: learnerId, reason: 'not an adjacent promotion; learner confirmation is required' }); continue; }
  const to = { ...current, classLevel: level };
  const evidence = captureEvidence(learnerCtx, current, true);
  const transition: StageTransition = { id: crypto.randomUUID(), personId: learnerId, from: current, to, policy: 'AUTO', state: 'applied',trigger:'teacher-promotion',eventId,actor:ctx.personId,classScope:{classId,...(identity.workspace.organizationId?{organizationEmail:identity.workspace.organizationId}:{})}, reason: String(reason || '').trim().slice(0, 200) || `Class promotion to ${level} recorded by the teacher`, diff: { unitsKept: evidence.units, planStepsKept: evidence.planSteps, openClassworkKept: evidence.openClasswork, dueDatesRetained: true }, notifiedAt: clock().toISOString(), appliedAt: clock().toISOString() };
  changes.push({ ctx: learnerCtx, from: current, to, transition, name: learner.name });
 }
 if (changes.length) {
  updateStageProfilesBatch(changes.map(({ ctx: learnerCtx, to }) => ({ ctx: learnerCtx, profile: to })));
  for(const item of store.transitions.filter(item=>changes.some(change=>change.ctx.personId===item.personId)&&['notified','postponed','awaiting-confirm'].includes(item.state)))item.state='superseded';
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
 const transition = store.transitions.filter(t => t.personId === ctx.personId&&!['suggested','superseded'].includes(t.state)).at(-1);
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

export function getStageSuggestions(ctx:RequestContext){assertCanPropose(ctx);return structuredClone(read().transitions.filter(item=>item.personId===ctx.personId&&item.state==='suggested'));}
export function respondStageSuggestion(ctx:RequestContext,id:string,accept:boolean){assertCanPropose(ctx);const store=read(),item=store.transitions.find(item=>item.id===id&&item.personId===ctx.personId&&item.state==='suggested');if(!item)throw Error('This stage suggestion is unavailable.');if(accept){const current=cleanProfile(workspaceIdentity(ctx).person.learningContext||{subjects:[]});if(!sameProfile(current,item.from))throw Error('Your stage changed after this suggestion. Review the current profile instead.');return proposeStageTransition(ctx,item.to,'You reviewed a stage suggestion',{trigger:'self-confirmation',eventId:'suggestion:'+item.id});}item.state='superseded';write(store);return null;}
export function getStageProfile(ctx:RequestContext){assertCanPropose(ctx);return cleanProfile(workspaceIdentity(ctx).person.learningContext||{subjects:[]});}
