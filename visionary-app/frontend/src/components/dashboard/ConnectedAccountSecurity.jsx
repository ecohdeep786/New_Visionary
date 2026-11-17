import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { listAccountDevices } from '@/services/accountDevices';
import { useConnectedWorkspace } from '@/hooks/ConnectedWorkspaceProvider';
import { connectedSurfaceCopy } from '@/lib/connectedSurfaceCopy';

const statusLabels = { active: 'Active', expired: 'Expired', revoked: 'Signed out', unknown: 'Status unknown' };

export default function ConnectedAccountSecurity({ accountId }) {
  const { account, logout } = useAuth();
  const { data } = useConnectedWorkspace();
  const locale = data?.preferences?.interfaceLocale || 'en';
  const t = connectedSurfaceCopy(locale);
  const status = key => t(statusLabels[key]);
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

  return <section className="max-w-2xl rounded-2xl border bg-white p-6" lang={locale}>
    <h1 className="text-2xl font-semibold">{t('Account security')}</h1>
    <h2 className="mt-6 text-lg font-semibold">{t('Browser sessions')}</h2>
    <p className="mt-2 text-slate-700">{t('Review where your account has been signed in.')}</p>
    <button className="mt-3 min-h-11 rounded-xl border px-4" type="button" disabled={query.isFetching} onClick={() => query.refetch()}>{t('Refresh sessions')}</button>
    {query.isFetching && <p className="mt-3" role="status">{t('Checking account sessions…')}</p>}
    {query.isError && <p className="mt-3" role="alert">{t('Could not check your account sessions. Try refreshing.')}</p>}
    {query.isSuccess && <>
      {query.data.items.length === 0 && <p className="mt-4">{t('No sessions on this page.')}</p>}
      <ul className="mt-3 divide-y">
        {query.data.items.map(item => <li className="py-3" key={item.id}>
          <p className="font-medium">{item.current ? t('This browser') : t('Another browser')} · {status(item.status)}</p>
          {item.lastSeenAt && <p className="mt-1 text-sm text-slate-700">{t('Last active')} <time dateTime={item.lastSeenAt}>{new Date(item.lastSeenAt).toLocaleString(locale === 'en' ? undefined : locale)}</time></p>}
        </li>)}
      </ul>
    </>}
    <div className="flex flex-wrap gap-2">
      {cursor && <button className="min-h-11 rounded-xl border px-4" type="button" onClick={() => setCursor(null)}>{t('First page')}</button>}
      {query.isSuccess && query.data.nextCursor && <button className="min-h-11 rounded-xl border px-4" type="button" onClick={() => setCursor(query.data.nextCursor)}>{t('Next page')}</button>}
    </div>
    {canSignOutAll && <div className="mt-6 border-t pt-4">
      <button ref={revokeButton} className="min-h-11 rounded-xl border px-4" type="button" aria-expanded={confirming}
        disabled={busy} onClick={() => {
          setConfirming(value => !value);
          setCommandError('');
          if (!confirming) requestAnimationFrame(() => confirmButton.current?.focus());
        }}>{t('Sign out on all devices')}</button>
      {confirming && <div className="mt-3">
        <p>{t('This ends your other sessions and signs you out of this browser.')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button ref={confirmButton} className="min-h-11 rounded-xl bg-blue-700 px-4 text-white" type="button" disabled={busy} onClick={revokeSessions}>{busy ? t('Signing out…') : t('Confirm sign-out')}</button>
          <button className="min-h-11 rounded-xl border px-4" type="button" disabled={busy} onClick={() => { setConfirming(false); setCommandError(''); revokeButton.current?.focus(); }}>{t('Cancel')}</button>
        </div>
        {commandError && <p className="mt-3" role="alert">{commandError}</p>}
      </div>}
    </div>}
  </section>;
}
