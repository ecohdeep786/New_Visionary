import { roleNotificationCopy } from '@/lib/roleNotificationCopy';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { markNotification, markOrganizationUpdate, organizationUpdates, updatePreferences } from '@/services/workspaceService';
export default function OrganizationNotifications({
  ctx,
  data
}) {
  const locale = data.preferences.interfaceLocale || 'en';
  const t = roleNotificationCopy(locale);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [, setRetry] = useState(0);
  useEffect(()=>{setNotice('');setFailed(false);setFilter('all');},[ctx.personId,ctx.workspaceId]);
  let updates;
  let error = '';
  try {
    updates = organizationUpdates(ctx);
  } catch (failure) {
    error = failure.message;
  }
  function perform(action, success) {
    try {
      action();
      setNotice(success);
      setFailed(false);
    } catch (failure) {
      setNotice(failure.message);
      setFailed(true);
    }
  }
  const items = updates?.items.filter(item => filter === 'all' || !item.read) || [];
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{t("Organization updates")}</h1><p className="v-muted mt-2">{t("Membership actions saved on this device. Current access always follows the latest permission, even when an older update remains unread.")}</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">{t("Summary preference")}</h2><label className="mt-4 block max-w-sm text-sm">{t("Summary frequency")}<select aria-label={t("Summary frequency")} className="v-field mt-2" value={data.preferences.notifications} onChange={event => perform(() => updatePreferences(ctx, {
          notifications: event.target.value
        }), 'Preference saved locally. No delivery has been scheduled.')}><option value="off">{t("Off")}</option><option value="daily">{t("Daily")}</option><option value="weekly">{t("Weekly")}</option><option value="urgent">{t("Urgent only")}</option></select></label><p className="v-muted mt-3">{t("This preference does not remove saved history. Email, push and scheduled delivery require the later notification service.")}</p></section>
  {notice && <p className={`v-notice ${failed ? 'v-error' : ''}`} role={failed ? "alert" : "status"} lang={failed ? "en" : locale}>{failed ? notice : t(notice)}</p>}
  <section><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><h2 className="text-lg font-medium">{t("Membership history")}</h2><label className="text-sm">{t("Show updates")}<select aria-label={t("Show updates")} className="v-field mt-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">{t("All updates")}</option><option value="unread">{t("Unread only")}</option></select></label></div>
   {error && <p className="v-notice v-error" role="alert">{t("Membership updates unavailable:")} <span lang="en">{error}</span> <button className="underline" onClick={() => setRetry(value => value + 1)}>{t("Retry")}</button></p>}
   {updates && <>{updates.importedWithoutHistory > 0 && <p className="v-notice mb-4">{t('Earlier history is incomplete for {count} imported invitations. Review current access in People.', {
            count: updates.importedWithoutHistory
          })}</p>}{items.length ? <ol className="space-y-3">{items.map(item => <li className="v-card" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-sm font-medium">{t("Invitation")} {t(item.action)}</h3><span className="text-xs text-[#5f6368]">{item.read ? t("Read") : t("Unread")}</span></div><p className="mt-2 break-all text-sm">{item.target} · {t(item.role)}</p><p className="v-muted mt-2 break-all">{t("Actor:")} {item.actor || t('Not recorded')}</p><time className="v-muted mt-1 block" dateTime={item.at}>{new Date(item.at).toLocaleString(locale)}</time><p className="mt-3 text-sm">{t("Current connection:")} {t(item.currentStatus)}</p><div className="mt-4 flex flex-wrap gap-3"><Link className="v-button" to={item.path}>{t("Review connection")}</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markOrganizationUpdate(ctx, item.inviteId, item.eventIndex), 'Update marked read on this device.')}>{item.read ? t("Read") : t("Mark read")}</button></div></li>)}</ol> : <div className="v-card"><p>{filter === 'unread' ? t("No unread membership updates.") : t("No saved membership actions yet.")}</p>{filter === 'unread' && <button className="v-button mt-3" onClick={() => setFilter('all')}>{t("Show all updates")}</button>}<Link className="mt-3 block text-sm underline" to="/dashboard/people">{t("Open People")}</Link></div>}</>}
  </section>
  {data.notifications.length > 0 && <section className="v-card"><h2 className="text-lg font-medium">{t("Other local notices")}</h2>{data.notifications.map(item => <div className="v-list-row" key={item.id}><Link className="text-sm underline" lang={item.locale || "en"} to={item.path}>{item.text}</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markNotification(ctx, item.id), 'Notice marked read on this device.')}>{item.read ? t("Read") : t("Mark read")}</button></div>)}</section>}
 </div>;
}
