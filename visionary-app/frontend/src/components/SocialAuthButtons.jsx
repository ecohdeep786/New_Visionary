import { useRef, useState } from 'react';
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authDestination } from '@/lib/authReturnTo';
import { authErrorMessage } from '@/lib/authErrors';
import { signInMethods } from '@/api/firebase/signInMethods';
import { outlineBtnClass } from '@/components/auth/AuthUI';

export default function SocialAuthButtons() {
  const { signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const handleSocial = async (provider) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError('');
    try {
      navigate(authDestination(await signInWithProvider(provider)), { replace: true });
    } catch (cause) { setError(authErrorMessage(cause, 'Sign-in could not finish. Please try again.')); }
    finally { pending.current = false; setBusy(false); }
  };

  return (
    <div>
      <button type="button" disabled={busy || !signInMethods.google} onClick={() => handleSocial("google")} className={outlineBtnClass}>
        <GoogleIcon className="w-5 h-5" /> Continue with Google
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-[#e30000]">{error}</p>}
    </div>
  );
}
