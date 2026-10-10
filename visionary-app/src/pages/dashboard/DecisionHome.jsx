import SpotIllustration from '@/components/landing/SpotIllustration';
import {homeCopy} from '@/lib/homeCopy';
import {currentPlanDeferralLabel, homePlanPresentation, planDeferralFailureHelp} from '@/lib/homeEngagement';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {stageCopy} from '@/lib/stageCopy';
import StageChangeDetails from '@/components/dashboard/StageChangeDetails';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CircleCheck, ClipboardList, Hammer, RotateCcw, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getHome } from '@/services/homeService';
import { getStageSuggestions, getActiveTransitionNotice, postponeStageTransition, undoStageTransition, confirmStageTransition } from '@/services/stageTransitionService';
import { deferPlanStep } from '@/services/dailyPlanService';
import { getStagePresentation } from '@/services/stagePresentation';
import RoleMentorPanel from '@/components/dashboard/RoleMentorPanel';
import StagePresentationSummary from '@/components/dashboard/StagePresentationSummary';

export default function DecisionHome() {
  const {ctx,data:workspaceData,revision,error:workspaceError} = useWorkspace();
  const locale=workspaceData?.preferences.interfaceLocale||'en';
  const copy=homeCopy(locale);
  const guideAvailable = ctx?.role !== 'organization' || organizationPathAllowed({permissions:[]}, '/dashboard/ask');
  const [transitionError,setTransitionError] = useState('');
  const [planError,setPlanError]=useState('');
  const [,setNoticeRevision] = useState(0);
  // Permission changes must not retain a previously authorized child summary while refetching.
  const query = useQuery({queryKey:['home',ctx?.personId,ctx?.workspaceId,ctx?.locale,revision],queryFn:({signal})=>getHome({...ctx,signal}),enabled:!!ctx,retry:false,gcTime:0});
  if (workspaceError || query.error) return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Your next step is unavailable")}</h1><p className="v-notice v-error" role="alert" lang="en">{workspaceError || query.error.message}</p><div className="v-home-actions"><button className="v-button" onClick={()=>query.refetch()}>{copy("Retry")}</button>{guideAvailable && <Link className="v-button" to="/dashboard/ask">{copy("Open saved conversations")}</Link>}</div></div>;
  if (!query.data) return <div className="v-page" role="status" aria-busy="true" lang={locale}>{copy("Preparing your next step…")}</div>;
  const {name,workspace,boundary,priority,modules,setupNote,observations,memoryEnabled} = query.data;
  const homePlan = homePlanPresentation(modules, priority);
  function postponePlanStep(stepId) {
    try { deferPlanStep(ctx,stepId); setPlanError(''); }
    catch (failure) { setPlanError(failure.message || 'This step could not be postponed.'); }
  }
  let transition = null;
  let transitionReadError = '';
  try { transition = getActiveTransitionNotice(ctx); } catch (error) { transitionReadError = error.message; }
  function changeTransition(work) {
    try { work(); setTransitionError(''); }
    catch (error) { setTransitionError(error.message || 'Your stage could not be changed. Please retry.'); }
  }
  const t=stageCopy(locale);
  const presentation = getStagePresentation(ctx);
  const stageTier = presentation.tier;
  return <div className={`v-page v-home stage-${stageTier}`} lang={locale}>
    <header className="v-home-header"><div><p className="v-home-eyebrow">{workspace}</p><h1 className="v-title">{copy('Welcome back, {name}.',{name})}</h1><p className="v-home-boundary">{boundary}</p></div><span className="v-home-local-label">{copy("Saved on this device")}</span></header>
    {query.isFetching && <p className="v-muted" role="status">{copy("Updating your next step…")}</p>}
    {['student','professional'].includes(ctx.role)&&<StagePresentationSummary presentation={presentation} locale={workspaceData?.preferences.interfaceLocale||'en'}/>}
    <section className="v-home-priority" aria-labelledby="next-step-title" data-role={ctx.role}>
      <div className="v-home-priority-copy">
        <p className="v-home-priority-label"><Sparkles size={16} aria-hidden="true" />{copy("Next for you")}</p>
        <h2 id="next-step-title" lang={priority.titleLocale||locale}>{priority.title}</h2>
        <p className="v-muted">{priority.detail}</p>
        <div className="v-home-actions v-home-current-controls">
          <Link className="v-button primary" to={priority.action.path}>{priority.action.label}<ArrowRight size={18} aria-hidden="true"/></Link>
          <Link className="v-home-secondary" to={priority.alternative.path}>{priority.alternative.label}</Link>
        </div>
        <details className="v-home-reason"><summary>{copy("Why this?")}</summary><p>{priority.reason}</p><p>{priority.source}{priority.updatedAt && <> · <time dateTime={priority.updatedAt}>{new Date(priority.updatedAt).toLocaleDateString(locale)}</time></>}</p></details>
        {homePlan.currentStep && <details className="v-home-task-options"><summary>{copy('Change plan')}</summary><button type="button" className="v-button v-home-defer" onClick={() => postponePlanStep(homePlan.currentStep.deferId)}>{currentPlanDeferralLabel(locale)}</button></details>}
      </div>
      <SpotIllustration subject={{student:"learn",teacher:"document",parent:"handshake",professional:"briefcase",organization:"community"}[ctx.role] || "compass"} className="v-home-priority-art" />
    </section>
    {transitionReadError && <div className="v-notice v-error" role="alert">{t("Your stage notice could not be loaded:")} <span lang="en">{transitionReadError}</span><button className="v-button ml-3" onClick={() => setNoticeRevision(n => n + 1)}>{t("Retry notice")}</button></div>}
    {transition && <section className="v-home-module" aria-labelledby="stage-transition-title" lang={locale}><p className="v-home-priority-label">{t("Your stage")}</p><h2 id="stage-transition-title">{t(transition.state === 'awaiting-confirm' ? 'Confirm your new stage' : transition.state==='postponed'?'Stage change postponed':'Your stage changed')}</h2><p className="v-muted">{t(transition.state==='applied'?'Now':'Current')}: {(transition.state==='applied'?transition.to:transition.from).classLevel || t('not set')}{(transition.state==='applied'?transition.to:transition.from).board ? ` · ${(transition.state==='applied'?transition.to:transition.from).board}` : ''} · {t("{plans} plan steps and {units} learning activities kept",{plans:transition.diff.planStepsKept,units:transition.diff.unitsKept})}{transition.diff.openClassworkKept ? ` · ${t("{count} open classwork items",{count:transition.diff.openClassworkKept})}` : ''}{t("Due dates are retained.")}</p>{transition.state === 'awaiting-confirm' && <div className="v-home-actions"><button type="button" className="v-button primary" onClick={() => changeTransition(() => confirmStageTransition(ctx, transition.id))}>{t("Confirm")}</button></div>}{transition.state === 'applied' && <div className="v-home-actions"><button type="button" className="v-button" onClick={() => changeTransition(() => undoStageTransition(ctx, transition.id))}>{t("Undo this change")}</button><button type="button" className="v-button" onClick={() => changeTransition(() => postponeStageTransition(ctx, transition.id))}>{t("Postpone 7 days")}</button></div>}{transition.state === 'postponed' && <p className="v-muted">{t('Reevaluation scheduled for {date}.',{date:transition.postponedUntil ? new Date(transition.postponedUntil).toLocaleDateString(locale) : ''})}</p>}<StageChangeDetails key={`${ctx.workspaceId}:${transition.id}:${transition.state}`} ctx={ctx} transition={transition} locale={workspaceData?.preferences.interfaceLocale||'en'}/>{transitionError && <p className="v-notice v-error mt-3" role="alert"><span lang="en">{transitionError}</span> {t("Your saved work is kept. Retry this action after checking your browser storage.")}</p>}</section>}
    {planError&&<p role="alert" className="v-notice v-error"><span lang="en">{planError}</span> {planDeferralFailureHelp(locale)}</p>}
    {homePlan.modules.length > 0 && <div className="v-home-modules">{homePlan.modules.map(module => <section className="v-home-module" key={module.id} aria-labelledby={`home-${module.id}`}>
      <h2 id={`home-${module.id}`} className="v-home-plan-title">{module.title}</h2>
      {module.rows.map(row => <div className={`v-home-row ${module.id === 'daily-plan' ? 'v-home-plan-row' : ''}`} key={row.id}>
        <div className="v-home-row-copy">
          {module.id === 'daily-plan' && <span className="v-home-plan-symbol" aria-hidden="true" data-kind={row.id.split(':')[0]}><PlanSymbol id={row.id}/></span>}
          <div><p className="v-home-row-title" lang={row.titleLocale || undefined}>{row.title}</p><p className="v-muted">{row.detail}</p></div>
        </div>
        <div className="flex items-center gap-2 v-home-plan-actions">
          <Link className="v-button" to={row.action.path}>{row.action.label}<span className="sr-only">: {row.title}</span></Link>
          {row.deferId && <button type="button" className="v-button v-home-defer" onClick={() => postponePlanStep(row.deferId)}>{copy("Not today")}<span className="sr-only">: {row.title}</span></button>}
        </div>
      </div>)}
    </section>)}</div>}
    {ctx.role==='student'&&<details className="v-home-module v-home-memory"><summary>{copy("Things I remember about you")}</summary><p className="v-muted">{copy("Only from your saved activity this week. These are observations, not an AI assessment.")}</p>{observations?.length?<ul className="mt-3 space-y-2">{observations.map(item=><li key={item.id} className="text-sm" lang="en">{item.text}</li>)}</ul>:<p className="v-muted mt-3">{copy(memoryEnabled?'No weekly observations yet. Start a learning unit or practice step to build your own history.':'Learning memory is off for this workspace. You can change it in Personalization.')}</p>}<Link className="v-button mt-4" to="/dashboard/privacy">{copy("View or clear memory")}</Link></details>}
    {['student','professional'].includes(ctx.role)&&<StageSuggestionEntry ctx={ctx} locale={locale}/>}<RoleMentorPanel ctx={ctx}/>
    {guideAvailable && <section className="v-home-module" aria-labelledby="home-guide"><div className="v-home-row"><div><h2 id="home-guide">{copy("Need help along the way?")}</h2><p className="v-muted">{copy("Ask a question or continue a saved conversation.")}</p></div><Link className="v-button" to="/dashboard/ask"><Sparkles size={18} aria-hidden="true"/>{copy("Ask Visionary Guide")}</Link></div></section>}
    {setupNote && <p className="v-home-empty">{setupNote}</p>}
    <p className="v-muted">{copy("Local preview · Saved on this device. No live model or cloud sync.")}</p>
  </div>;
}

function PlanSymbol({id}) {
  const kind = id.split(':')[0];
  const Icon = {classwork:ClipboardList,review:RotateCcw,unit:BookOpen,build:Hammer,done:CircleCheck,'done-build':CircleCheck}[kind] || BookOpen;
  return <Icon size={20} strokeWidth={1.75}/>;
}

function StageSuggestionEntry({ctx,locale}){const t=stageCopy(locale);let count=0;try{count=getStageSuggestions(ctx).length;}catch{return null;}return count>0?<section className="v-home-module" lang={locale}><h2 className="font-medium">{t("Stage suggestions · not applied")}</h2><p className="v-muted mt-2">{t("{count} suggestions to review. Your current stage is unchanged; evidence alone never moves you to a new stage.",{count})}</p><Link className="v-button mt-3" to="/dashboard/personalization">{t("Review stage suggestions")}</Link></section>:null;}
