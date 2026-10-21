import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { authErrorMessage, invalidEmailAction } from '@/lib/authErrors';
import AuthLayout from '@/components/AuthLayout';
import { primaryBtnAutoClass, Spinner, InputField, GooglePasswordField } from '@/components/auth/AuthUI';

export default function ResetPassword() {
  const [search] = useSearchParams(), code = search.get('oobCode') || search.get('token');
  const { checkUserAuth, logout } = useAuth();
  const pending = useRef(false);
  const [state, setState] = useState(code ? 'checking' : 'invalid'), [email, setEmail] = useState('');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [requirements, setRequirements] = useState(['Use at least 6 characters.']);
  useEffect(() => {
    let active = true;
    if (!code) { setState('invalid'); return; }
    setState('checking'); setError('');
    const verify = base44.auth.source === 'firebase' ? base44.auth.verifyResetLink(code) : Promise.resolve('');
    verify.then(address => { if (active) { setEmail(address); setState('ready'); } }).catch(cause => {
      if (active) { setState(invalidEmailAction(cause) ? 'invalid' : 'unavailable'); setError(authErrorMessage(cause)); }
    });
    return () => { active = false; };
  }, [code]);
  const submit = async event => {
    event.preventDefault(); if (pending.current || state !== 'ready') return;
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Choose a password with at least 6 characters.'); return; }
    pending.current = true; setBusy(true);
    try {
      await base44.auth.resetPassword({ resetToken: code, newPassword: password });
      setPassword(''); setConfirm(''); setState('success'); await checkUserAuth({ quiet: true });
    } catch (cause) {
      if (cause.resetCompleted) { setPassword(''); setConfirm(''); setState('sign-out'); }
      else if (invalidEmailAction(cause)) setState('invalid');
      if (Array.isArray(cause.requirements)) setRequirements(cause.requirements);
      setError(authErrorMessage(cause, 'Your password could not be reset. Please try again.'));
    } finally { pending.current = false; setBusy(false); }
  };
  const finishSignOut = async () => {
    if (pending.current) return; pending.current = true; setBusy(true); setError('');
    try { await logout(); setState('success'); } catch (cause) { setError(authErrorMessage(cause)); }
    finally { pending.current = false; setBusy(false); }
  };
  return <AuthLayout title={state === 'success' || state === 'sign-out' ? 'Password updated' : state === 'invalid' ? 'Request a new reset link' : 'Set a new password'} accountInfo={email || null} supportingText="Your saved account and learning setup will be kept.">
    <div className="flex flex-col gap-6" aria-busy={busy || state === 'checking'}>
      {error && <p role="alert" id="reset-error" className="text-sm text-[#b3261e]">{error}</p>}
      {state === 'checking' && <p role="status" className="flex items-center gap-2"><Spinner /> Checking your reset link…</p>}
      {state === 'invalid' && <><p className="text-sm text-[#6e6e73]">This link is missing, expired or already used. Request a new email to continue.</p><Link to="/forgot-password" state={{ email }} className={primaryBtnAutoClass}>Request new link</Link></>}
      {state === 'unavailable' && <><p className="text-sm">We could not check this link. Your password has not been changed.</p><button className={primaryBtnAutoClass} onClick={() => window.location.reload()}>Try again</button></>}
      {state === 'ready' && <form onSubmit={submit} className="flex flex-col gap-6">
        <GooglePasswordField label="New password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} invalid={!!error} describedBy="reset-requirements" autoFocus required />
        <InputField label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} disabled={busy} required />
        <ul id="reset-requirements" className="text-xs text-[#6e6e73] list-disc pl-4">{requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
        <p className="text-xs text-[#6e6e73]">After the reset, sign in again with your new password.</p>
        <button type="submit" disabled={busy} className={primaryBtnAutoClass}>{busy ? <Spinner /> : 'Reset password'}</button>
      </form>}
      {state === 'success' && <><p role="status">Your password has been updated. Sign in with your new password.</p><Link to="/login" state={{ email }} className={primaryBtnAutoClass}>Sign in</Link></>}
      {state === 'sign-out' && <><p role="status">Your password has been updated. Finish signing out of this browser before continuing.</p><button disabled={busy} onClick={finishSignOut} className={primaryBtnAutoClass}>Finish signing out</button></>}
      {state !== 'sign-out' && <Link to="/login" className="text-sm text-[#0066cc] hover:underline">Back to sign in</Link>}
    </div>
  </AuthLayout>;
}
