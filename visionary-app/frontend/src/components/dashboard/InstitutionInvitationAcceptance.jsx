import { useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { createInstitutionInvitationClient } from '@/services/institutionInvitationClient';

const errors = {
  400: 'Enter a valid invitation code.',
  401: 'Sign in with your current verified email to accept the invitation.',
  403: 'This account cannot accept the invitation. Check your admission status.',
  404: 'This invitation is unavailable for your verified email.',
  409: 'The account or invitation changed. Reload Connections and try again.',
  410: 'This invitation has expired or was revoked. Ask the sender for a new code.',
  429: 'Too many attempts. Wait a minute and try again.',
};

export default function InstitutionInvitationAcceptance({ accountId }) {
  const [state, setState] = useState({ busy: false, notice: '', error: false });
  const active = useRef(false);
  const pending = useRef(false);
  const client = useMemo(() => createInstitutionInvitationClient({
    getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null,
  }), [accountId]);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function accept(event) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const token = String(new FormData(form).get('invitationCode') ?? '').trim();
    form.reset();
    pending.current = true;
    setState({ busy: true, notice: '', error: false });
    try {
      const receipt = await client.accept(token);
      if (active.current) {
        setState({ busy: false, notice: receipt.replay ? 'This invitation was already accepted.' : 'Institution invitation accepted.', error: false });
      }
    } catch (error) {
      if (active.current) setState({ busy: false, notice: errors[error?.status] ?? 'Institution invitations are unavailable. Try again later.', error: true });
    } finally {
      pending.current = false;
    }
  }

  return <section className="v-card" lang="en" aria-labelledby="institution-invitation-title">
    <h2 id="institution-invitation-title" className="text-lg font-medium">Accept an institution invitation</h2>
    <p className="v-muted mt-3">Enter the code from your institution using the account it invited.</p>
    <form className="mt-4" onSubmit={accept}>
      <label className="block text-sm font-medium" htmlFor="institution-invitation-code">Invitation code</label>
      <input id="institution-invitation-code" name="invitationCode" type="password" required maxLength={43}
        autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-xl border border-[#5f6368] bg-white p-3 text-sm" />
      <button type="submit" disabled={state.busy} className="v-button mt-3">{state.busy ? 'Accepting…' : 'Accept invitation'}</button>
    </form>
    {state.notice && <p role={state.error ? 'alert' : 'status'} className="mt-3 text-sm">{state.notice}</p>}
  </section>;
}
