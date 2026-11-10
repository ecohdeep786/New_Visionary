import { useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { createConsentClient } from '@/services/consentClient';
const labels = { learning_sessions: 'Learning sessions', document_sharing: 'Document sharing', downloads: 'Downloads', model_context: 'Model context', telemetry_optional: 'Optional telemetry' };
export default function CloudConsentControls({ accountId }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, value: null, error: '', notice: '', busy: '' });
  const active = useRef(false), pending = useRef(false);
  const client = useMemo(() => createConsentClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null }), [accountId]);
  useEffect(() => {
    active.current = true;
    client.list().then(value => { if (active.current) setState({ loading: false, value, error: '', notice: '', busy: '' }); }, () => {
      if (active.current) setState({ loading: false, value: null, error: 'Consent controls could not be loaded. Your saved data has not changed.', notice: '', busy: '' });
    });
    return () => { active.current = false; };
  }, [client]);
  async function refresh(cursor) {
    if (pending.current) return;
    pending.current = true; setState(s => ({ ...s, busy: 'page', error: '' }));
    try {
      const value = await client.list(cursor);
      if (active.current) setState(s => ({ ...s, value, loading: false, busy: '' }));
    } catch { if (active.current) setState(s => ({ ...s, busy: '', error: 'Consent controls could not be refreshed. Try again.' })); }
    finally { pending.current = false; }
  }
  async function revoke(row) {
    if (pending.current) return;
    pending.current = true; setState(s => ({ ...s, busy: row.id, error: '', notice: '' }));
    try {
      const receipt = await client.revoke(row.id);
      if (active.current) setState(s => ({ ...s, busy: '', notice: 'Consent revoked. Your saved records are preserved. Content already delivered to a device cannot be recalled.',
        value: { ...s.value, grants: s.value.grants.map(g => g.id === row.id ? { ...g, state: 'revoked', revokedAt: receipt.revokedAt } : g) } }));
    } catch { if (active.current) setState(s => ({ ...s, busy: '', error: 'Revocation could not be confirmed. Refresh to check its current status before retrying.' })); }
    finally { pending.current = false; }
  }
  if (user?.id !== accountId) return null;
  return <section className="v-card" lang="en" aria-labelledby="cloud-consent-title">
    <h2 id="cloud-consent-title" className="text-lg font-medium">Cloud consent controls</h2>
    <p className="v-muted mt-3">Review and revoke purposes you previously allowed. Revoking consent preserves your saved records.</p>
    {state.loading && <p role="status" className="mt-3">Loading your consent records…</p>}
    {state.error && <p role="alert" className="v-notice v-error mt-3">{state.error}</p>}
    {state.notice && <p role="status" className="mt-3">{state.notice}</p>}
    {state.value && !state.value.available && <p className="v-muted mt-3">Cloud consent controls are not available yet. Your records are preserved.</p>}
    {state.value?.available && <>
      {!state.value.grants.length && <p className="v-muted mt-3">No consent records on this page.</p>}
      <ul className="mt-4 space-y-4">{state.value.grants.map(row => <li key={row.id} className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-medium">{labels[row.purpose] || row.purpose}</h3>
        <p className="v-muted mt-2">{row.resourceId === null ? 'Account-wide' : 'For one item'} · {row.state} · Policy {row.consentVersion}</p>
        {row.expiresAt && <p className="v-muted mt-2">Expires {new Date(row.expiresAt).toLocaleString()}</p>}
        {row.state !== 'revoked' && <button type="button" className="v-button mt-3" disabled={!!state.busy} aria-label={`Revoke ${labels[row.purpose] || row.purpose} consent`} onClick={() => revoke(row)}>{state.busy === row.id ? 'Revoking…' : 'Revoke consent'}</button>}
      </li>)}</ul>
      {state.value.nextCursor && <button type="button" className="v-button mt-4" disabled={!!state.busy} onClick={() => refresh(state.value.nextCursor)}>Next consent records</button>}
    </>}
    {!state.loading && <button type="button" className="v-button mt-4" disabled={!!state.busy} onClick={() => refresh()}>Refresh consent records</button>}
  </section>;
}
