import StageChangeDetails from '@/components/dashboard/StageChangeDetails';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getHome } from '@/services/homeService';
import { getActiveTransitionNotice, postponeStageTransition, undoStageTransition, confirmStageTransition } from '@/services/stageTransitionService';
import { deferPlanStep } from '@/services/dailyPlanService';
import { getStagePresentation } from '@/services/stagePresentation';
import RoleMentorPanel from '@/components/dashboard/RoleMentorPanel';

const roleIllustrations = {
  student: BookOpen,
  teacher: GraduationCap,
  parent: HeartHandshake,
  professional: BriefcaseBusiness,
  organization: Building2,
};

function HomeIllustration({ role }) {
  const Icon = roleIllustrations[role] || BookOpen;
  return <div className="v-home-illustration" aria-hidden="true">
    <span className="v-home-illustration-orbit orbit-one" />
    <span className="v-home-illustration-orbit orbit-two" />
    <span className="v-home-illustration-main"><Icon strokeWidth={1.5} /></span>
    <span className="v-home-illustration-spark spark-one"><Sparkles strokeWidth={1.8} /></span>
    <span className="v-home-illustration-spark spark-two"><ArrowRight strokeWidth={1.8} /></span>
  </div>;
}

export default function DecisionHome() {
  const {ctx,revision,error:workspaceError} = useWorkspace();
  const [transitionError,setTransitionError] = useState('');
  const [planError,setPlanError]=useState('');
  const [,setNoticeRevision] = useState(0);
  // Permission changes must not retain a previously authorized child summary while refetching.
  const query = useQuery({queryKey:['home',ctx?.personId,ctx?.workspaceId,ctx?.locale,revision],queryFn:({signal})=>getHome({...ctx,signal}),enabled:!!ctx,retry:false,gcTime:0});
  if (workspaceError || query.error) return <div className="v-page"><h1 className="v-title">Your next step is unavailable</h1><p className="v-notice v-error" role="alert">{workspaceError || query.error.message}</p><div className="v-home-actions"><button className="v-button" onClick={()=>query.refetch()}>Retry</button><Link className="v-button" to="/dashboard/ask">Open saved conversations</Link></div></div>;
  if (!query.data) return <div className="v-page" role="status" aria-busy="true">Preparing your next step…</div>;
  const {name,workspace,boundary,priority,modules,setupNote,observations,memoryEnabled} = query.data;
  let transition = null;
  let transitionReadError = '';
  try { transition = getActiveTransitionNotice(ctx); } catch (error) { transitionReadError = error.message; }
  function changeTransition(work) {
    try { work(); setTransitionError(''); }
    catch (error) { setTransitionError(error.message || 'Your stage could not be changed. Please retry.'); }
  }
  const stageTier = getStagePresentation(ctx).tier;
  return <div className={`v-page v-home stage-${stageTier}`}>
    <header className="v-home-header"><div><p className="v-home-eyebrow">{workspace}</p><h1 className="v-title">Welcome back, {name}.</h1><p className="v-home-boundary">{boundary}</p></div><span className="v-home-local-label">Saved on this device</span></header>
    {query.isFetching && <p className="v-muted" role="status">Updating your next step…</p>}
    <section className="v-home-priority" aria-labelledby="next-step-title" data-role={ctx.role}><div className="v-home-priority-copy"><p className="v-home-priority-label"><Sparkles size={16} aria-hidden="true" />Next for you</p><h2 id="next-step-title" lang={priority.titleLocale||'en'}>{priority.title}</h2><p className="v-muted">{priority.detail}</p><div className="v-home-actions"><Link className="v-button primary" to={priority.action.path}>{priority.action.label}<ArrowRight size={18} aria-hidden="true"/></Link><Link className="v-home-secondary" to={priority.alternative.path}>{priority.alternative.label}</Link></div><details className="v-home-reason"><summary>Why this?</summary><p>{priority.reason}</p><p>{priority.source}{priority.updatedAt && <> · <time dateTime={priority.updatedAt}>{new Date(priority.updatedAt).toLocaleDateString()}</time></>}</p></details></div><HomeIllustration role={ctx.role}/></section>
    {transitionReadError && <div className="v-notice v-error" role="alert">Your stage notice could not be loaded: {transitionReadError}<button className="v-button ml-3" onClick={() => setNoticeRevision(n => n + 1)}>Retry notice</button></div>}
    {transition && <section className="v-home-module" aria-labelledby="stage-transition-title"><p className="v-home-priority-label">Your stage</p><h2 id="stage-transition-title">{transition.state === 'awaiting-confirm' ? 'Confirm your new stage' : transition.state==='postponed'?'Stage change postponed':'Your stage changed'}</h2><p className="v-muted">{transition.state==='applied'?'Now':'Current'}: {(transition.state==='applied'?transition.to:transition.from).classLevel || 'not set'}{(transition.state==='applied'?transition.to:transition.from).board ? ` · ${(transition.state==='applied'?transition.to:transition.from).board}` : ''} · {transition.diff.planStepsKept} plan steps and {transition.diff.unitsKept} learning activities kept{transition.diff.openClassworkKept ? ` · ${transition.diff.openClassworkKept} open classwork items` : ''}. Due dates are retained.</p>{transition.state === 'awaiting-confirm' && <div className="v-home-actions"><button type="button" className="v-button primary" onClick={() => changeTransition(() => confirmStageTransition(ctx, transition.id))}>Confirm</button></div>}{transition.state === 'applied' && <div className="v-home-actions"><button type="button" className="v-button" onClick={() => changeTransition(() => undoStageTransition(ctx, transition.id))}>Undo this change</button><button type="button" className="v-button" onClick={() => changeTransition(() => postponeStageTransition(ctx, transition.id))}>Postpone 7 days</button></div>}{transition.state === 'postponed' && <p className="v-muted">Reevaluation scheduled for {transition.postponedUntil ? new Date(transition.postponedUntil).toLocaleDateString() : ''}.</p>}<StageChangeDetails key={`${ctx.workspaceId}:${transition.id}:${transition.state}`} ctx={ctx} transition={transition}/>{transitionError && <p className="v-notice v-error mt-3" role="alert">{transitionError} Your saved work is kept. Retry this action after checking your browser storage.</p>}</section>}
    {planError&&<p role="alert" className="v-notice v-error">{planError} Your plan is unchanged. Try Not today again after checking browser storage.</p>}
    <div className="v-home-modules">{modules.map(module=><section className="v-home-module" key={module.id} aria-labelledby={`home-${module.id}`}><h2 id={`home-${module.id}`}>{module.title}</h2>{module.rows.map(row=><div className="v-home-row" key={row.id}><div><p className="v-home-row-title">{row.title}</p><p className="v-muted">{row.detail}</p></div><div className="flex items-center gap-2">{row.deferId&&<button type="button" className="v-button" onClick={()=>{try{deferPlanStep(ctx,row.deferId);setPlanError('');}catch(failure){setPlanError(failure.message||'This step could not be postponed.');}}}>Not today</button>}<Link className="v-button" to={row.action.path}>{row.action.label}<span className="sr-only">: {row.title}</span></Link></div></div>)}</section>)}</div>
    {ctx.role==='student'&&<section className="v-home-module" aria-labelledby="home-memory"><h2 id="home-memory">Things I remember about you</h2><p className="v-muted">Only from your saved activity this week. These are observations, not an AI assessment.</p>{observations?.length?<ul className="mt-3 space-y-2">{observations.map(item=><li key={item.id} className="text-sm">{item.text}</li>)}</ul>:<p className="v-muted mt-3">{memoryEnabled?'No weekly observations yet. Start a learning unit or practice step to build your own history.':'Learning memory is off for this workspace. You can change it in Personalization.'}</p>}<Link className="v-button mt-4" to="/dashboard/privacy">View or clear memory</Link></section>}
    <RoleMentorPanel ctx={ctx}/>
    <section className="v-home-module" aria-labelledby="home-guide"><div className="v-home-row"><div><h2 id="home-guide">Need help along the way?</h2><p className="v-muted">Ask a question or continue a saved conversation.</p></div><Link className="v-button" to="/dashboard/ask"><Sparkles size={18} aria-hidden="true"/>Ask Visionary Guide</Link></div></section>
    {setupNote && <p className="v-home-empty">{setupNote}</p>}
    <p className="v-muted">Local preview · Saved on this device. No live model or cloud sync.</p>
  </div>;
}
