import { useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationAudit } from '@/services/workspaceService';

export default function OrganizationAudit({ ctx }) {
 const [days, setDays] = useState(30);
 const [source, setSource] = useState('all');
 const [, setRetry] = useState(0);
 let view; let error = '';
 try { view = organizationAudit(ctx, days); } catch (failure) { error = failure.message; }
 const rows = view?.entries.filter(row => source === 'all' || row.source === source) || [];
 return <div className="v-page"><header><h1 className="v-title">Organization audit</h1><p className="v-muted mt-2">Saved membership actions and changes in this organization workspace. This history is stored on this device.</p></header>
  <div className="flex flex-wrap gap-4"><label className="text-sm">Period<select aria-label="Period" className="v-field mt-2" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label><label className="text-sm">Action source<select aria-label="Action source" className="v-field mt-2" value={source} onChange={event => setSource(event.target.value)}><option value="all">All sources</option><option value="membership">Membership</option><option value="workspace">Workspace changes</option><option value="classwork">Classwork states</option><option value="transition">Teacher promotions</option></select></label></div>
  {error && <p role="alert" className="v-notice v-error">Audit unavailable: {error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
  {view && <>{view.unavailableSources.length > 0 && <p role="alert" className="v-notice">Partial history: {view.unavailableSources.join(', ')} could not be read. Available workspace changes remain below. <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry history</button></p>}{view.importedWithoutHistory > 0 && <p className="v-notice">{view.importedWithoutHistory} imported invitation{view.importedWithoutHistory === 1 ? ' has' : 's have'} incomplete earlier history. Current membership status is available in <Link className="underline" to="/dashboard/people">People</Link>.</p>}
   <p className="v-muted">{view.period} · {rows.length} recorded action{rows.length === 1 ? '' : 's'} in the selected source.</p>
   {view.classworkWithoutHistory>0&&<p className="v-notice mt-3">{view.classworkWithoutHistory} older class activit{view.classworkWithoutHistory===1?'y has':'ies have'} no recorded state history. Earlier actions and actors have not been reconstructed.</p>}
   {rows.length ? <ol className="space-y-3">{rows.map(row => <li className="v-card" key={row.id}><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-medium">{({membership:'Membership',workspace:'Workspace',classwork:'Classwork',transition:'Teacher promotion'})[row.source]} · {row.action}</p><time className="text-xs text-[#5f6368]" dateTime={row.at}>{new Date(row.at).toLocaleString()}</time></div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-[#5f6368]">Target</dt><dd className="break-all">{row.target}</dd></div><div><dt className="text-xs text-[#5f6368]">Actor</dt><dd className="break-all">{row.actor || 'Not recorded by this source'}</dd></div><div><dt className="text-xs text-[#5f6368]">Outcome</dt><dd>{row.outcome}</dd></div></dl></li>)}</ol> : <div className="v-card"><p>No recorded actions match this period and source.</p>{source !== 'all' && <button className="v-button mt-3" onClick={() => setSource('all')}>Show all sources</button>}<Link className="mt-3 block text-sm underline" to="/dashboard/people">Review people and connections</Link></div>}
  </>}
  <p className="v-muted text-xs">This local record is editable browser data. Promotion rows summarize explicitly scoped teacher actions and current notice states; they do not expose learner profiles or reconstruct earlier unscoped actions. Production audit retention and integrity require the later server implementation.</p>
 </div>;
}
