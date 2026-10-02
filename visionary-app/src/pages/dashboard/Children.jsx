import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/hooks/useWorkspace';
import { changeRelationship, familyReports, renewGuardianRelationship, requestRelationship, visibleRelationships } from '@/services/workspaceService';

const descriptions = {
 unavailable: 'The saved expiry is unreadable. No report is available. Close this record before requesting sharing again.',
 pending: 'Waiting for the learner to accept. No report is available yet.',
 active: 'The learner accepted progress-summary sharing. Private conversations and drafts stay private.',
 declined: 'The learner declined this request. No report is available.',
 expired: 'This sharing request or permission expired. A new request needs learner acceptance.',
 revoked: 'Sharing was stopped. The learner’s own work remains theirs.',
};

export default function Children() {
 const { ctx, data, error } = useWorkspace();
 const [email, setEmail] = useState('');
 const [notice, setNotice] = useState('');
 const [noticeError, setNoticeError] = useState(false);
 if (error) return <div className="v-page" role="alert">{error}</div>;
 if (!ctx || !data) return <div className="v-page" role="status">Opening family workspace…</div>;
 const relationships = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.from === ctx.personId);
 const shared = new Set(familyReports(ctx).map(report => report.id));
 const latest = new Map(relationships.map(row => [row.to, row.id]));
 function act(operation, success) {
  try { operation(); setNotice(success); setNoticeError(false); }
  catch (failure) { setNotice(failure.message); setNoticeError(true); }
 }
 return <div className="v-page">
  <header><h1 className="v-title">Your children</h1><p className="v-muted mt-2">A separate, permission-based connection for each learner.</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">Request progress sharing</h2><p className="v-muted mt-3">The learner’s local account must accept before summaries appear. This preview does not verify guardianship. Do not enter real child information.</p><form className="mt-5 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); act(() => { requestRelationship(ctx, email, 'guardian'); setEmail(''); }, 'Local request saved. No email or verification service was contacted.'); }}><label className="min-w-0 flex-1"><span className="sr-only">Learner demo email</span><input type="email" className="v-field" required placeholder="learner@visionary.test" value={email} onChange={event => setEmail(event.target.value)} /></label><button className="v-button">Request sharing</button></form></section>
  {notice && <p role={noticeError ? 'alert' : 'status'} className={`v-notice ${noticeError ? 'v-error' : ''}`}>{notice}</p>}
  <section className="v-card"><h2 className="text-lg font-medium">Connections and history</h2><p className="v-muted mt-2">Only a currently accepted progress connection opens a report.</p>{relationships.length ? relationships.map(row => {
   const canView = row.status === 'active' && shared.has(row.to);
   const canRenew = ['expired', 'declined', 'revoked'].includes(row.status) && latest.get(row.to) === row.id && !relationships.some(other => other.to === row.to && ['active', 'pending'].includes(other.status));
   return <article className="v-list-row" key={row.id}><div className="min-w-0"><h3 className="text-base font-medium break-words">{row.name}</h3><p className="v-muted mt-1">{row.status === 'active' ? 'Connected' : row.status === 'pending' ? 'Awaiting acceptance' : row.status === 'expired' ? 'Expired' : row.status === 'declined' ? 'Declined' : row.status === 'unavailable' ? 'Unavailable · unreadable expiry' : 'Stopped'} · Progress summaries only</p><p className="v-muted mt-1">{descriptions[row.status] || 'This connection is closed.'}</p>{typeof row.expiresAt === 'string' && row.expiresAt.trim() && Number.isFinite(Date.parse(row.expiresAt)) && <p className="v-muted mt-1">{row.status === 'expired' ? 'Expired' : 'Request expires'}: <time dateTime={row.expiresAt}>{new Date(row.expiresAt).toLocaleDateString()}</time></p>}</div><div className="flex flex-wrap gap-2">{canView && <Link className="v-button" to={`/dashboard/reports?child=${encodeURIComponent(row.to)}`}>View report</Link>}{['active', 'pending', 'unavailable'].includes(row.status) && <button className="v-button" onClick={() => act(() => changeRelationship(ctx, row.id, 'revoked'), row.status === 'pending' ? 'Request cancelled.' : 'Sharing stopped. The learner’s own work is retained.')}>{row.status === 'unavailable' ? 'Close unavailable connection' : row.status === 'pending' ? 'Cancel request' : 'Stop sharing'}</button>}{canRenew && <button className="v-button" onClick={() => act(() => renewGuardianRelationship(ctx, row.id), 'New local request saved. The learner must accept it before a report is available.')}>Request again</button>}</div></article>;
  }) : <p className="v-muted mt-4">No connected learners yet. Personal conversations, project drafts, and billing membership are never included in progress access.</p>}</section>
  <Link className="text-sm text-[#4285F4] underline" to="/dashboard/connections">Review all connection history</Link>
 </div>;
}
