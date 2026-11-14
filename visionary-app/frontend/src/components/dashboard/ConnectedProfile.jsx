import { useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function ConnectedProfile() {
  const { account, updateUser, checkUserAuth } = useAuth();
  const savedName = account.full_name || '';
  // Keep the base and edits together so a cross-device refresh cannot silently
  // rebase a draft. A successful write or explicit reload clears both.
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const lock = useRef(false);
  const value = draft?.name ?? savedName;
  const changed = draft && draft.base !== savedName;
  async function refresh() {
    setChecking(true); setMessage(null);
    const latest = await checkUserAuth({ quiet: true, passive: true });
    setChecking(false);
    setMessage(latest ? { text: 'Profile checked against your account.' } : { error: true, text: 'Could not check your profile. Try again when connected.' });
  }
  async function save(event) {
    event.preventDefault();
    if (lock.current || checking || changed || !draft || !value.trim() || value.trim() === savedName) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      await updateUser({ full_name: value.trim() }, { expectedUserId: account.id, expectedProfileName: draft.base });
      setDraft(null);
      setMessage({ text: 'Display name saved to your account.' });
    } catch (error) {
      if (error.status === 409) await checkUserAuth({ quiet: true, passive: true });
      setMessage({ error: true, text: error.status === 409 ? 'Your name changed on another device. Your edits are still here. Review the saved name before trying again.' : 'Could not confirm the save. Your edits are still here.' });
    } finally { lock.current = false; setBusy(false); }
  }
  return <section className="max-w-xl rounded-2xl border bg-white p-6">
    <h1 className="text-2xl font-semibold">Your profile</h1>
    <p className="mt-2 break-words text-slate-700">{account.email || account.phone_number}</p>
    <p className="mt-2 text-slate-700">Your display name follows your account across devices.</p>
    <form onSubmit={save} className="mt-6 grid gap-3">
      <label htmlFor="connected-display-name" className="font-medium">Display name</label>
      <input id="connected-display-name" className="min-h-11 rounded-lg border px-3" value={value} required maxLength={80} disabled={busy}
        onChange={event => { setDraft({ base: draft?.base ?? savedName, name: event.target.value }); setMessage(null); }} />
      {changed && <p role="alert">The name on your account is now <strong>{savedName || 'blank'}</strong>.</p>}
      <div className="flex flex-wrap gap-3">
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 font-medium text-white disabled:opacity-60" disabled={busy || checking || changed || !value.trim() || value.trim() === savedName}>{busy ? 'Saving…' : 'Save name'}</button>
        <button type="button" className="min-h-11 rounded-lg border px-4" disabled={busy || checking} onClick={refresh}>{checking ? 'Checking…' : 'Refresh profile'}</button>
        {draft && <button type="button" className="min-h-11 rounded-lg border px-4" disabled={busy} onClick={() => { setDraft(null); setMessage(null); }}>Discard edits</button>}
      </div>
      {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
    </form>
  </section>;
}
