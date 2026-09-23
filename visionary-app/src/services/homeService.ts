import type { Locale, RequestContext } from '../domain/workspace.ts';
import { familyReports, getWorkspace, workspaceIdentity } from './workspaceService.ts';
import { getJourney } from './journeys.ts';
import { learningPriority,getLearningWorkspace } from './learningPipelineService.ts';
import { getDailyPlan } from './dailyPlanService.ts';
import { getWeeklyObservations,getStudentClasswork } from './mentorStateService.ts';

export interface HomeAction { label: string; path: string }
export interface HomeRow { id: string; title: string; titleLocale?: Locale; detail: string; action: HomeAction }
export interface HomeModel {
  name: string; workspace: string; boundary: string; setupNote?: string; observations?: {id:string;text:string}[]; memoryEnabled?: boolean;
  priority: HomeRow & { reason: string; source: string; updatedAt?: string; alternative: HomeAction };
  modules: { id: string; title: string; rows: HomeRow[] }[];
}
const action = (label: string, area: string): HomeAction => ({label, path: `/dashboard/${area}`});

/** Returns an already-scoped decision surface, never another person's raw records. */
export async function getHome(ctx: RequestContext): Promise<HomeModel> {
  const data = await getWorkspace(ctx);
  const { person, workspace } = workspaceIdentity(ctx);
  const model: HomeModel = {
    name: person.name.split(' ')[0] || 'there', workspace: workspace.name,
    boundary: workspace.organizationId ? 'Organization workspace · Personal learning stays separate' : ctx.role === 'organization' ? 'Organization workspace · Only connected work belongs here' : 'Personal workspace · Sharing is always scoped',
    priority: {id:'start',title:'Choose something to understand',detail:'Begin with one idea, explore it, then put it to use.',action:action('Choose a learning journey','learn'),alternative:action('Explore a project','build'),reason:'A starting point, not an assessment of what you know.',source:'Your selected learner role'}, modules: [],
  };
  const resources = data.resources.filter(r => r.status !== 'archived').sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  if (ctx.role === 'student' || ctx.role === 'professional') {
    model.setupNote = 'Stage-specific recommendations are not configured yet. These starting points do not assess your ability.';
    if (ctx.role === 'professional') model.priority = {id:'career',title:'Give your next skill a clear purpose',detail:'Choose a work problem or career goal to guide your learning.',action:action('Set a skill goal','career'),alternative:action('Explore learning','learn'),reason:'Your professional workspace starts with the outcome you want.',source:'Your selected professional role'};
    const session = [...data.sessions].filter(s => s.stage !== 'completed' && data.conversations.some(c => c.id === s.conversationId)).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))[0];
    if (session) {
      try {
        const journey = getJourney(session.journeyId, session.locale);
        model.priority = {id:session.id,title:journey.title,titleLocale:session.locale,detail:`Continue from ${session.stage}. Your answers, notes and activity controls are saved.`,action:action('Continue activity',`ask?session=${encodeURIComponent(session.id)}`),alternative:action('Choose another journey','learn'),reason:'This is your most recently updated unfinished activity in this workspace.',source:'Saved activity on this device',updatedAt:session.updatedAt};
      } catch { model.setupNote = 'A saved activity is unavailable in this preview. Its record has been preserved.'; }
    }
    const next = learningPriority(ctx);
    if (next.unit && (!session || next.unit.updatedAt > session.updatedAt)) model.priority = {
      id:next.unit.id,title:next.unit.title,titleLocale:next.unit.locale,
      detail:`Continue from ${next.unit.stage}. Your answers and position are saved on this device.`,
      action:action('Continue learning',`learn?unit=${encodeURIComponent(next.unit.id)}`),
      alternative:action('Open learning outline','learn'),
      reason:'This is your most recently updated unfinished learning unit in this workspace.',
      source:'Saved learning activity',updatedAt:next.unit.updatedAt,
    };
    else if (!session && next.due) model.priority = {
      id:next.due.conceptId,title:'A short review is due',
      detail:'A previous check is ready to revisit. This is a reminder, not a claim about your ability.',
      action:action('Open practice','practice'),alternative:action('Open learning outline','learn'),
      reason:'Scheduled from the date of your latest recorded check.',source:'Your own recorded learning evidence',updatedAt:next.due.lastPracticedAt,
    };
    if (ctx.role === 'student') {
      model.memoryEnabled = data.preferences.memory;
      const startingSubject = person.learningContext?.subjects[0];
      if (!session && !next.unit && !next.due && startingSubject) model.priority = {
        id:'profile-subject',title:`Start with ${startingSubject}`,
        detail:'Open your subject outline. If official content is unavailable, you can keep a provisional learning place and ask a question.',
        action:action('Open subject','learn'),alternative:action('Build a project','build'),
        reason:'This is the starting subject you selected during setup, not an assessment of what you know.',source:'Your onboarding preference',
      };
      const ownedUnits = new Map(getLearningWorkspace(ctx).units.map(unit => [unit.conceptId,unit.title]));
      model.observations = getWeeklyObservations(ctx).slice(0,3).map(item => ({id:item.id,text:item.conceptId && ownedUnits.has(item.conceptId) ? item.text.replace('this concept',ownedUnits.get(item.conceptId)!) : item.text}));
      const assigned = getStudentClasswork(ctx)[0];
      if (assigned && !session && !next.unit && assigned.dueAt) {
        model.priority = {
          id:assigned.id,title:assigned.title,detail:`Classwork from ${assigned.className}${assigned.dueAt ? ` · Due ${assigned.dueAt}` : ''}. Open it to review and submit your work.`,
          action:action('Open classwork',`classes?class=${encodeURIComponent(assigned.classId)}`),alternative:action('Open learning outline','learn'),
          reason:'This is the next published assignment in a class where your enrollment is active.',source:'Connected classwork',
        };
      }
    }
    // The Daily Mentor Engine plan carries classwork, reviews, the open unit and project
    // work as one sequenced day, replacing the earlier separate module lists.
    const plan = getDailyPlan(ctx);
    if (plan.steps.length) model.modules.push({id:'daily-plan',title:'Today’s plan',rows:plan.steps.map(step=>({id:step.id,title:step.title,titleLocale:step.titleLocale,detail:step.detail,action:step.action}))});
  } else if (ctx.role === 'teacher') {
    const lesson = resources.find(r => r.kind === 'lesson' && r.status === 'draft');
    model.priority = {id:lesson?.id || 'prepare',title:lesson ? `Continue preparing ${lesson.title}` : 'Prepare your next lesson',detail:'Review the objective, explanation and checks before sharing with a class.',action:action('Open preparation','prepare'),alternative:action('View classwork','classes'),reason:lesson ? 'You have an unfinished lesson draft in this teacher workspace.' : 'Start with the idea you want your learners to understand.',source:lesson ? 'Saved lesson draft' : 'Your selected teacher role',updatedAt:lesson?.updatedAt};
  } else if (ctx.role === 'parent') {
    const reports = familyReports(ctx);
    const child = reports[0];
    model.priority = child ? {id:child.id,title:`A little clarity for ${child.name}’s week`,detail:child.summary,action:action('View shared report',`reports?child=${encodeURIComponent(child.id)}`),alternative:action('Choose a child','child'),reason:'An active connection permits a progress summary. Private conversations and notes are not included.',source:`${child.period} · Accepted progress sharing`} : {id:'connect',title:'Connect before viewing progress',detail:'Request permission to see a child’s learning summary. Family billing does not grant access.',action:action('Connect with a child','child'),alternative:action('Review sharing boundaries','privacy'),reason:'There is no active progress-sharing connection available in this workspace.',source:'Current sharing permissions'};
  } else {
    const cohort = resources.find(r => r.kind === 'cohort');
    const curriculum = resources.find(r => r.kind === 'curriculum' && r.status === 'reviewed');
    model.priority = {id:'organization',title:cohort ? curriculum ? 'Review your organization’s next steps' : 'Review the learning direction' : 'Bring your people together',detail:cohort ? 'Connect curriculum and reviewed content to the groups you support.' : 'Start with invitations, then organize connected people into cohorts.',action:cohort ? action(curriculum ? 'Open insights' : 'Open curriculum',curriculum ? 'analytics' : 'curriculum') : action('Manage people','people'),alternative:action('Review cohorts','cohorts'),reason:cohort ? 'A cohort is saved in this workspace; a draft alone does not establish approved curriculum.' : 'No cohort has been saved in this workspace yet. People and permissions come first.',source:'Saved organization setup records'};
  }
  return model;
}
