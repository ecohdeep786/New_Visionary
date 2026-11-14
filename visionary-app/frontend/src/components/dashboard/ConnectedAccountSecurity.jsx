import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { listAccountDevices } from '@/services/accountDevices';

const statusLabels = { active: 'Active', expired: 'Expired', revoked: 'Signed out', unknown: 'Status unknown' };

export default function ConnectedAccountSecurity({ accountId }) {
  const { account, logout } = useAuth();
  const canSignOutAll = account.auth_features?.global_sign_out === true;
  const [cursor, setCursor] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [commandError, setCommandError] = useState('');
  const inFlight = useRef(false);
  const revokeButton = useRef(null);
  const confirmButton = useRef(null);
  const query = useQuery({
    queryKey: ['account', accountId, 'devices', cursor],
    queryFn: () => listAccountDevices(accountId, cursor),
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
    gcTime: 0,
  });

  async function revokeSessions() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setCommandError('');
    try {
      await logout({ allDevices: true });
    } catch {
      setCommandError('Could not confirm sign-out on all devices. Check your connection and try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <section className="max-w-2xl rounded-2xl border bg-white p-6">
    <h1 className="text-2xl font-semibold">Account security</h1>
    <h2 className="mt-6 text-lg font-semibold">Browser sessions</h2>
    <p className="mt-2 text-slate-700">Review where your account has been signed in.</p>
    <button className="mt-3 min-h-11 rounded-lg border px-4" type="button" disabled={query.isFetching} onClick={() => query.refetch()}>Refresh sessions</button>
    {query.isFetching && <p className="mt-3" role="status">Checking account sessions…</p>}
    {query.isError && <p className="mt-3" role="alert">Could not check your account sessions. Try refreshing.</p>}
    {query.isSuccess && <>
      {query.data.items.length === 0 && <p className="mt-4">No sessions on this page.</p>}
      <ul className="mt-3 divide-y">
        {query.data.items.map(item => <li className="py-3" key={item.id}>
          <p className="font-medium">{item.current ? 'This browser' : 'Another browser'} · {statusLabels[item.status]}</p>
          {item.lastSeenAt && <p className="mt-1 text-sm text-slate-700">Last active <time dateTime={item.lastSeenAt}>{new Date(item.lastSeenAt).toLocaleString()}</time></p>}
        </li>)}
      </ul>
    </>}
    <div className="flex flex-wrap gap-2">
      {cursor && <button className="min-h-11 rounded-lg border px-4" type="button" onClick={() => setCursor(null)}>First page</button>}
      {query.isSuccess && query.data.nextCursor && <button className="min-h-11 rounded-lg border px-4" type="button" onClick={() => setCursor(query.data.nextCursor)}>Next page</button>}
    </div>
    {canSignOutAll && <div className="mt-6 border-t pt-4">
      <button ref={revokeButton} className="min-h-11 rounded-lg border px-4" type="button" aria-expanded={confirming}
        disabled={busy} onClick={() => {
          setConfirming(value => !value);
          setCommandError('');
          if (!confirming) requestAnimationFrame(() => confirmButton.current?.focus());
        }}>Sign out on all devices</button>
      {confirming && <div className="mt-3">
        <p>This ends your other sessions and signs you out of this browser.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button ref={confirmButton} className="min-h-11 rounded-lg bg-blue-700 px-4 text-white" type="button" disabled={busy} onClick={revokeSessions}>{busy ? 'Signing out…' : 'Confirm sign-out'}</button>
          <button className="min-h-11 rounded-lg border px-4" type="button" disabled={busy} onClick={() => { setConfirming(false); setCommandError(''); revokeButton.current?.focus(); }}>Cancel</button>
        </div>
        {commandError && <p className="mt-3" role="alert">{commandError}</p>}
      </div>}
    </div>}
  </section>;
}
