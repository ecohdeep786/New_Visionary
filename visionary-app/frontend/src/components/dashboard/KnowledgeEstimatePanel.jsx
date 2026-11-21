import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { appClient } from '@/api/appClient';
import { createKnowledgeProjectionClient } from '@/services/knowledgeProjectionClient';
import { learningProgressText } from '@/lib/learningProgressCopy';

/* KAN-145 — the knowledge estimate panel on the Progress surface.
 *
 * The server owns the policy kernel: this panel reads the owner's projection
 * for scopes that have guided evidence and shows it exactly as the server
 * computed it — an estimate with inspectable evidence (model version, assessed
 * count, revision), never a passed check, a completion verdict or an automatic
 * escalation. A scope without a projection shows the honest empty state; a
 * failed read shows the honest unavailable state with a retry. Nothing is
 * invented here: the same receipt replays by identity, so a projection that
 * has not landed yet simply reads as "no estimate yet".
 *
 * Requests are bounded: only guided rows that carry a projectable scope are
 * queried, capped at the first six rows of the current report.
 */
const MAX_SCOPES = 6;

export default function KnowledgeEstimatePanel({ ctx, rows, locale }) {
  const t = key => learningProgressText(locale, key);
  const [state, setState] = useState({ loading: true, error: '', entries: [], modelVersion: '' });
  const [retry, setRetry] = useState(0);
  const scopes = (rows || []).filter(row => row.source === 'guided' && row.knowledge).slice(0, MAX_SCOPES)
    .map(row => ({ ...row.knowledge, workspaceId: ctx.workspaceId, title: row.title, titleLocale: row.titleLocale }));
  useEffect(() => {
    let live = true;
    const accountId = appClient.auth.currentProfile?.()?.id;
    if (!accountId || !scopes.length) { if (live) setState({ loading: false, error: '', entries: [], modelVersion: '' }); return undefined; }
    const client = createKnowledgeProjectionClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null });
    setState(current => ({ ...current, loading: true, error: '' }));
    (async () => {
      try {
        const model = await client.models({ sourceVersion: scopes[0].sourceVersion, criteriaVersion: scopes[0].criteriaVersion });
        const entries = await Promise.all(scopes.map(async scope => {
          try { return { ...scope, estimate: await client.projection(scope) }; }
          catch (error) { if (error?.status === 409) return { ...scope, estimate: null, conflict: true }; throw error; }
        }));
        if (live) setState({ loading: false, error: '', entries, modelVersion: model.model.version });
      } catch (error) {
        if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return;
        if (live) setState({ loading: false, error: error?.status ? error.message : t('estimateUnavailable'), entries: [], modelVersion: '' });
      }
    })();
    return () => { live = false; };
  }, [retry, scopes.map(scope => `${scope.workspaceId}:${scope.conceptId}:${scope.sourceVersion}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!scopes.length) return null;
  return <section className="v-card" aria-labelledby="knowledge-estimate-heading">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: 'var(--v-soft)' }}><Brain size={20} aria-hidden="true" style={{ color: 'var(--v-action)' }} /></span>
      <div className="min-w-0 flex-1"><h2 id="knowledge-estimate-heading" className="text-lg font-medium">{t('estimateTitle')}</h2><p className="v-muted mt-1">{t('estimateIntro')}</p></div>
    </div>
    {state.loading && <p className="v-muted mt-4" role="status">{t('estimateLoading')}</p>}
    {!state.loading && state.error && <div className="mt-4"><p className="v-notice v-error" role="alert"><span lang="en">{state.error}</span></p><button className="v-button mt-3" onClick={() => setRetry(retry + 1)}>{t('estimateRetry')}</button></div>}
    {!state.loading && !state.error && <ul className="mt-4 grid gap-3">
      {state.entries.map(entry => <li className="rounded-2xl border border-[var(--v-border)] bg-[var(--v-surface)] px-4 py-3" key={`${entry.conceptId}:${entry.sourceVersion}`}>
        <div className="flex items-baseline justify-between gap-3"><h3 lang={entry.titleLocale || 'en'} className="min-w-0 truncate text-sm font-medium">{entry.title}</h3>
          {entry.conflict ? <span className="v-evidence">{t('estimateConflict')}</span>
            : entry.estimate ? <span className="text-sm font-medium">{Math.round(entry.estimate.pKnown * 100)}%</span>
            : <span className="v-evidence">{t('estimateNone')}</span>}</div>
        {entry.estimate && <p className="v-muted mt-1 text-xs">{t('estimateEvidence', { count: entry.estimate.assessedCount, model: entry.estimate.modelVersion, revision: entry.estimate.revision })}</p>}
        {entry.conflict && <p className="v-muted mt-1 text-xs">{t('estimateConflictNote')}</p>}
      </li>)}
    </ul>}
    {!state.loading && !state.error && <p className="v-muted mt-3 text-xs">{t('estimatePolicy')}{state.modelVersion ? ` ${t('estimateModel', { model: state.modelVersion })}` : ''}</p>}
  </section>;
}
