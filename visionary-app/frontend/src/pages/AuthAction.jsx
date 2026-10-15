import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { authErrorMessage } from '@/lib/authErrors';
import AuthLayout from '@/components/AuthLayout';
import { primaryBtnAutoClass, Spinner } from '@/components/auth/AuthUI';

export default function AuthAction() {
  const [search] = useSearchParams(), mode = search.get('mode'), code = search.get('oobCode');
  const [state, setState] = useState('checking'), [message, setMessage] = useState('');
  const pending = useRef(null);
  useEffect(() => {
    if (mode !== 'verifyEmail' || !code || base44.auth.source !== 'firebase') { setState('invalid'); return; }
    let active = true;
    // Reuse the one action promise during StrictMode's effect replay.
    if (pending.current?.code !== code) pending.current = { code, promise: base44.auth.applyEmailVerification(code) };
    pending.current.promise.then(() => { if (active) setState('success'); }).catch(error => {
      if (active) { setState('invalid'); setMessage(authErrorMessage(error)); }
    });
    return () => { active = false; };
  }, [mode, code]);
  if (mode === 'resetPassword' && code) return <Navigate to={`/reset-password?oobCode=${encodeURIComponent(code)}`} replace />;
  return <AuthLayout title={state === 'success' ? 'Email verified' : 'Verify your email'}>
    <div className="flex flex-col gap-6">
      {state === 'checking' && <p role="status" className="flex gap-2"><Spinner /> Checking your verification link…</p>}
      {state === 'success' && <p role="status">Your email is verified. Sign in to continue, or return to the registration tab.</p>}
      {state === 'invalid' && <p role="alert">{message || 'This verification link is incomplete. Sign in to request another email.'}</p>}
      <Link to="/login" className={primaryBtnAutoClass}>Sign in</Link>
    </div>
  </AuthLayout>;
}
