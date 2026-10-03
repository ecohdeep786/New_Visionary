import { organizationCopy } from '@/lib/organizationCopy';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationAudit } from '@/services/workspaceService';
export default function OrganizationAudit({
  ctx,
  locale = 'en'
}) {
  const t = (key, params) => organizationCopy(locale, key, params);
  const [days, setDays] = useState(30);
  const [source, setSource] = useState('all');
  const [, setRetry] = useState(0);
  let view;
  let error = '';
  try {
    view = organizationAudit(ctx, days);
  } catch (failure) {
    error = failure.message;
  }
  const rows = view?.entries.filter(row => source === 'all' || row.source === source) || [];
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{t("Organization audit")}</h1><p className="v-muted mt-2">{t("Saved membership actions and changes in this organization workspace. This history is stored on this device.")}</p></header>
  <div className="flex flex-wrap gap-4"><label className="text-sm">{t("Period")}<select aria-label={t("Period")} className="v-field mt-2" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>{t("Last 7 days")}</option><option value={30}>{t("Last 30 days")}</option></select></label><label className="text-sm">{t("Action source")}<select aria-label={t("Action source")} className="v-field mt-2" value={source} onChange={event => setSource(event.target.value)}><option value="all">{t("All sources")}</option><option value="membership">{t("Membership")}</option><option value="workspace">{t("Workspace changes")}</option><option value="classwork">{t("Classwork states")}</option><option value="transition">{t("Teacher promotions")}</option></select></label></div>
  {error && <p role="alert" className="v-notice v-error">{t('Audit unavailable')}: <span lang="en">{error}</span> <button className="underline" onClick={() => setRetry(value => value + 1)}>{t("Retry")}</button></p>}
  {view && <>{view.unavailableSources.length > 0 && <p role="alert" className="v-notice">{t('Some history sources could not be read. Available changes remain below.')} <span lang="en">{view.unavailableSources.join(', ')}</span> <button className="underline" onClick={() => setRetry(value => value + 1)}>{t("Retry history")}</button></p>}{view.importedWithoutHistory > 0 && <p className="v-notice">{t('{count} imported invitations have incomplete earlier history. Review their current status in People.', {
          count: view.importedWithoutHistory
        })} <Link className="underline" to="/dashboard/people">{t("People")}</Link>.</p>}
   <p className="v-muted">{t('{count} recorded actions in the selected period and source.', {
          count: rows.length
        })}</p>
   {view.classworkWithoutHistory > 0 && <p className="v-notice mt-3">{t('{count} older class activities have no recorded state history. Earlier actions and actors have not been reconstructed.', {
          count: view.classworkWithoutHistory
        })}</p>}
   {rows.length ? <ol className="space-y-3">{rows.map(row => <li className="v-card" key={row.id}><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-medium">{t({
                membership: 'Membership',
                workspace: 'Workspace',
                classwork: 'Classwork',
                transition: 'Teacher promotion'
              }[row.source])} · <span lang="en">{row.action}</span></p><time className="text-xs text-[#5f6368]" dateTime={row.at}>{new Date(row.at).toLocaleString(locale)}</time></div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-[#5f6368]">{t("Target")}</dt><dd className="break-all">{row.target}</dd></div><div><dt className="text-xs text-[#5f6368]">{t("Actor")}</dt><dd className="break-all">{row.actor || t('Not recorded by this source')}</dd></div><div><dt className="text-xs text-[#5f6368]">{t("Outcome")}</dt><dd><span lang="en">{row.outcome}</span></dd></div></dl></li>)}</ol> : <div className="v-card"><p>{t("No recorded actions match this period and source.")}</p>{source !== 'all' && <button className="v-button mt-3" onClick={() => setSource('all')}>{t("Show all sources")}</button>}<Link className="mt-3 block text-sm underline" to="/dashboard/people">{t("Review people and connections")}</Link></div>}
  </>}
  <p className="v-muted text-xs">{t("This local record is editable browser data. Promotion rows summarize explicitly scoped teacher actions and current notice states; they do not expose learner profiles or reconstruct earlier unscoped actions. Production audit retention and integrity require the later server implementation.")}</p>
 </div>;
}
