import { useEffect, useRef, useState } from 'react';
import { getContentRepository } from '@/services/contentRepository';
import { useWorkspace } from '@/hooks/useWorkspace';
import { guideCopy } from '@/lib/guideCopy';
const issueNames = { explanation: 'Explanation is missing or unclear', question: 'Question or answer has a problem', representation: 'Visual or text alternative has a problem', translation: 'Teaching language is missing or inaccurate', source: 'Source details have a problem' };

export default function ContentIssueReport({ ctx, concept, locale }) {
  const { data } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = guideCopy(interfaceLocale);
  const scopeRef=useRef('');scopeRef.current=ctx.personId+':'+ctx.workspaceId+':'+concept.id+':'+locale;
  const [kind, setKind] = useState(concept.languageUnavailable ? 'translation' : 'explanation');
  const [issues, setIssues] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {const scopeKey=ctx.personId+':'+ctx.workspaceId+':'+concept.id+':'+locale;scopeRef.current=scopeKey; setKind(concept.languageUnavailable ? 'translation' : 'explanation'); setMessage('');setError('');setBusy(false);return()=>{if(scopeRef.current===scopeKey)scopeRef.current='';}; }, [concept.id, ctx.personId, ctx.workspaceId, locale]);
  useEffect(() => {
    let live = true;
    setIssues([]);
    getContentRepository(ctx).getContentIssues().then(items => {
      if (live) { setIssues(items); setUnavailable(false); }
    }).catch(() => { if (live) { setIssues([]); setUnavailable(true); } });
    return () => { live = false; };
  }, [ctx.personId, ctx.workspaceId, retry]);
  async function save(event) {
    event.preventDefault();
    if (busy || unavailable) return;
    const requestScope=scopeRef.current;
    setBusy(true); setError(''); setMessage('');
    try {
      const repository = getContentRepository(ctx);
      const issue = await repository.reportIssue(concept.id, kind, locale);
      if(scopeRef.current!==requestScope)return;
      setMessage(issueNames[issue.kind]);
      try {const next=await repository.getContentIssues();if(scopeRef.current!==requestScope)return;setIssues(next);setUnavailable(false);}
      catch {if(scopeRef.current===requestScope){setIssues([]);setUnavailable(true);}}
    } catch (cause) {if(scopeRef.current===requestScope)setError(cause.message);}
    finally {if(scopeRef.current===requestScope)setBusy(false);}
  }
  const current = issues.filter(item => item.conceptId === concept.id && item.locale === locale);
  return <details lang={interfaceLocale} className="v-card" id="content-issue-report">
    <summary className="min-h-11 cursor-pointer font-medium">{copy('Report a content problem')}</summary>
    <p className="v-muted mt-3 text-sm">{copy('Choose a category. This report stays in this workspace on this device; no review team receives it yet.')}</p>
    <form className="mt-4 grid gap-3 sm:flex sm:items-end" onSubmit={save}>
      <label className="min-w-0 w-full text-sm sm:flex-1">{copy('What is the problem?')}<select aria-label={copy('What is the problem?')} className="v-field mt-2" value={kind} disabled={busy} onChange={event => setKind(event.target.value)}>{Object.entries(issueNames).map(([value, label]) => <option value={value} key={value}>{copy(label)}</option>)}</select></label>
      <button className="v-button justify-self-start" disabled={busy || unavailable}>{copy(busy ? 'Saving…' : 'Save issue locally')}</button>
    </form>
    {!unavailable && current.length > 0 && <p className="v-muted mt-3 text-sm">{copy('{count} issues saved for this concept and language on this device.', { count: current.length })}</p>}
    {message && <p className="v-notice mt-3" role="status">{copy("“{kind}” is saved on this device. It has not been sent to a content team.",{kind:copy(message)})}</p>}
    {unavailable && <p className="v-notice v-error mt-3" role="alert">{copy('Saved issue reports are unavailable. Existing reports have not been replaced.')} <button type="button" className="v-button" onClick={() => setRetry(value => value + 1)}>{copy('Retry')}</button></p>}
    {error && <p lang="en" className="v-notice v-error mt-3" role="alert">{error}</p>}
  </details>;
}
