import type { Locale, RequestContext } from '../domain/workspace.ts';
import { snapshot, workspaceIdentity } from './workspaceService.ts';
import { getStudentState, getStudentClasswork } from './mentorStateService.ts';
import { getLearningWorkspace } from './learningPipelineService.ts';

// Daily Mentor Engine seam: the mentor plans ONE day from recorded evidence only —
// published classwork, a due review, the open learning unit, and unfinished project
// work. Nothing here invents weakness, curriculum, or ability; an empty record
// produces an empty plan and Home keeps its honest starting points.
export interface PlanStep {
 id: string; kind: 'classwork' | 'review' | 'learn' | 'build'; title: string; titleLocale?: Locale;
 detail: string; action: { label: string; path: string }; reason: string; source: string;
 dueAt?: string; done: boolean;
}
export interface DailyPlan { date: string; steps: PlanStep[] }
let clock = () => new Date();
/** Injectable clock so the plan is testable against the same fixed day as the other services. */
export function configureDailyPlanClock(next: () => Date) { clock = next; }
function check(ctx: RequestContext) {
 if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 const { person } = workspaceIdentity(ctx);
 if (!['student', 'professional'].includes(ctx.role)) throw new Error('A daily plan belongs to a personal learning workspace.');
 if (ctx.role === 'professional' && person.ageBand !== 'adult') throw new Error('Professional journeys are available only to adult profiles. Use a general learning workspace.');
}
function day(value: string) { return value.slice(0, 10); }

export function getDailyPlan(ctx: RequestContext): DailyPlan {
 check(ctx);
 const today = day(clock().toISOString());
 const units = getLearningWorkspace(ctx).units;
 const openUnit = [...units].filter(u => u.stage !== 'completed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
 const steps: PlanStep[] = [];
 if (ctx.role === 'student') for (const item of getStudentClasswork(ctx).slice(0, 2)) steps.push({
  id: `classwork:${item.id}`, kind: 'classwork', title: item.title,
  detail: `${item.className}${item.dueAt ? ` · Due ${item.dueAt}` : ''}. Open it to review and submit your work.`,
  action: { label: 'Open classwork', path: `/dashboard/classes?class=${encodeURIComponent(item.classId)}` },
  reason: 'Published assignment in a class where your enrollment is active.', source: 'Connected classwork', dueAt: item.dueAt, done: false,
 });
 // One review keeps the day focused. A concept whose unit is still open is reviewed by
 // continuing that unit, and a weak concept practiced moments ago is not yet due, so
 // neither becomes a separate reminder.
 const now = clock().getTime();
 const due = getStudentState(ctx).concepts
  .filter(c => c.dueAt && new Date(c.dueAt).getTime() <= now && openUnit?.conceptId !== c.conceptId)
  .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0];
 if (due) {
  const known = units.find(u => u.conceptId === due.conceptId)?.title;
  steps.push({
   id: `review:${due.conceptId}`, kind: 'review', title: known ? `Review: ${known}` : 'A short review is due',
   detail: 'A previous check is ready to revisit. This is a reminder, not a claim about your ability.',
   action: { label: 'Open practice', path: '/dashboard/practice' },
   reason: 'Scheduled from the date of the latest recorded check for this concept.', source: 'Your recorded learning evidence', dueAt: due.dueAt, done: false,
  });
 }
 if (openUnit) steps.push({
  id: `unit:${openUnit.id}`, kind: 'learn', title: openUnit.title, titleLocale: openUnit.locale,
  detail: `Continue from ${openUnit.stage}. Your answers and position are saved on this device.`,
  action: { label: 'Continue learning', path: `/dashboard/learn?unit=${encodeURIComponent(openUnit.id)}` },
  reason: 'The most recently updated unfinished learning unit in this workspace.', source: 'Saved learning activity', done: false,
 });
 const artifacts = [...snapshot(ctx).artifacts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
 const project = artifacts.find(a => a.status !== 'completed' && a.learningSessionId !== openUnit?.id);
 if (project) steps.push({
  id: `build:${project.id}`, kind: 'build', title: project.title,
  detail: 'Your saved project remains in Build.',
  action: { label: 'Open projects', path: '/dashboard/build' },
  reason: 'Unfinished project work saved in this workspace.', source: 'Your saved project', done: false,
 });
 // Work verified earlier today closes the day instead of reopening it. A completed unit
 // and its completed project are two distinct verified events, so both can appear.
 const done: PlanStep[] = [];
 for (const unit of units.filter(u => u.stage === 'completed' && day(u.updatedAt) === today).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 2)) done.push({
  id: `done:${unit.id}`, kind: 'learn', title: unit.title, titleLocale: unit.locale,
  detail: 'Done today · recorded comprehension check and practice. Reopen to revisit the explanation.',
  action: { label: 'Reopen', path: `/dashboard/learn?unit=${encodeURIComponent(unit.id)}` },
  reason: 'Recorded earlier today from verified comprehension work.', source: 'Your recorded learning evidence', done: true,
 });
 for (const artifact of artifacts.filter(a => a.status === 'completed' && day(a.updatedAt) === today).slice(0, 1)) done.push({
  id: `done-build:${artifact.id}`, kind: 'build', title: artifact.title,
  detail: 'Done today · your project was marked complete in Build.',
  action: { label: 'Open projects', path: '/dashboard/build' },
  reason: 'Recorded earlier today from your completed project.', source: 'Your saved project', done: true,
 });
 return { date: today, steps: [...steps, ...done] };
}
