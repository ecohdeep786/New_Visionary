import {useState} from 'react';
import {Link} from 'react-router-dom';
import {getCurriculumBridge} from '@/services/curriculumBridgeService';
import {stageCopy} from '@/lib/stageCopy';

export default function CurriculumBridgePlan({ctx,transitionId,locale='en'}){
 const t=stageCopy(locale);
 const [plan,setPlan]=useState(null),[error,setError]=useState('');
 function load(){try{setPlan(getCurriculumBridge(ctx,transitionId));setError('');}catch(failure){setPlan(null);setError(failure.message);}}
 return <section className="mt-4" lang={locale}>
  <button className="v-button" onClick={load}>{t(plan?'Refresh sourced bridge guidance':'Load available bridge guidance')}</button>
  {error&&<p role="alert" className="v-notice v-error mt-3" lang="en">{error}</p>}
  {plan&&<div className="mt-4 space-y-4">
   <p className="v-muted">{t('{count} reviewed equivalent mappings. This plan preserves original evidence and review dates; it does not score or transfer mastery.',{count:plan.mappingCount})}</p>
   {plan.missingSubjects.length>0&&<p role="status" className="v-notice">{t('Reviewed content in this teaching language is unavailable for: {subjects}. Load a sourced outline when it is available, then refresh this guidance.',{subjects:plan.missingSubjects.join(', ')})}</p>}
   {!plan.canStart&&<p className="v-muted">{t('New-stage activities are available after this stage change is active.')}</p>}
   {plan.rows.map(row=><div className="rounded-xl border border-slate-200 p-3" key={row.unitId}>
    <h4 className="font-medium">{row.title}</h4>
    <p className="mt-2 text-sm">{row.status==='equivalent'?<>{t('Reviewed equivalent:')} {row.target.title}</>:t(row.status==='current'?'Already in this curriculum':row.status==='archive'?'Archived from the new curriculum · resume anytime':'Mapping needs review')}</p>
    <p className="v-muted mt-2" lang={t(row.reason)===row.reason?'en':locale}>{t(row.reason)}</p>
    {row.reviewedAt&&<p className="v-muted mt-2">{t('Mapping reviewed')} {new Date(row.reviewedAt).toLocaleDateString(locale)} · {row.source?.provider} · {t('version')} {row.source?.version}</p>}
    <Link className="v-button mt-2" to={row.originalPath}>{t('Resume original activity')}<span className="sr-only">: {row.title}</span></Link>
   </div>)}
   {plan.targets.map(target=><div className="rounded-xl border border-slate-200 p-3" key={`${target.subject}:${target.id}`}>
    <h4 className="font-medium">{target.title}</h4><p className="v-muted mt-2">{target.subject} · {target.source?.provider} · {t('version')} {target.source?.version}</p>
    {target.prerequisites.length?<ul className="mt-3 list-disc space-y-2 pl-5">{target.prerequisites.map(item=><li key={item.id}>{item.title}: {t(item.priorReadiness?'Prior recorded readiness on a reviewed equivalent; no new assessment':item.available?'Review this sourced prerequisite before the objective':'Guidance unavailable; source review needed')}</li>)}</ul>:<p className="v-muted mt-2">{t('No prerequisites declared by this source.')}</p>}
    {plan.canStart&&<Link className="v-button mt-3" to={target.path}>{t('Explore sourced objective')}<span className="sr-only">: {target.title}</span></Link>}
   </div>)}
  </div>}
 </section>;
}
