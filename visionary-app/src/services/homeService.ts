import type { Locale, RequestContext } from '../domain/workspace.ts';
import { familyReports, getWorkspace, workspaceIdentity } from './workspaceService.ts';
import { getJourney } from './journeys.ts';

export interface HomeAction { label: string; path: string }
export interface HomeRow { id: string; title: string; titleLocale?: Locale; detail: string; action: HomeAction }
export interface HomeModel {
  name: string; workspace: string; boundary: string; setupNote?: string;
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
    const artifact = [...data.artifacts].filter(a => a.status !== 'completed').sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (artifact) model.modules.push({id:'build',title:'Something you are building',rows:[{id:artifact.id,title:artifact.title,detail:'Your saved project remains in Build.',action:action('Open projects','build')}]});
  } else if (ctx.role === 'teacher') {
    const lesson = resources.find(r => r.kind === 'lesson' && r.status === 'draft');
    model.priority = {id:lesson?.id || 'prepare',title:lesson ? `Continue preparing ${lesson.title}` : 'Prepare your next lesson',detail:'Review the objective, explanation and checks before sharing with a class.',action:action('Open preparation','prepare'),alternative:action('View classwork','classes'),reason:lesson ? 'You have an unfinished lesson draft in this teacher workspace.' : 'Start with the idea you want your learners to understand.',source:lesson ? 'Saved lesson draft' : 'Your selected teacher role',updatedAt:lesson?.updatedAt};
    model.modules.push({id:'teaching',title:'Your teaching workspace',rows:[{id:'classes',title:'Classwork and feedback',detail:'Open your classes to review assigned work and submissions.',action:action('View classes','classes')}]});
  } else if (ctx.role === 'parent') {
    const reports = familyReports(ctx);
    const child = reports[0];
    model.priority = child ? {id:child.id,title:`A little clarity for ${child.name}’s week`,detail:child.summary,action:action('View shared report',`reports?child=${encodeURIComponent(child.id)}`),alternative:action('Choose a child','child'),reason:'An active connection permits a progress summary. Private conversations and notes are not included.',source:`${child.period} · Accepted progress sharing`} : {id:'connect',title:'Connect before viewing progress',detail:'Request permission to see a child’s learning summary. Family billing does not grant access.',action:action('Connect with a child','child'),alternative:action('Review sharing boundaries','privacy'),reason:'There is no active progress-sharing connection available in this workspace.',source:'Current sharing permissions'};
    if (reports.length > 1) model.modules.push({id:'children',title:'Your connected children',rows:reports.map(r => ({id:r.id,title:r.name,detail:`${r.period} · Permission-scoped summary`,action:action('View report',`reports?child=${encodeURIComponent(r.id)}`)}))});
  } else {
    const cohort = resources.find(r => r.kind === 'cohort');
    const curriculum = resources.find(r => r.kind === 'curriculum' && r.status === 'reviewed');
    model.priority = {id:'organization',title:cohort ? curriculum ? 'Review your organization’s next steps' : 'Review the learning direction' : 'Bring your people together',detail:cohort ? 'Connect curriculum and reviewed content to the groups you support.' : 'Start with invitations, then organize connected people into cohorts.',action:cohort ? action(curriculum ? 'Open insights' : 'Open curriculum',curriculum ? 'analytics' : 'curriculum') : action('Manage people','people'),alternative:action('Review cohorts','cohorts'),reason:cohort ? 'A cohort is saved in this workspace; a draft alone does not establish approved curriculum.' : 'No cohort has been saved in this workspace yet. People and permissions come first.',source:'Saved organization setup records'};
    model.modules.push({id:'setup',title:'Setup at a glance',rows:[{id:'cohorts',title:'Cohorts',detail:cohort ? 'A saved cohort is available for review.' : 'Group connected people around a learning purpose.',action:action('Open cohorts','cohorts')},{id:'curriculum',title:'Curriculum',detail:curriculum ? 'Reviewed curriculum exists in this workspace.' : 'Map and review content before distribution.',action:action('Open curriculum','curriculum')}]});
  }
  return model;
}
