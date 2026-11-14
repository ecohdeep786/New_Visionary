import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { createConnectedWorkspaces } from '@/services/connectedWorkspaces';

const workspaces = createConnectedWorkspaces(() => appClient.auth.currentProfile()?.id);
const roleLabels = { OWNER: 'Owner', ADMIN: 'Administrator', MEMBER: 'Member', GUEST: 'Guest' };

export default function ConnectedWorkspaces({ accountId }) {
  const [after, setAfter] = useState(null);
  const [invitation, setInvitation] = useState('');
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const command = useRef(null);
  const pending = useRef(false);
  const query = useQuery({
    queryKey: ['account', accountId, 'workspaces', after],
    queryFn: () => workspaces.list(accountId, after),
    refetchOnMount: 'always', refetchOnWindowFocus: 'always', refetchOnReconnect: 'always',
    retry: false, gcTime: 0,
  });
  const page = query.isSuccess ? query.data : null;
  const submitting = busy || joining;
  // The overview may refuse a new account until provisioning creates its SQL person.
  // Only the provisioning endpoint decides whether this account may be set up.
  const mayNeedSetup = query.error?.status === 403;
  const canProvision = after === null && (mayNeedSetup ||
    (page && page.next === null && !page.items.some(row => row.isPersonal)));

  async function provision() {
    if (!canProvision || pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    try {
      // Keep the same command ID while the user retries an uncertain write.
      command.current ??= crypto.randomUUID();
      const id = await workspaces.provision(accountId, command.current);
      const result = await query.refetch({ throwOnError: true });
      if (!result.data?.items.some(row => row.id === id && row.isPersonal)) {
        throw new Error('The workspace list has not caught up.');
      }
      command.current = null;
      setMessage({ text: 'Your personal workspace is ready.' });
    } catch (error) {
      const unavailable = [404, 503].includes(error.status);
      setMessage({ error: true, text: unavailable
        ? 'Workspace setup is unavailable right now. Try again later.'
        : 'Could not confirm your workspace. Refresh the list before trying again.' });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function acceptInvitation(event) {
    event.preventDefault();
    if (pending.current || !/^[A-Za-z0-9_-]{43}$/.test(invitation.trim())) return;
    pending.current = true;
    setJoining(true);
    setMessage(null);
    try {
      await workspaces.acceptInvitation(accountId, invitation.trim());
      setInvitation('');
      if (after) setAfter(null);
      else await query.refetch();
      setMessage({ text: 'Invitation accepted. Refresh your workspaces if the new workspace does not appear yet.' });
    } catch (error) {
      const text = {
        401: 'Your session has ended. Sign in and try again.',
        403: 'This account could not accept the invitation. Check the account you’re signed in with.',
        404: 'The invitation could not be found. Check the code or ask for a new one.',
        409: 'The invitation could not be accepted in its current state. Refresh your workspaces.',
        410: 'This invitation is no longer active. Ask for a new one.',
      }[error.status] || 'Could not confirm acceptance. Check your connection and try again.';
      setMessage({ error: true, text });
    } finally {
      pending.current = false;
      setJoining(false);
    }
  }

  return <section className="max-w-2xl rounded-2xl border bg-white p-6">
    <h1 className="text-2xl font-semibold">Workspaces</h1>
    <p className="mt-2 text-slate-700">Review the personal and shared workspaces linked to your account.</p>
    {query.isPending && <p role="status" className="mt-4">Checking your workspaces…</p>}
    {query.isError && <p role="alert" className="mt-4">{mayNeedSetup ? 'Workspaces could not be opened. If this is your first time here, set up your personal workspace.' : 'Workspaces could not be checked. Try refreshing.'}</p>}
    {page?.items.length === 0 && <p className="mt-4">{after ? 'No workspaces on this page.' : 'Your account has no workspaces yet.'}</p>}
    {page?.items.length > 0 && <ul className="mt-4 divide-y">
      {page.items.map(row => <li key={row.id} className="py-3">
        <p className="font-medium break-words">{row.name}</p>
        <p className="mt-1 text-sm text-slate-700">{row.isPersonal ? 'Personal workspace' : 'Shared workspace'} · {roleLabels[row.role]}</p>
      </li>)}
    </ul>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="min-h-11 rounded-lg border px-4" disabled={submitting || query.isFetching} onClick={() => { setMessage(null); query.refetch(); }}>Refresh workspaces</button>
      {after && <button type="button" className="min-h-11 rounded-lg border px-4" disabled={submitting} onClick={() => setAfter(null)}>First page</button>}
      {page?.next && <button type="button" className="min-h-11 rounded-lg border px-4" disabled={submitting} onClick={() => setAfter(page.next)}>Next page</button>}
      {canProvision && <button type="button" className="min-h-11 rounded-lg bg-blue-700 px-4 text-white disabled:opacity-60" disabled={submitting || query.isFetching} onClick={provision}>{busy ? 'Setting up…' : 'Set up personal workspace'}</button>}
    </div>
    {(page || mayNeedSetup) && <form className="mt-6 border-t pt-5" onSubmit={acceptInvitation}>
      <h2 className="text-lg font-semibold">Join a workspace</h2>
      <label htmlFor="workspace-invitation" className="mt-3 block text-sm font-medium">Invitation code</label>
      <input id="workspace-invitation" className="mt-1 block min-h-11 w-full max-w-md rounded-lg border px-3"
        autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={60} required
        value={invitation} onChange={event => { setInvitation(event.target.value); setMessage(null); }} disabled={submitting} />
      <button type="submit" className="mt-3 min-h-11 rounded-lg border px-4" disabled={submitting || !/^[A-Za-z0-9_-]{43}$/.test(invitation.trim())}>
        {joining ? 'Accepting…' : 'Accept invitation'}
      </button>
    </form>}
    {message && <p className="mt-4" role={message.error ? 'alert' : 'status'}>{message.text}</p>}
  </section>;
}
