import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listSavedLearning } from '@/services/connectedLearning';

export default function ConnectedLearningHistory({ accountId }) {
  const [after, setAfter] = useState(null);
  const query = useQuery({
    queryKey: ['account', accountId, 'saved-learning', after],
    queryFn: () => listSavedLearning(accountId, { after }),
    refetchInterval: 30000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchOnMount: 'always',
    retry: false,
    gcTime: 0,
  });
  // A changed/expired account invalidates the current view.
  const denied = [401, 403, 409].includes(query.error?.status);
  useEffect(() => {
    if (after && query.data?.items.length === 0) setAfter(null);
  }, [after, query.data]);
  const items = denied ? [] : query.data?.items || [];
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  return <section aria-labelledby="saved-learning-heading" className="rounded-2xl border bg-white p-6">
    <h1 id="saved-learning-heading" className="text-2xl font-semibold">Saved learning</h1>
    <p className="mt-2 text-slate-700">These sessions come from your account. They refresh while this page is open.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button className="min-h-11 rounded-lg border px-4 disabled:opacity-60" type="button" disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? 'Checking…' : 'Refresh sessions'}</button>
      {after && <button className="min-h-11 rounded-lg border px-4" type="button" onClick={() => setAfter(null)}>First page</button>}
    </div>
    {query.isPending && <p role="status" className="mt-4">Checking your saved sessions…</p>}
    {query.isError && <p role="alert" className="mt-4 text-[#b3261e]">{denied ? 'Your session changed. Sign in again to see your learning history.' : items.length ? 'Could not refresh. The sessions below are from the last successful check.' : 'Saved learning could not be loaded. Check your connection and retry.'}</p>}
    {query.isSuccess && items.length === 0 && <p className="mt-4">There are no saved learning sessions for this account yet.</p>}
    {items.length > 0 && <ul className="mt-4 divide-y">
      {items.map(item => <li className="py-4" key={item.id}>
        <p className="font-medium break-words">{item.concept}</p>
        <p className="mt-1 text-sm text-slate-700">{item.status === 'cancelled' ? 'Closed' : item.phase === 'check_passed' ? 'Check passed' : item.phase === 'review_suggested' ? 'Review suggested' : 'In progress'} · <time dateTime={item.updatedAt}>{formatter.format(new Date(item.updatedAt))}</time></p>
      </li>)}
    </ul>}
    {!denied && query.data?.nextCursor && <button className="mt-4 min-h-11 rounded-lg border px-4" type="button" onClick={() => setAfter(query.data.nextCursor)}>Next page</button>}
  </section>;
}
