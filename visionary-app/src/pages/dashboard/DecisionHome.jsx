import SpotIllustration from '@/components/landing/SpotIllustration';
import {homeCopy} from '@/lib/homeCopy';
import {currentPlanDeferralLabel, homePlanPresentation, planDeferralFailureHelp} from '@/lib/homeEngagement';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {stageCopy} from '@/lib/stageCopy';
import StageChangeDetails from '@/components/dashboard/StageChangeDetails';
import { useEffect, useRef, useState } from 'react';
import HomeFeedback from '@/components/dashboard/HomeFeedback';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CircleCheck, ClipboardList, Hammer, MoreHorizontal, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [planNotice,setPlanNotice]=useState('');
  const nextStepHeading = useRef(null);
  const focusAfterPlanChange = useRef(false);
  const [,setNoticeRevision] = useState(0);
  // Permission changes must not retain a previously authorized child summary while refetching.
  const query = useQuery({queryKey:['home',ctx?.personId,ctx?.workspaceId,ctx?.locale,revision],queryFn:({signal})=>getHome({...ctx,signal}),enabled:!!ctx,retry:false,gcTime:0});
  useEffect(() => {
    if (query.data && focusAfterPlanChange.current) {
      nextStepHeading.current?.focus();
      focusAfterPlanChange.current = false;
    }
  }, [query.data]);
  useEffect(() => { setPlanNotice(''); setPlanError(''); focusAfterPlanChange.current = false; }, [ctx?.workspaceId]);
  if (workspaceError || query.error) return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Your next step is unavailable")}</h1><p className="v-notice v-error" role="alert" lang="en">{workspaceError || query.error.message}</p><div className="v-home-actions"><button className="v-button" onClick={()=>query.refetch()}>{copy("Retry")}</button>{guideAvailable && <Link className="v-button" to="/dashboard/ask">{copy("Open saved conversations")}</Link>}</div></div>;
  if (!query.data) return <div className="v-page" role="status" aria-busy="true" lang={locale}>{copy("Preparing your next step…")}</div>;
  const {name,workspace,boundary,priority,modules,setupNote,observations,memoryEnabled} = query.data;
  const homePlan = homePlanPresentation(modules, priority);
  function postponePlanStep(stepId) {
    try { deferPlanStep(ctx,stepId); setPlanError(''); setPlanNotice(copy('Removed from today’s plan. Your saved work is kept.')); focusAfterPlanChange.current = true; }
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
    <header className="v-home-header"><div><p className="v-home-eyebrow">{workspace}</p><h1 className="v-title">{copy('Welcome back, {name}.',{name})}</h1></div><span className="v-home-local-label">{copy("Local preview")}</span></header>
    {query.isFetching && <p className="v-muted" role="status">{copy("Updating your next step…")}</p>}
    <section className={`v-home-priority ${priority.empty ? 'v-home-first-step' : ''}`} aria-labelledby="next-step-title" data-role={ctx.role}>
      <div className="v-home-priority-copy">
        <p className="v-home-priority-label">{copy("Next for you")}</p>
        <h2 id="next-step-title" ref={nextStepHeading} tabIndex={-1} lang={priority.titleLocale||locale}>{priority.title}</h2>
        <div className="v-home-actions v-home-current-controls">
          <Link className="v-button primary" to={priority.action.path}>{priority.action.label}<ArrowRight size={18} aria-hidden="true"/></Link>
          {!priority.empty && <Link className="v-home-secondary" to={priority.alternative.path}>{priority.alternative.label}</Link>}
        </div>
        <details className="v-home-reason"><summary>{copy("Details and options")}</summary><p>{priority.detail}</p><p>{priority.reason}</p><p>{priority.source}{priority.updatedAt && <> · <time dateTime={priority.updatedAt}>{new Date(priority.updatedAt).toLocaleDateString(locale)}</time></>}</p>{priority.empty && <Link className="v-home-secondary" to={priority.alternative.path}>{priority.alternative.label}</Link>}{homePlan.currentStep && <button type="button" className="v-button v-home-defer" onClick={() => postponePlanStep(homePlan.currentStep.deferId)}>{currentPlanDeferralLabel(locale)}</button>}</details>
      </div>
      {priority.empty && <SpotIllustration subject={{student:"learn",teacher:"document",parent:"handshake",professional:"briefcase",organization:"community"}[ctx.role] || "compass"} className="v-home-priority-art" />}
    </section>
    {transitionReadError && <div className="v-notice v-error" role="alert">{t("Your stage notice could not be loaded:")} <span lang="en">{transitionReadError}</span><button className="v-button ml-3" onClick={() => setNoticeRevision(n => n + 1)}>{t("Retry notice")}</button></div>}
    {transition && <section className="v-home-module" aria-labelledby="stage-transition-title" lang={locale}><p className="v-home-priority-label">{t("Your stage")}</p><h2 id="stage-transition-title">{t(transition.state === 'awaiting-confirm' ? 'Confirm your new stage' : transition.state==='postponed'?'Stage change postponed':'Your stage changed')}</h2><p className="v-muted">{t(transition.state==='applied'?'Now':'Current')}: {(transition.state==='applied'?transition.to:transition.from).classLevel || t('not set')}{(transition.state==='applied'?transition.to:transition.from).board ? ` · ${(transition.state==='applied'?transition.to:transition.from).board}` : ''} · {t("{plans} plan steps and {units} learning activities kept",{plans:transition.diff.planStepsKept,units:transition.diff.unitsKept})}{transition.diff.openClassworkKept ? ` · ${t("{count} open classwork items",{count:transition.diff.openClassworkKept})}` : ''}{t("Due dates are retained.")}</p>{transition.state === 'awaiting-confirm' && <div className="v-home-actions"><button type="button" className="v-button primary" onClick={() => changeTransition(() => confirmStageTransition(ctx, transition.id))}>{t("Confirm")}</button></div>}{transition.state === 'applied' && <div className="v-home-actions"><button type="button" className="v-button" onClick={() => changeTransition(() => undoStageTransition(ctx, transition.id))}>{t("Undo this change")}</button><button type="button" className="v-button" onClick={() => changeTransition(() => postponeStageTransition(ctx, transition.id))}>{t("Postpone 7 days")}</button></div>}{transition.state === 'postponed' && <p className="v-muted">{t('Reevaluation scheduled for {date}.',{date:transition.postponedUntil ? new Date(transition.postponedUntil).toLocaleDateString(locale) : ''})}</p>}<StageChangeDetails key={`${ctx.workspaceId}:${transition.id}:${transition.state}`} ctx={ctx} transition={transition} locale={workspaceData?.preferences.interfaceLocale||'en'}/>{transitionError && <p className="v-notice v-error mt-3" role="alert"><span lang="en">{transitionError}</span> {t("Your saved work is kept. Retry this action after checking your browser storage.")}</p>}</section>}
    {planError&&<p role="alert" className="v-notice v-error"><span lang="en">{planError}</span> {planDeferralFailureHelp(locale)}</p>}
    {homePlan.modules.length > 0 && <div className="v-home-modules">{homePlan.modules.map(module => <section className="v-home-module" key={module.id} aria-labelledby={`home-${module.id}`}>
      <h2 id={`home-${module.id}`} className="v-home-plan-title">{module.title}</h2>
      {module.rows.map(row => <div className={`v-home-row ${module.id === 'daily-plan' ? 'v-home-plan-row' : ''}`} key={row.id}>
        <div className="v-home-row-copy">
          {module.id === 'daily-plan' && <span className="v-home-plan-symbol" aria-hidden="true" data-kind={row.id.split(':')[0]}><PlanSymbol id={row.id}/></span>}
          <div><Link className="v-home-row-title" to={row.action.path} lang={row.titleLocale || undefined}>{row.title}</Link></div>
        </div>
        <div className="flex items-center gap-2 v-home-plan-actions">
          <span className="v-home-row-meta">{row.status || row.action.label}</span>
          <Popover><PopoverTrigger asChild><button type="button" className="v-home-more" aria-label={copy('Details and actions for {title}',{title:row.title})}><MoreHorizontal size={20} aria-hidden="true"/></button></PopoverTrigger><PopoverContent className="v-home-row-options" align="end" aria-label={copy('Details and actions for {title}',{title:row.title})}><h3 lang={row.titleLocale || undefined}>{row.title}</h3><p>{row.detail}</p><Link className="v-button" to={row.action.path}>{row.action.label}</Link>{row.deferId && <button type="button" className="v-button" onClick={() => postponePlanStep(row.deferId)}>{currentPlanDeferralLabel(locale)}</button>}</PopoverContent></Popover>
        </div>
      </div>)}
    </section>)}</div>}
    {ctx.role==='student'&&<details className="v-home-module v-home-memory"><summary>{copy("Things I remember about you")}</summary><p className="v-muted">{copy("Only from your saved activity this week. These are observations, not an AI assessment.")}</p>{observations?.length?<ul className="mt-3 space-y-2">{observations.map(item=><li key={item.id} className="text-sm" lang="en">{item.text}</li>)}</ul>:<p className="v-muted mt-3">{copy(memoryEnabled?'No weekly observations yet. Start a learning unit or practice step to build your own history.':'Learning memory is off for this workspace. You can change it in Personalization.')}</p>}<Link className="v-button mt-4" to="/dashboard/privacy">{copy("View or clear memory")}</Link></details>}
    {['student','professional'].includes(ctx.role)&&<StageSuggestionEntry ctx={ctx} locale={locale}/>}<RoleMentorPanel ctx={ctx} locale={locale}/>
    <footer className="v-home-support">{guideAvailable && <Link className="v-home-guide-link" to="/dashboard/ask">{copy("Ask Visionary Guide")}<ArrowRight size={16} aria-hidden="true"/></Link>}<details className="v-home-reason"><summary>{copy("About this workspace")}</summary><p>{boundary}</p>{setupNote && <p>{setupNote}</p>}<p>{copy("Local preview · Saved on this device. No live model or cloud sync.")}</p>{['student','professional'].includes(ctx.role)&&<StagePresentationSummary presentation={presentation} locale={locale}/>}</details></footer>
    <HomeFeedback message={planNotice} onDismiss={setPlanNotice} locale={locale}/>
  </div>;
}

function PlanSymbol({id}) {
  const kind = id.split(':')[0];
  const Icon = {classwork:ClipboardList,review:RotateCcw,unit:BookOpen,build:Hammer,done:CircleCheck,'done-build':CircleCheck}[kind] || BookOpen;
  return <Icon size={20} strokeWidth={1.75}/>;
}

function StageSuggestionEntry({ctx,locale}){const t=stageCopy(locale);let count=0;try{count=getStageSuggestions(ctx).length;}catch{return null;}return count>0?<section className="v-home-module" lang={locale}><h2 className="font-medium">{t("Stage suggestions · not applied")}</h2><p className="v-muted mt-2">{t("{count} suggestions to review. Your current stage is unchanged; evidence alone never moves you to a new stage.",{count})}</p><Link className="v-button mt-3" to="/dashboard/personalization">{t("Review stage suggestions")}</Link></section>:null;}
