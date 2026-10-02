import { useState } from 'react';
import { Link } from 'react-router-dom';
import { markNotification, updatePreferences } from '@/services/workspaceService';

export default function WorkspaceNotifications({ ctx, data }) {
 const [filter, setFilter] = useState('all');
 const [notice, setNotice] = useState('');
 const [error, setError] = useState('');
 const items = data.notifications.filter(item => filter === 'all' || !item.read);
 function perform(action, success) {
  try { action(); setError(''); setNotice(success); }
  catch (failure) { setNotice(''); setError(failure.message); }
 }
 return <div className="v-page">
  <header><h1 className="v-title">Notifications</h1><p className="v-muted mt-2">Updates saved in this workspace. No email, push or scheduled delivery is connected.</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">Summary preference</h2>
   <label className="mt-4 block max-w-sm text-sm">Summary frequency<select aria-label="Summary frequency" className="v-field mt-2" value={data.preferences.notifications || 'weekly'} onChange={event => perform(() => updatePreferences(ctx, { notifications: event.target.value }), 'Preference saved on this device. No delivery has been scheduled.')}>
    <option value="off">Off</option><option value="weekly">Weekly</option><option value="daily">Daily</option><option value="urgent">Urgent only</option>
   </select></label>
  </section>
  {error && <p className="v-notice v-error" role="alert">{error}</p>}{notice && <p className="v-notice" role="status">{notice}</p>}
  <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><h2 className="text-lg font-medium">Saved updates</h2><label className="text-sm">Show updates<select aria-label="Show updates" className="v-field mt-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All updates</option><option value="unread">Unread only</option></select></label></div>
   {items.length ? <ul className="space-y-3">{items.map(item => <li className="v-card" key={item.id}><p className="text-sm">{item.text}</p><p className="v-muted mt-2">{item.read ? 'Read' : 'Unread'}</p><div className="mt-3 flex flex-wrap gap-3"><Link className="v-button" to={item.path}>Open update</Link><button className="v-button" disabled={item.read} onClick={() => perform(() => markNotification(ctx, item.id), 'Update marked read on this device.')}>{item.read ? 'Read' : 'Mark read'}</button></div></li>)}</ul> : <div className="v-card"><h3 className="font-medium">{filter === 'unread' ? 'No unread updates' : 'You’re up to date'}</h3><p className="v-muted mt-2">{filter === 'unread' ? 'Your saved history remains available.' : 'Relevant updates will appear here.'}</p>{filter === 'unread' ? <button className="v-button mt-3" onClick={() => setFilter('all')}>Show all updates</button> : <Link className="v-button mt-3" to="/dashboard/home">Open Home</Link>}</div>}
  </section>
 </div>;
}
