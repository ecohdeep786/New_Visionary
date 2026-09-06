import { Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GoogleIcon from "@/components/GoogleIcon";

function AppleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

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

export default function SocialAuthButtons({ onOrganization }) {
  const handleSocial = (provider) => {
    try {
      base44.auth.loginWithProvider(provider, "/");
    } catch {
      // silent
    }
  };

  const btnClass =
    "w-12 h-12 rounded-xl border border-[#dadce0] bg-white flex items-center justify-center hover:bg-gray-50 hover:shadow-sm transition-all";

  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={() => handleSocial("google")} className={btnClass} aria-label="Continue with Google">
        <GoogleIcon className="w-5 h-5" />
      </button>
      <button onClick={() => handleSocial("microsoft")} className={btnClass} aria-label="Continue with Microsoft">
        <MicrosoftIcon className="w-5 h-5" />
      </button>
      <button onClick={() => handleSocial("apple")} className={btnClass} aria-label="Continue with Apple">
        <AppleIcon className="w-5 h-5 text-[#202124]" />
      </button>
      <button onClick={onOrganization} className={btnClass} aria-label="Continue with Organization">
        <Building2 className="w-5 h-5 text-[#5f6368]" />
      </button>
    </div>
  );
}