import { useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { createConsentClient } from '@/services/consentClient';
import { privacyCopy } from '@/lib/privacyCopy';
const labels = { learning_sessions: 'Learning sessions', document_sharing: 'Document sharing', downloads: 'Downloads', model_context: 'Model context', telemetry_optional: 'Optional telemetry' };
export default function CloudConsentControls({ accountId, locale = 'en' }) {
  const { user } = useAuth();
  const t = privacyCopy(locale);
  const [state, setState] = useState({ loading: true, value: null, error: '', notice: '', busy: '' });
  const active = useRef(false), pending = useRef(false);
  const client = useMemo(() => createConsentClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null }), [accountId]);
  useEffect(() => {
    active.current = true;
    client.list().then(value => { if (active.current) setState({ loading: false, value, error: '', notice: '', busy: '' }); }, () => {
      if (active.current) setState({ loading: false, value: null, error: t('Consent controls could not be loaded. Your saved data has not changed.'), notice: '', busy: '' });
    });
    return () => { active.current = false; };
  }, [client]);
  async function refresh(cursor) {
    if (pending.current) return;
    pending.current = true; setState(s => ({ ...s, busy: 'page', error: '' }));
    try {
      const value = await client.list(cursor);
      if (active.current) setState(s => ({ ...s, value, loading: false, busy: '' }));
    } catch { if (active.current) setState(s => ({ ...s, busy: '', error: t('Consent controls could not be refreshed. Try again.') })); }
    finally { pending.current = false; }
  }
  async function revoke(row) {
    if (pending.current) return;
    pending.current = true; setState(s => ({ ...s, busy: row.id, error: '', notice: '' }));
    try {
      const receipt = await client.revoke(row.id);
      if (active.current) setState(s => ({ ...s, busy: '', notice: t('Consent revoked. Your saved records are preserved. Content already delivered to a device cannot be recalled.'),
        value: { ...s.value, grants: s.value.grants.map(g => g.id === row.id ? { ...g, state: 'revoked', revokedAt: receipt.revokedAt } : g) } }));
    } catch { if (active.current) setState(s => ({ ...s, busy: '', error: t('Revocation could not be confirmed. Refresh to check its current status before retrying.') })); }
    finally { pending.current = false; }
  }
  if (user?.id !== accountId) return null;
  return <section className="v-card" lang={locale} aria-labelledby="cloud-consent-title">
    <h2 id="cloud-consent-title" className="text-lg font-medium">{t('Cloud consent controls')}</h2>
    <p className="v-muted mt-3">{t('Review and revoke purposes you previously allowed. Revoking consent preserves your saved records. Content already delivered to a device cannot be recalled.')}</p>
    {state.loading && <p role="status" className="mt-3">{t('Loading your consent records…')}</p>}
    {state.error && <p role="alert" className="v-notice v-error mt-3">{state.error}</p>}
    {state.notice && <p role="status" className="mt-3">{state.notice}</p>}
    {state.value && !state.value.available && <p className="v-muted mt-3">{t('Cloud consent controls are not available yet. Your records are preserved.')}</p>}
    {state.value?.available && <>
      {!state.value.grants.length && <p className="v-muted mt-3">{t('No consents on this page.')}</p>}
      <ul className="mt-4 space-y-4">{state.value.grants.map(row => <li key={row.id} className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-medium">{t(labels[row.purpose] || row.purpose)}</h3>
        <p className="v-muted mt-2">{t(row.resourceId === null ? 'Account-wide' : 'For one item')} · {t(row.state === 'revoked' ? 'Revoked' : row.state === 'expired' ? 'Expired' : 'Active')} · Policy {row.consentVersion}</p>
        {row.expiresAt && <p className="v-muted mt-2">{t('Expires')} {new Date(row.expiresAt).toLocaleString(locale === 'en' ? undefined : locale)}</p>}
        {row.state !== 'revoked' && <button type="button" className="v-button mt-3" disabled={!!state.busy} aria-label={t('Revoke {purpose} consent', { purpose: t(labels[row.purpose] || row.purpose) })} onClick={() => revoke(row)}>{state.busy === row.id ? t('Revoking…') : t('Revoke consent')}</button>}
      </li>)}</ul>
      {state.value.nextCursor && <button type="button" className="v-button mt-4" disabled={!!state.busy} onClick={() => refresh(state.value.nextCursor)}>{t('Next consent records')}</button>}
    </>}
    {!state.loading && <button type="button" className="v-button mt-4" disabled={!!state.busy} onClick={() => refresh()}>{t('Refresh consent records')}</button>}
  </section>;
}
