import { useState } from 'react';
import { Link } from 'react-router-dom';
import { markNotification, markOrganizationUpdate, organizationUpdates, updatePreferences } from '@/services/workspaceService';

export default function OrganizationNotifications({ ctx, data }) {
 const [filter, setFilter] = useState('all');
 const [notice, setNotice] = useState('');
 const [failed, setFailed] = useState(false);
 const [, setRetry] = useState(0);
 let updates; let error = '';
 try { updates = organizationUpdates(ctx); } catch (failure) { error = failure.message; }
 function perform(action, success) {
  try { action(); setNotice(success); setFailed(false); }
  catch (failure) { setNotice(failure.message); setFailed(true); }
 }
 const items = updates?.items.filter(item => filter === 'all' || !item.read) || [];
 return <div className="v-page"><header><h1 className="v-title">Organization updates</h1><p className="v-muted mt-2">Membership actions saved on this device. Current access always follows the latest permission, even when an older update remains unread.</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">Summary preference</h2><label className="mt-4 block max-w-sm text-sm">Summary frequency<select className="v-field mt-2" value={data.preferences.notifications} onChange={event => perform(() => updatePreferences(ctx, { notifications: event.target.value }), 'Preference saved locally. No delivery has been scheduled.')}><option value="off">Off</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="urgent">Urgent only</option></select></label><p className="v-muted mt-3">This preference does not remove saved history. Email, push and scheduled delivery require the later notification service.</p></section>
  {notice && <p className={`v-notice ${failed ? 'v-error' : ''}`} role={failed ? 'alert' : 'status'}>{notice}</p>}
  <section><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><h2 className="text-lg font-medium">Membership history</h2><label className="text-sm">Show updates<select className="v-field mt-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All updates</option><option value="unread">Unread only</option></select></label></div>
   {error && <p className="v-notice v-error" role="alert">Membership updates unavailable: {error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
   {updates && <>{updates.importedWithoutHistory > 0 && <p className="v-notice mb-4">Earlier history is incomplete for {updates.importedWithoutHistory} imported invitation{updates.importedWithoutHistory === 1 ? '' : 's'}. Review current access in People.</p>}{items.length ? <ol className="space-y-3">{items.map(item => <li className="v-card" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-sm font-medium">Invitation {item.action}</h3><span className="text-xs text-[#5f6368]">{item.read ? 'Read' : 'Unread'}</span></div><p className="mt-2 break-all text-sm">{item.target} · {item.role}</p><p className="v-muted mt-2 break-all">Actor: {item.actor || 'Not recorded'}</p><time className="v-muted mt-1 block" dateTime={item.at}>{new Date(item.at).toLocaleString()}</time><p className="mt-3 text-sm">Current connection: {item.currentStatus}</p><div className="mt-4 flex flex-wrap gap-3"><Link className="v-button" to={item.path}>Review connection</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markOrganizationUpdate(ctx, item.inviteId, item.eventIndex), 'Update marked read on this device.')}>{item.read ? 'Read' : 'Mark read'}</button></div></li>)}</ol> : <div className="v-card"><p>{filter === 'unread' ? 'No unread membership updates.' : 'No saved membership actions yet.'}</p>{filter === 'unread' && <button className="v-button mt-3" onClick={() => setFilter('all')}>Show all updates</button>}<Link className="mt-3 block text-sm underline" to="/dashboard/people">Open People</Link></div>}</>}
  </section>
  {data.notifications.length > 0 && <section className="v-card"><h2 className="text-lg font-medium">Other local notices</h2>{data.notifications.map(item => <div className="v-list-row" key={item.id}><Link className="text-sm underline" to={item.path}>{item.text}</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markNotification(ctx, item.id), 'Notice marked read on this device.')}>{item.read ? 'Read' : 'Mark read'}</button></div>)}</section>}
 </div>;
}
