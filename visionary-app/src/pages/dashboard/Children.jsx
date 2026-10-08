import WorkspaceEmptyState from '@/components/dashboard/WorkspaceEmptyState';
import { parentCopy } from '@/lib/parentCopy';
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
  revoked: 'Sharing was stopped. The learner’s own work remains theirs.'
};
export default function Children() {const scope=useWorkspace();return <ChildrenContent key={`${scope.ctx?.personId}:${scope.ctx?.workspaceId}`} scope={scope}/>;}
function ChildrenContent({scope}) {
  const {
    ctx,
    data,
    error,
    refresh
  } = scope;
  const locale = data?.preferences.interfaceLocale || 'en',
    t = parentCopy(locale);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  if (error) return <div className="v-page" lang={locale}><h1 className="v-title">{t('Family workspace unavailable')}</h1><p className="v-notice v-error" role="alert" lang="en">{error}</p><button className="v-button mt-4" onClick={refresh}>{t('Retry family workspace')}</button></div>;
  if (!ctx || !data) return <div className="v-page" role="status" lang={locale}>{t("Opening family workspace\u2026")}</div>;
  let relationships, shared;
  try {
    relationships = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.from === ctx.personId);
    shared = new Set(familyReports(ctx).map(report => report.id));
  } catch (failure) {
    return <div className="v-page" lang={locale}><h1 className="v-title">{t('Family workspace unavailable')}</h1><p className="v-notice v-error" role="alert" lang="en">{failure.message}</p><button className="v-button mt-4" onClick={refresh}>{t('Retry family workspace')}</button></div>;
  }
  const latest = new Map(relationships.map(row => [row.to, row.id]));
  function act(operation, success) {
    try {
      operation();
      setNotice(success);
      setNoticeError(false);
    } catch (failure) {
      setNotice(failure.message);
      setNoticeError(true);
    }
  }
  return <div className="v-page" lang={locale}>
  <header><h1 className="v-title">{t("Your children")}</h1><p className="v-muted mt-2">{t("A separate, permission-based connection for each learner.")}</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">{t("Request progress sharing")}</h2><p className="v-muted mt-3">{t("The learner\u2019s local account must accept before summaries appear. This preview does not verify guardianship. Do not enter real child information.")}</p><form className="mt-5 flex flex-wrap gap-3" onSubmit={event => {
        event.preventDefault();
        act(() => {
          requestRelationship(ctx, email, 'guardian');
          setEmail('');
        }, 'Local request saved. No email or verification service was contacted.');
      }}><label className="min-w-0 flex-1"><span className="sr-only">{t("Learner demo email")}</span><input type="email" className="v-field" required placeholder="learner@visionary.test" value={email} onChange={event => setEmail(event.target.value)} /></label><button className="v-button">{t("Request sharing")}</button></form></section>
  {notice && <p lang={noticeError?'en':locale} role={noticeError ? 'alert' : 'status'} className={`v-notice ${noticeError ? 'v-error' : ''}`}>{noticeError?notice:t(notice)}</p>}
  <section className="v-card"><h2 className="text-lg font-medium">{t("Connections and history")}</h2><p className="v-muted mt-2">{t("Only a currently accepted progress connection opens a report.")}</p>{relationships.length ? relationships.map(row => {
        const canView = row.status === 'active' && shared.has(row.to);
        const displayStatus = row.status === 'active' && !canView ? "restricted" : row.status;
        const canRenew = ['expired', 'declined', 'revoked'].includes(row.status) && latest.get(row.to) === row.id && !relationships.some(other => other.to === row.to && ['active', 'pending'].includes(other.status));
        return <article className="v-list-row" key={row.id}><div className="min-w-0"><h3 className="text-base font-medium break-words">{row.name}</h3><p className="v-muted mt-1">{displayStatus === 'restricted' ? t("Summary access unavailable") : row.status === 'active' ? t("Connected") : row.status === 'pending' ? t("Awaiting acceptance") : row.status === 'expired' ? t("Expired") : row.status === 'declined' ? t("Declined") : row.status === 'unavailable' ? t("Unavailable \xB7 unreadable expiry") : t("Stopped")} · {t("Progress summaries only")}</p><p className="v-muted mt-1">{t(displayStatus === 'restricted' ? "This connection does not provide a progress summary. Review sharing permissions." : descriptions[row.status] || 'This connection is closed.')}</p>{typeof row.expiresAt === 'string' && row.expiresAt.trim() && Number.isFinite(Date.parse(row.expiresAt)) && <p className="v-muted mt-1">{row.status === 'expired' ? t("Expired") : t("Request expires")}{t(":")}<time dateTime={row.expiresAt}>{new Date(row.expiresAt).toLocaleDateString(locale)}</time></p>}</div><div className="flex flex-wrap gap-2">{canView && <Link className="v-button" to={`/dashboard/reports?child=${encodeURIComponent(row.to)}`}>{t("View report")}</Link>}{['active', 'pending', 'unavailable'].includes(row.status) && <button className="v-button" onClick={() => act(() => changeRelationship(ctx, row.id, 'revoked'), row.status === 'pending' ? 'Request cancelled.' : 'Sharing stopped. The learner’s own work is retained.')}>{row.status === 'unavailable' ? t("Close unavailable connection") : row.status === 'pending' ? t("Cancel request") : t("Stop sharing")}</button>}{canRenew && <button className="v-button" onClick={() => act(() => renewGuardianRelationship(ctx, row.id), 'New local request saved. The learner must accept it before a report is available.')}>{t("Request again")}</button>}</div></article>;
      }) : <WorkspaceEmptyState illustration="handshake" title={t("No connected learners yet.")} description={t("No connected learners yet. Personal conversations, project drafts, and billing membership are never included in progress access.")} />}</section>
  <Link className="text-sm text-[#4285F4] underline" to="/dashboard/connections">{t("Review all connection history")}</Link>
 </div>;
}
