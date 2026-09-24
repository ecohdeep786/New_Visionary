import { useState } from 'react';
import { inspectLocalMigration } from '@/services/localMigrationService';

export default function LocalDataPreview({ ctx }) {
 const [preview, setPreview] = useState(null);
 const [error, setError] = useState('');
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
  </div>}
 </section>;
}
