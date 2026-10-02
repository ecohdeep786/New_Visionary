import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getParentNotificationPreview } from '@/services/parentNotificationService';
import { markNotification, updatePreferences } from '@/services/workspaceService';

export default function ParentNotifications({ ctx, data }) {
 const [notice, setNotice] = useState('');
 const [error, setError] = useState(false);
 let preview;
 try { preview = getParentNotificationPreview(ctx); }
 catch (failure) { return <div className="v-page" role="alert">{failure.message}</div>; }
 function markRead(id) {try {markNotification(ctx,id);setNotice('Update marked read on this device.');setError(false);}catch(failure){setNotice(failure.message);setError(true);}}
 function save(patch) {
  try { updatePreferences(ctx, patch); setNotice('Local preference saved. No message was scheduled or sent.'); setError(false); }
  catch (failure) { setNotice(failure.message); setError(true); }
 }
 return <div className="v-page">
  <header><h1 className="v-title">Family updates</h1><p className="v-muted mt-2">Current connection status and a manual summary preview from this device. No email, push message or scheduled digest is sent.</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">Digest preferences</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Summary frequency<select aria-label="Summary frequency" className="v-field mt-2" value={data.preferences.notifications} onChange={event => save({ notifications: event.target.value })}><option value="off">Off</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="urgent">Urgent only</option></select></label><label className="text-sm">Preview language<select aria-label="Preview language" className="v-field mt-2" value={data.preferences.notificationLocale || data.preferences.interfaceLocale || 'en'} onChange={event => save({ notificationLocale: event.target.value })}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label></div><p className="v-muted mt-3">These settings are saved for this workspace. Automatic delivery needs a future notification service.</p>{notice && <p className={`v-notice mt-3 ${error ? 'v-error' : ''}`} role={error ? 'alert' : 'status'}>{notice}</p>}</section>
  <section className="v-card"><h2 className="text-lg font-medium">Sharing status</h2><p className="v-muted mt-2">Live status, not a sent alert. A report link appears only while progress sharing is active.</p>{preview.connections.length ? preview.connections.map(item => <div className="v-list-row" key={item.id}><div className="min-w-0"><p className="text-sm">{item.text}</p><p className="v-muted mt-1">{item.status}</p></div><Link className="v-button" to={item.path}>{item.status === 'active' ? 'View report' : 'Manage sharing'}</Link></div>) : <p className="v-muted mt-4">No child connection yet. You can request progress sharing from Children.</p>}<Link className="v-button mt-4" to="/dashboard/child">Open Children</Link></section>
  <section className="v-card"><h2 className="text-lg font-medium">Summary preview</h2><p className="v-muted mt-2">Current last-7-day counts only. Private questions, answers, grades, feedback and drafts are excluded.</p>{preview.frequency === 'off' ? <p className="v-muted mt-4">Summary previews are off in this workspace.</p> : preview.digest.length ? preview.digest.map(item => <div className="v-list-row" key={item.childId}><p className="text-sm">{item.text}</p><Link className="v-button" to={item.path}>View report</Link></div>) : <p className="v-muted mt-4">No active progress-sharing connection is available for a summary preview.</p>}</section>
  <section className="v-card"><h2 className="text-lg font-medium">Sharing event history</h2><p className="v-muted mt-2">Saved local actions for new connections. Older imported connections may have current status without an event history.</p>{preview.history.length ? preview.history.map(item => <div className="v-list-row" key={item.id}><div className="min-w-0"><p className="text-sm" lang={preview.locale}>{item.text}</p>{item.at && <time className="v-muted mt-1 block" dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>}</div><button className="v-button" disabled={item.read} onClick={() => markRead(item.id)}>{item.read ? 'Read' : 'Mark read'}</button></div>) : <p className="v-muted mt-4">No saved sharing actions yet.</p>}</section>
  {data.notifications.some(item => item.kind !== 'guardian') && <section className="v-card"><h2 className="text-lg font-medium">Other local notices</h2>{data.notifications.filter(item => item.kind !== 'guardian').map(item => <div className="v-list-row" key={item.id}><Link className="text-sm underline" to={item.path}>{item.text}</Link><button className="v-button" disabled={item.read} onClick={() => markRead(item.id)}>{item.read ? 'Read' : 'Mark read'}</button></div>)}</section>}
 </div>;
}
