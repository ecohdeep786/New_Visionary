import { useEffect, useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { coverageCategoryLabels, coverageCopy } from '@/lib/coverageCopy';
import { createCoverageClient } from '@/services/coverageClient';

export default function CoverageAvailability() {
  const { account, activeWorkspace } = useAuth();
  const { data } = useWorkspace();
  const locale = data?.preferences?.interfaceLocale || 'en', copy = coverageCopy(locale);
  const [state, setState] = useState({ key: '', status: 'loading', value: null });
  const [retry, setRetry] = useState(0);
  const key = `${account?.id || ''}:${account?.profile_version ?? ''}:${activeWorkspace?.id || ''}`;
  const client = useMemo(() => createCoverageClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id }), []);
  useEffect(() => {
    if (!account?.id || appClient.auth.source !== 'firebase') return;
    let active = true, sequence = 0, expiry;
    async function refresh() {
      if (document.hidden) return;
      const request = ++sequence;
      clearTimeout(expiry);
      setState({ key, status: 'loading', value: null });
      try {
        const value = await client.snapshot();
        if (!active || request !== sequence) return;
        if (value.profileVersion !== account.profile_version) throw Error('Account changed');
        setState({ key, status: 'ready', value });
        // Expire locally rather than keeping an idle Cloud Run instance active
        // with background polling. Focus/reconnect/explicit retry reads afresh.
        expiry = setTimeout(() => { if (active && request === sequence) setState({ key, status: 'expired', value: null }); }, Math.max(1, Date.parse(value.expiresAt) - Date.now()));
      } catch {
        if (active && request === sequence) setState({ key, status: 'error', value: null });
      }
    }
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; ++sequence; clearTimeout(expiry); client.invalidate(); window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [account?.id, account?.profile_version, key, client, retry]);
  if (!account?.id || appClient.auth.source !== 'firebase') return null;
  const shown = state.key === key ? state : { status: 'loading', value: null };
  const value = shown.value;
  // The existing workspace bootstrap presents adult independent students in
  // the Professional workspace; that label is not a linked-person switch.
  const currentWorkspaceRole = value?.current?.role === 'student' && value.current.stage === 'professional' ? 'professional' : value?.current?.role;
  const message = value?.reason === 'verified-guardian-admission-required' ? 'Verified guardian admission is required. Choosing an age or role does not activate access.' :
    value && activeWorkspace?.role !== currentWorkspaceRole ? 'Shared learning needs a verified connection. Your personal account does not grant access to another person’s learning.' :
    value?.reason === 'verified-linked-role-required' ? 'Shared learning needs a verified connection. Your personal account does not grant access to another person’s learning.' :
    value?.reason === 'account-setup-required' ? 'This account needs setup before learning coverage can be checked.' :
    value?.catalogRevision === null ? 'Learning sources have not been released for this context yet. Saved work and account features remain available.' :
    'Each source, edition, language and delivery mode needs its own coverage check. A listed category is not a support promise.';
  return <section lang={locale} aria-label={copy('Learning coverage')} data-learning-coverage className="mx-5 mt-5 rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-4 text-sm sm:mx-8">
    <h2 className="font-medium text-[#202124]">{copy('Learning coverage')}</h2>
    {shown.status === 'loading' ? <p role="status" className="mt-2 text-[#5f6368]">{copy('Checking learning coverage…')}</p> : ['error', 'expired'].includes(shown.status) ?
      <div className="mt-2"><p role={shown.status === 'error' ? 'alert' : 'status'}>{copy(shown.status === 'error' ? 'Learning coverage is unavailable. Your selections are unchanged.' : 'Refresh learning coverage to see its current status.')}</p><button type="button" className="mt-2 rounded-full border border-[#dadce0] px-4 py-2 text-[#0b57d0]" onClick={() => setRetry(value => value + 1)}>{copy('Retry coverage')}</button></div> :
      <><p role="status" className="mt-2 leading-6 text-[#5f6368]">{copy(message)}</p><details className="mt-3"><summary className="cursor-pointer py-2 text-[#0b57d0]">{copy('See all learning categories')}</summary><ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{value.categories.map(row => <li key={row.id} className="rounded-lg border border-[#dadce0] bg-white p-3"><p className="font-medium">{copy(coverageCategoryLabels[row.id])}</p><p className="mt-1 text-xs text-[#5f6368]">{copy(row.qualifiedSlices ? 'Exact source check required' : 'No qualified sources published')}</p></li>)}</ul></details></>}
  </section>;
}
