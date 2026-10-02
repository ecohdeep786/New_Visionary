import { useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getOrganizationAggregate } from '@/services/mentorStateService';

export default function OrganizationEvidencePanel() {
 const { ctx, error: workspaceError } = useWorkspace();
 const [days, setDays] = useState(7);
 const [, setRetry] = useState(0);
 let aggregate = null;
 let error = workspaceError || '';
 if (ctx && !error) try { aggregate = getOrganizationAggregate(ctx, days); }
 catch (failure) { error = failure.message; }
 return <section className="rounded-2xl border border-[#dadce0] bg-white p-5 sm:p-6" aria-labelledby="organization-evidence-title"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="organization-evidence-title" className="text-lg font-medium">Scoped learning evidence</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">Only recorded work from active learners in explicitly linked classes. Personal projects and conversations are excluded.</p></div><label className="text-sm">Evidence period<select className="v-field mt-2" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label></div>
  {!ctx && !error && <p role="status" className="mt-4 text-sm">Loading organization evidence…</p>}
  {error && <p role="alert" className="v-notice v-error mt-4">Evidence is unavailable: {error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
  {aggregate && <><p className="mt-4 text-sm">{aggregate.period}. Current linked-class denominator: {aggregate.learnerCount} active enrolled learner{aggregate.learnerCount === 1 ? '' : 's'}.</p><p className="mt-2 text-sm">{aggregate.periodContributors === null ? `Period participation is hidden below ${aggregate.minimumGroupSize} contributors.` : `${aggregate.periodContributors} learners contributed recorded evidence in this period.`}</p><p className="mt-2 text-sm">Current submissions awaiting review: {aggregate.pendingSubmissions ?? `hidden below ${aggregate.minimumGroupSize} enrolled learners`}. This operational count is current, not filtered by the evidence period.</p>
   {aggregate.suppressed && <p className="v-notice mt-4">Concept totals require at least {aggregate.minimumGroupSize} contributing learners in the selected period. Smaller groups are hidden.</p>}
   {aggregate.concepts.length ? <div className="mt-5 space-y-3">{aggregate.concepts.map((item, index) => <article className="rounded-xl border border-[#dadce0] p-4" key={item.conceptId}><h3 className="text-sm font-medium">Learning objective {index + 1}</h3><p className="mt-2 text-sm">{item.correct} of {item.total} recorded checks correct · {item.learners} contributors</p><p className="mt-1 text-sm text-[#5f6368]">{item.needsReview} review signals. These are recorded outcomes, not a ranking or ability score.</p><details className="mt-2 text-xs text-[#5f6368]"><summary className="cursor-pointer">Reference</summary><span className="break-all">{item.conceptId}</span></details></article>)}</div> : <p className="mt-4 text-sm text-[#5f6368]">No concept total is available for this period. This does not describe any learner’s ability.</p>}</>}
 </section>;
}
