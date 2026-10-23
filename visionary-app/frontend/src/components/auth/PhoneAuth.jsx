import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { authDestination } from '@/lib/authReturnTo';
import { authErrorMessage } from '@/lib/authErrors';
import { BackButton, InputField, Spinner, primaryBtnClass, outlineBtnClass } from './AuthUI';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function PhoneAuth({ onBack }) {
  const navigate = useNavigate(), { confirmPhoneSignIn } = useAuth();
  const [phone, setPhone] = useState('+91'), [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [retryAt, setRetryAt] = useState(0), [now, setNow] = useState(Date.now);
  const lock = useRef(false), mounted = useRef(true);
  const verifierId = 'phone-verifier-' + useId().replaceAll(':', '');
  const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { mounted.current = false; clearInterval(timer); appClient.auth.cancelPhoneSignIn?.(); };
  }, []);
  const requestCode = async event => {
    event?.preventDefault();
    if (lock.current || retrySeconds) return;
    const number = phone.replace(/[\s()-]/g, '');
    if (!/^\+91[6-9]\d{9}$/.test(number)) { setError('Enter an Indian mobile number with +91 and 10 digits.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await appClient.auth.requestPhoneSignIn(number, verifierId);
      if (!mounted.current) return;
      if (!result?.confirmation) throw { code: 'auth/phone-sign-in-unavailable' };
      setPhone(number); setConfirmation(result.confirmation); setCode('');
      setRetryAt(Date.now() + 60000); setNow(Date.now());
    } catch (failure) { if (mounted.current) setError(authErrorMessage(failure, 'The code could not be sent. Try again.')); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  const confirmCode = async event => {
    event.preventDefault();
    if (lock.current || !confirmation || code.length !== 6) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const profile = await confirmPhoneSignIn(confirmation, code);
      if (mounted.current) navigate(authDestination(profile), { replace: true });
    } catch (failure) { if (mounted.current) { setError(authErrorMessage(failure, 'The code could not be verified. Try again.')); setCode(''); } }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <div className="flex flex-col gap-5">
    <BackButton disabled={busy} onClick={onBack} />
    <p className="text-sm leading-6 text-[#6e6e73]">{confirmation ? `Enter the 6-digit code sent to ${phone}.` : 'Use an Indian mobile number (+91). We’ll send a verification code by SMS.'}</p>
    {error && <p id="phone-auth-error" role="alert" className="text-sm text-[#e30000]">{error}</p>}
    {confirmation ? <form onSubmit={confirmCode} className="flex flex-col gap-5">
      <label htmlFor={`${verifierId}-code`} className="sr-only">SMS verification code</label>
      <InputOTP id={`${verifierId}-code`} maxLength={6} value={code} onChange={value => setCode(value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" disabled={busy} aria-describedby={error ? 'phone-auth-error' : undefined} autoFocus>
        <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map(index => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
      </InputOTP>
      <button type="submit" disabled={busy || code.length !== 6} className={primaryBtnClass}>{busy ? <Spinner /> : 'Verify and continue'}</button>
      <button type="button" disabled={busy || retrySeconds > 0} onClick={requestCode} className={outlineBtnClass}>{retrySeconds ? `Resend code in ${retrySeconds}s` : 'Resend code'}</button>
      <button type="button" disabled={busy} onClick={() => { setConfirmation(null); setCode(''); setError(''); }} className="min-h-11 text-sm text-[#0066cc]">Change number</button>
    </form> : <form onSubmit={requestCode} className="flex flex-col gap-5">
      <InputField label="Mobile number" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} disabled={busy} required autoFocus invalid={!!error} describedBy={error ? 'phone-auth-error' : undefined} />
      <p className="text-xs leading-5 text-[#6e6e73]">Google processes this number for verification and abuse prevention. Standard SMS rates may apply.</p>
      <p className="text-xs leading-5 text-[#6e6e73]">A new number creates a separate account. To return to an email or Google account, use its original sign-in method.</p>
      <button type="submit" disabled={busy || retrySeconds > 0} className={primaryBtnClass}>{busy ? <Spinner /> : retrySeconds ? `Send code in ${retrySeconds}s` : 'Send code'}</button>
    </form>}
    <div id={verifierId} />
  </div>;
}
