import WorkspaceEmptyState from './WorkspaceEmptyState';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { markNotification, updatePreferences } from '@/services/workspaceService';

import { notificationCopy } from '@/lib/notificationCopy';

export default function WorkspaceNotifications({ ctx, data }) {
 const [filter, setFilter] = useState('all');
 const [notice, setNotice] = useState('');
 const [error, setError] = useState('');
 const t = notificationCopy(data.preferences.interfaceLocale || 'en');
 useEffect(() => { setFilter('all'); setNotice(''); setError(''); }, [ctx.personId, ctx.workspaceId]);
 const items = data.notifications.filter(item => filter === 'all' || !item.read);
 function perform(action, success) {
  try { action(); setError(''); setNotice(success); }
  catch (failure) { setNotice(''); setError(failure.message); }
 }
 return <div className="v-page" lang={data.preferences.interfaceLocale || "en"}>
  <header><h1 className="v-title">{t("Notifications")}</h1><p className="v-muted mt-2">{t("Updates saved in this workspace. No email, push or scheduled delivery is connected.")}</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">{t("Summary preference")}</h2>
   <label className="mt-4 block max-w-sm text-sm">{t("Summary frequency")}<select aria-label={t("Summary frequency")} className="v-field mt-2" value={data.preferences.notifications || 'weekly'} onChange={event => perform(() => updatePreferences(ctx, { notifications: event.target.value }), 'Preference saved on this device. No delivery has been scheduled.')}>
    <option value="off">{t("Off")}</option><option value="weekly">{t("Weekly")}</option><option value="daily">{t("Daily")}</option><option value="urgent">{t("Urgent only")}</option>
   </select></label>
  </section>
  {error && <p className="v-notice v-error" role="alert" lang="en">{error}</p>}{notice && <p className="v-notice" role="status">{t(notice)}</p>}
  <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><h2 className="text-lg font-medium">{t("Saved updates")}</h2><label className="text-sm">{t("Show updates")}<select aria-label={t("Show updates")} className="v-field mt-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">{t("All updates")}</option><option value="unread">{t("Unread only")}</option></select></label></div>
   {items.length ? <ul className="space-y-3">{items.map(item => <li className="v-card" key={item.id}><p className="text-sm" lang={item.locale || "en"}>{item.text}</p><p className="v-muted mt-2">{item.read ? t('Read') : t('Unread')}</p><div className="mt-3 flex flex-wrap gap-3"><Link className="v-button" to={item.path}>{t("Open update")}</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markNotification(ctx, item.id), 'Update marked read on this device.')}>{item.read ? t('Read') : t('Mark read')}</button></div></li>)}</ul> : <div className="v-card"><WorkspaceEmptyState illustration="updates" heading="h3" title={filter === 'unread' ? t('No unread updates') : t('You’re up to date')} description={filter === 'unread' ? t('Your saved history remains available.') : t('Relevant updates will appear here.')}>{filter === 'unread' ? <button className="v-button mt-3" onClick={() => setFilter('all')}>{t("Show all updates")}</button> : <Link className="v-button mt-3" to="/dashboard/home">{t("Open Home")}</Link>}</WorkspaceEmptyState></div>}
  </section>
 </div>;
}
