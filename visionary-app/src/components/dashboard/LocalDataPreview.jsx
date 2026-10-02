import { useEffect, useState } from 'react';
import { inspectLocalMigration } from '@/services/localMigrationService';
import { downloadText } from '@/lib/downloadText';

export default function LocalDataPreview({ ctx }) {
 const [preview, setPreview] = useState(null);
 const [error, setError] = useState('');
 useEffect(() => {
  const invalidate = () => { setPreview(null); setError('Local data changed. Review again for current counts.'); };
  const events = ['storage', 'visionary:v2-change', 'visionary:workspace-change', 'visionary:plan-change', 'visionary:learning-change', 'visionary:mentor-change', 'visionary:community-change'];
  events.forEach(event => window.addEventListener(event, invalidate));
  setPreview(null); setError('');
  return () => events.forEach(event => window.removeEventListener(event, invalidate));
 }, [ctx.personId, ctx.workspaceId]);
 const review = () => {
  try { setPreview(inspectLocalMigration(ctx)); setError(''); }
  catch (cause) { setPreview(null); setError(cause.message || 'Local records could not be reviewed. Nothing was changed.'); }
 };
 const totals = preview?.workspaces.reduce((sum, workspace) => ({
  conversations: sum.conversations + workspace.counts.conversations,
  projects: sum.projects + workspace.counts.artifacts,
  learning: sum.learning + workspace.counts.learningUnits,
  evidence: sum.evidence + workspace.counts.evidence,
 }), { conversations: 0, projects: 0, learning: 0, evidence: 0 });
 return <section className="v-card" aria-labelledby="local-data-title">
  <h2 id="local-data-title" className="text-lg font-medium">What is saved on this device</h2>
  <p className="v-muted mt-2">Review your own local work before a future account transfer. This check does not upload, merge, or remove anything.</p>
  <button className="v-button mt-4" type="button" onClick={review}>Review local data</button>
  {error && <p className="v-notice v-error mt-4" role="alert">{error}</p>}
  {preview && <div className="mt-5" role="status">
   <p className="text-sm font-medium">{preview.workspaces.length} personal {preview.workspaces.length === 1 ? 'workspace' : 'workspaces'} found</p>
   <p className="v-muted mt-2">{totals.conversations} conversations · {totals.learning} learning activities · {totals.evidence} evidence records · {totals.projects} projects</p>
   {preview.blockers.length ? <div className="v-notice mt-4"><p className="font-medium">Some records need review before a future transfer.</p><ul className="mt-2 list-disc pl-5">{preview.blockers.map(reason => <li key={reason}>{reason}</li>)}</ul></div> : <p className="v-muted mt-3">Owned local records are identifiable. An authenticated backend and your confirmation will still be required before any transfer.</p>}
   {preview.relationshipsNeedingReconsent > 0 && <p className="v-muted mt-3">{preview.relationshipsNeedingReconsent} local {preview.relationshipsNeedingReconsent === 1 ? 'connection' : 'connections'} would require renewed permission; connections are not transferred automatically.</p>}
   {!!preview.additionalStoresNeedingReview?.length&&<p className="v-muted mt-3">Separate records awaiting ownership review: {preview.additionalStoresNeedingReview.join(', ')}. They remain on this device and are excluded from these counts.</p>}
   {!!preview.auxiliaryOwnership?.length && <section className="mt-5" aria-labelledby="auxiliary-review-title">
    <h3 id="auxiliary-review-title" className="text-base font-medium">Drafts and supporting records</h3>
    <p className="v-muted mt-2">Only counts are shown. Private questions, answers, feedback and draft text stay out of this report. Identifying an owner does not approve a transfer.</p>
    <ul className="mt-3 space-y-3">{preview.auxiliaryOwnership.map(item => <li className="rounded-xl border border-slate-200 p-3" key={item.label}>
     <h4 className="text-sm font-medium">{item.label}</h4>
     <p className="v-muted mt-2">{item.personalRecords} personal · {item.connectedRecords} connected · {item.unresolvedRecords} unresolved</p>
     <p className="v-muted mt-1">{item.unreadable ? 'Unreadable or incomplete records. Original bytes are retained; counts may be incomplete.' : item.unresolvedRecords ? 'Some records have no unambiguous scope. Keep them separate until ownership and permission review.' : item.requiresReview ? 'Ownership identified where possible. Source, version and permission review is still required.' : 'No records awaiting review in this account.'}</p>
    </li>)}</ul>
   </section>}
   <button className="v-button mt-4" type="button" onClick={() => {
    try { const current = inspectLocalMigration(ctx); setPreview(current); downloadText('visionary-local-ownership-review.json', JSON.stringify(current, null, 2), 'application/json'); setError(''); }
    catch (cause) { setPreview(null); setError(cause.message || 'The report could not be exported. Your records are unchanged.'); }
   }}>Export ownership counts report</button>
  </div>}
 </section>;
}
