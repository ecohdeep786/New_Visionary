import { useRef, useState } from 'react';
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authDestination } from '@/lib/authReturnTo';
import { authErrorMessage } from '@/lib/authErrors';
import { signInMethods } from '@/api/firebase/signInMethods';

function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

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

  const btnClass =
    "w-12 h-12 rounded-xl border border-[#d2d2d7] bg-white flex items-center justify-center enabled:hover:bg-[#f5f5f7] enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all";

  return (
    <div><div className="flex items-center justify-center gap-3">
      <button type="button" disabled={busy || !signInMethods.google} onClick={() => handleSocial("google")} className={btnClass} aria-label="Continue with Google">
        <GoogleIcon className="w-5 h-5" />
      </button>
      <button type="button" disabled={!signInMethods.microsoft} className={btnClass} aria-label="Microsoft sign-in unavailable" aria-describedby="unavailable-social-methods">
        <MicrosoftIcon className="w-5 h-5" />
      </button>
      <button type="button" disabled={!signInMethods.organization} className={btnClass} aria-label="Organization sign-in unavailable" aria-describedby="unavailable-social-methods">
        <Building2 className="w-5 h-5 text-[#6e6e73]" />
      </button>
    </div><p id="unavailable-social-methods" className="mt-3 text-xs text-[#6e6e73] text-center">Microsoft and organization sign-in are unavailable. Use email or Google.</p>{error && <p role="alert" className="mt-3 text-sm text-[#b3261e]">{error}</p>}</div>
  );
}
