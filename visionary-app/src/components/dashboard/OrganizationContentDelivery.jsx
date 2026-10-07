import { useWorkspace } from '@/hooks/useWorkspace';
import { connectionStatus } from '@/lib/connectionAvailability';
import { organizationAuthorCopy } from '@/lib/organizationAuthorCopy';
import { useState } from 'react';
import { organizationInvites, organizationAccess, deliverOrganizationContent, getOrganizationSettings } from '@/services/workspaceService';
export default function OrganizationContentDelivery({
  ctx,
  resource
}) {
  const {
    data
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(locale);
  const [, setRetry] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  let teachers = [],
    error,
    paused = false;
  try {
    const policy = organizationAccess(ctx);
    paused = !getOrganizationSettings(ctx).teacherDeliveryEnabled;
    teachers = organizationInvites(ctx).filter(row => row.organization_email === policy.organizationEmail && row.role === 'teacher' && connectionStatus(row) === 'active');
  } catch (cause) {
    error = cause.message;
  }
  function send() {
    try {
      deliverOrganizationContent(ctx, resource.id, resource.contentReview.revision, recipient);
      setNotice('Approved copy is available in this teacher’s Work preparation inbox on this browser. No email sent.');
      setFailed(false);
    } catch (cause) {
      setNotice(cause.message);
      setFailed(true);
    }
  }
  return <section lang={locale} className="v-card"><h2 className="text-base font-medium">{copy("Share approved copy with a teacher")}</h2><p className="v-muted mt-2">{copy("Only this saved revision is delivered. Later edits and review notes stay here. The teacher receives a draft to review before assigning.")}</p>{paused && <p role="status" className="v-notice mt-3">{copy("New teacher deliveries are paused by the organization owner. Existing copies and assignments remain available.")}</p>}{error ? <p role="alert" className="v-notice v-error" lang="en">{error} <button type="button" lang={locale} className="v-button mt-3" onClick={() => setRetry(value => value + 1)}>{copy("Retry")}</button></p> : teachers.length ? <><label className="mt-4 block text-sm">{copy("Accepted teacher")}<select aria-label={copy("Accepted teacher")} className="v-field mt-2" value={recipient} onChange={event => setRecipient(event.target.value)}><option value="">{copy("Choose a teacher")}</option>{teachers.map(row => <option key={row.id} value={row.email}>{row.email}</option>)}</select></label>{recipient && <div className="mt-4 text-sm"><p className="font-medium">{resource.title} · {copy('Revision {revision}', {
            revision: resource.contentReview.revision
          })}</p><p className="v-muted mt-2">{resource.contentReview.source} · {resource.contentReview.language}</p><p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap">{resource.body}</p></div>}<button className="v-button primary mt-4" disabled={!recipient || paused || !teachers.some(row => row.email === recipient)} onClick={send}>{copy("Confirm approved copy delivery")}</button></> : <p className="v-muted mt-3">{copy("An accepted teacher membership is required. Invite a teacher in People before sharing.")}</p>}{notice && <p className={`v-notice mt-4 ${failed ? 'v-error' : ''}`} lang={copy(notice) === notice ? 'en' : locale} role={failed ? 'alert' : 'status'}>{copy(notice)}</p>}{!!resource.contentReview.deliveries?.length && <p className="v-muted mt-3">{copy('{count} saved delivery copies across revisions. Revoked memberships cannot open their inbox copies.', {
        count: resource.contentReview.deliveries.length
      })}</p>}</section>;
}
