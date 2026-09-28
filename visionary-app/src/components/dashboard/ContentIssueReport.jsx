import { useEffect, useState } from 'react';
import { getContentRepository } from '@/services/contentRepository';

const issueNames = {
 explanation: 'Explanation is missing or unclear',
 question: 'Question or answer has a problem',
 representation: 'Visual or text alternative has a problem',
 translation: 'Teaching language is missing or inaccurate',
 source: 'Source details have a problem',
};

export default function ContentIssueReport({ ctx, concept, locale }) {
 const [kind, setKind] = useState(concept.languageUnavailable ? 'translation' : 'explanation');
 const [issues, setIssues] = useState([]);
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState('');
 const [error, setError] = useState('');

 useEffect(() => {
  let live = true;
  getContentRepository(ctx).getContentIssues().then(items => { if (live) setIssues(items); }).catch(() => { if (live) setError('Saved reports could not be loaded. You can retry by reopening this section.'); });
  return () => { live = false; };
 }, [ctx?.workspaceId]);

 async function save(event) {
  event.preventDefault(); setBusy(true); setError(''); setMessage('');
  try {
   const repository = getContentRepository(ctx);
   const issue = await repository.reportIssue(concept.id, kind, locale);
   setIssues(await repository.getContentIssues());
   setMessage(`“${issueNames[issue.kind]}” is saved on this device. It has not been sent to a content team.`);
  } catch (cause) { setError(cause.message); }
  finally { setBusy(false); }
 }

 const current = issues.filter(item => item.conceptId === concept.id && item.locale === locale);
 return <details className="v-card" id="content-issue-report">
  <summary className="cursor-pointer font-medium">Report a content problem</summary>
  <p className="v-muted mt-3 text-sm">Choose a category. This report stays in this workspace on this device; no review team receives it yet.</p>
  <form className="mt-4 grid gap-3 sm:flex sm:items-end" onSubmit={save}>
   <label className="min-w-0 w-full text-sm sm:flex-1">What is the problem?
    <select className="v-field mt-2" value={kind} disabled={busy} onChange={event => setKind(event.target.value)}>{Object.entries(issueNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
   </label>
   <button className="v-button justify-self-start" disabled={busy}>{busy ? 'Saving…' : 'Save issue locally'}</button>
  </form>
  {current.length > 0 && <p className="v-muted mt-3 text-sm">{current.length} {current.length === 1 ? 'issue' : 'issues'} saved for this concept and language on this device.</p>}
  {message && <p className="v-notice mt-3" role="status">{message}</p>}
  {error && <p className="v-notice v-error mt-3" role="alert">{error}</p>}
 </details>;
}
