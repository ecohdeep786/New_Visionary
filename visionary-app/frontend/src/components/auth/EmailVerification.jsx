import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { authErrorMessage } from '@/lib/authErrors';
import { primaryBtnAutoClass, Spinner } from './AuthUI';
import { useAuth } from '@/lib/AuthContext';

export default function EmailVerification({ email, onVerified, initialMessage = '', initialCooldown = 0 }) {
  const { verifyEmail } = useAuth();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(initialMessage), [cooldown, setCooldown] = useState(initialCooldown);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000); return () => clearTimeout(timer); }, [cooldown]);
  const act = async verify => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setMessage('');
    try {
      if (verify) { const profile = await verifyEmail(); await onVerified(profile); }
      else { await base44.auth.resendVerification(); setCooldown(60); setMessage('Verification link sent. Check your inbox and spam folder.'); }
    } catch (error) { if (error.code === 'auth/verification-cooldown') setCooldown(60); setMessage(authErrorMessage(error)); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className="flex flex-col gap-6" aria-busy={busy}>
    <h2 className="text-2xl font-normal">Verify your email</h2>
    <p className="text-sm text-[#6e6e73]">Check {email} for a verification link, then return here. Check your spam folder too. If you closed this page or your sign-in expired, sign in again after verification.</p>
    {message && <p role="status" className="text-sm">{message}</p>}
    <button className={primaryBtnAutoClass} disabled={busy} onClick={() => act(true)}>{busy ? <Spinner /> : 'I verified my email'}</button>
    <button className="text-sm text-[#0066cc]" disabled={busy || cooldown > 0} onClick={() => act(false)}>{cooldown ? 'Resend available in ' + cooldown + 's' : 'Resend verification link'}</button>
    <Link to="/login" state={{ email }} className="text-sm text-[#0066cc] hover:underline">Sign in again</Link>
  </div>;
}
