import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { createAuthTransport } from '@/api/firebase/authTransport';

const request = createAuthTransport({ basePath: '/api/account/privacy/consents' });
const states = { active: 'Active', pending: 'Pending', expired: 'Expired', revoked: 'Revoked' };

async function consentRequest(accountId, path, options) {
  const check = () => {
    if (appClient.auth.currentProfile()?.id !== accountId) throw new Error('Account changed.');
  };
  check();
  const value = await request(path, { ...options, accountId, beforeSend: check });
  check();
  if (value?.version !== 1 || value.uid !== accountId) throw new Error('The consent response could not be verified.');
  return value;
}

export default function ConnectedConsents({ accountId }) {
  const [cursor, setCursor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const lock = useRef(false);
  const query = useQuery({
    queryKey: ['account', accountId, 'consents', cursor],
    queryFn: async () => {
      const value = await consentRequest(accountId, cursor ? '?' + new URLSearchParams({ cursor }) : '');
      if (typeof value.available !== 'boolean' || !Array.isArray(value.grants) || value.grants.length > 20 ||
        (!value.available && (value.grants.length || value.nextCursor !== null)) ||
        (value.nextCursor !== null && (typeof value.nextCursor !== 'string' || !value.nextCursor || value.nextCursor.length > 512 || value.nextCursor === cursor)) ||
        value.grants.some(row => typeof row?.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(row.id) ||
          typeof row.purpose !== 'string' || !row.purpose.trim() || !Object.hasOwn(states, row.state)) ||
        new Set(value.grants.map(row => row.id)).size !== value.grants.length) throw new Error('Invalid consent list.');
      return value;
    },
    retry: false, gcTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: 'always',
  });
  const page = query.isSuccess ? query.data : null;

  async function revoke() {
    if (lock.current || !page?.grants.some(row => row.id === selected && row.state === 'active')) return;
    lock.current = true;
    setSaving(true);
    setNotice(null);
    try {
      const result = await consentRequest(accountId, '/revoke', { method: 'POST', body: { grantId: selected } });
      if (result.id !== selected || typeof result.revokedAt !== 'string' || !Number.isFinite(Date.parse(result.revokedAt))) {
        throw new Error('Revocation could not be confirmed.');
      }
      setSelected(null);
      const latest = await query.refetch({ throwOnError: true });
      const revoked = latest.data?.grants.some(row => row.id === selected && row.state === 'revoked');
      setNotice({ text: revoked ? 'Consent revoked.' : 'Refresh to check the latest consent status.' });
    } catch {
      await query.refetch();
      setNotice({ error: true, text: 'Could not confirm the latest consent status. Refresh the list before trying again.' });
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return <section aria-labelledby="consents-heading" className="mt-6 max-w-2xl rounded-2xl border bg-white p-6">
    <h2 id="consents-heading" className="text-xl font-semibold">Sharing consents</h2>
    <p className="mt-2 text-slate-700">Review and withdraw permissions linked to your account.</p>
    {query.isPending && <p role="status" className="mt-3">Checking your consents…</p>}
    {(query.isError || page?.available === false) && <p role="alert" className="mt-3">Consent controls are unavailable. Try refreshing.</p>}
    {page?.available && page.grants.length === 0 && <p className="mt-3">No consents on this page.</p>}
    {page?.available && page.grants.length > 0 && <ul className="mt-4 divide-y">
      {page.grants.map(grant => <li key={grant.id} className="py-3">
        <p className="break-words">{grant.purpose} · {states[grant.state]}</p>
        {grant.state === 'active' && selected !== grant.id && <button type="button" className="mt-2 min-h-11 rounded-lg border px-4" disabled={saving} onClick={() => { setSelected(grant.id); setNotice(null); }}>Withdraw consent</button>}
        {grant.state === 'active' && selected === grant.id && <div className="mt-2">
          <p>Confirm withdrawal? This ends access granted through this consent.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-lg border px-4" disabled={saving} onClick={revoke}>{saving ? 'Withdrawing…' : 'Confirm withdrawal'}</button>
            <button type="button" className="min-h-11 rounded-lg border px-4" disabled={saving} onClick={() => setSelected(null)}>Keep consent</button>
          </div>
        </div>}
      </li>)}
    </ul>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="min-h-11 rounded-lg border px-4" disabled={saving || query.isFetching} onClick={() => { setNotice(null); query.refetch(); }}>Refresh consents</button>
      {cursor && <button type="button" className="min-h-11 rounded-lg border px-4" disabled={saving} onClick={() => { setSelected(null); setNotice(null); setCursor(null); }}>First page</button>}
      {page?.nextCursor && <button type="button" className="min-h-11 rounded-lg border px-4" disabled={saving} onClick={() => { setSelected(null); setNotice(null); setCursor(page.nextCursor); }}>Next page</button>}
    </div>
    {notice && <p className="mt-3" role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
  </section>;
}
