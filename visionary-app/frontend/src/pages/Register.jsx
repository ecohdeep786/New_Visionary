import React, { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { authDestination, authLink } from "@/lib/authReturnTo";
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Phone } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import BillingAuthNotice from "@/components/auth/BillingAuthNotice";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow,
} from "@/components/auth/AuthUI";
import { useAuth } from "@/lib/AuthContext";
import { authErrorMessage } from '@/lib/authErrors';
import PhoneAuth from '@/components/auth/PhoneAuth';
import useSignInMethods from '@/hooks/useSignInMethods';

/**
 * Register — Firebase is the only identity source (FAP-93). Every registration
 * creates the account with the connected identity provider and continues to
 * the real email-verification step (EmailVerification). There is no simulated
 * OTP step: no local code entry, no "Code sent" resend, and no local account
 * store to pre-check existence — a duplicate address surfaces at the create
 * step as auth/email-already-in-use with its "Sign in instead" actions.
 */
export default function Register() {
  const { user, isAuthenticated, isLoadingAuth, authError } = useAuth();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const { phone: phoneEnabled } = useSignInMethods();
  const [requirements, setRequirements] = useState(['Use at least 6 characters.']);

  if (isLoadingAuth) {
    return (
      <div data-font-surface="product" role="status" aria-label="Loading your account" aria-busy="true" className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Spinner className="w-8 h-8 text-[#0066cc]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={authDestination(user)} replace />;
  }

  const handleEmailContinue = (e) => {
    e.preventDefault();
    setError("");
    setView("password");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) { setError('Choose a password with at least 6 characters.'); return; }
    submitting.current = true; setDuplicate(false);
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setPassword(''); setConfirmPassword('');
      setView('verification');
    } catch (err) {
      if (err.registrationCreated) { setPassword(''); setConfirmPassword(''); setView('verification'); }
      setDuplicate(err.code === 'auth/email-already-in-use');
      if (Array.isArray(err.requirements)) setRequirements(err.requirements);
      setError(authErrorMessage(err, 'Your account could not be created. Please try again.'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const goToMethods = () => {
    setError("");
    setView("methods");
  };

  const layoutProps = view === "password"
    ? {
        title: "Create a Visionary account",
        supportingText: null,
        accountInfo: email,
        footer: (
          <>
            I already have an account.{" "}
            <Link to={authLink('/login')} className="text-[#0066cc] font-medium hover:underline">Sign in</Link>
          </>
        ),
      }
    : {
        title: "Create a Visionary account",
        supportingText: "Start a learning journey shaped around you.",
        accountInfo: null,
        footer: (
          <>
            I already have an account.{" "}
            <Link to={authLink('/login')} className="text-[#0066cc] font-medium hover:underline">Sign in</Link>
          </>
        ),
      };

  const renderContent = () => {
    switch (view) {
      case 'verification': return <EmailVerification email={email} initialMessage={error} initialCooldown={error ? 0 : 60} onVerified={profile => navigate(authDestination(profile), { replace: true })} />;
      case 'phone': return <PhoneAuth onBack={() => setView('methods')} />;
      case "methods":
        return (
          <div key="methods" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
            <button type="button" onClick={() => { setError(""); setView("email"); }} className={primaryBtnClass}>
              <Mail className="w-4 h-4" /> Continue with Email
            </button>
            {phoneEnabled && <button type="button" onClick={() => setView('phone')} className={outlineBtnClass}><Phone className="w-4 h-4" /> Continue with phone</button>}
            <AuthDivider />
            <SocialAuthButtons />
            {(error || authError) && <p role="alert" className="text-sm text-[#e30000]">{error || authError.message}</p>}
            <p className="text-xs text-[#6e6e73] text-center leading-relaxed mt-2">
              By continuing you agree to our{" "}
              <Link to="/privacy" className="text-[#0066cc] hover:underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link to="/terms" className="text-[#0066cc] hover:underline">Terms of Service</Link>.
            </p>
          </div>
        );

      case "email":
        return (
          <div key="email" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            <form onSubmit={handleEmailContinue} className="flex flex-col gap-6">
              <InputField
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                  {loading ? <Spinner /> : "Continue"}
                </button>
              </div>
            </form>
          </div>
        );

      case "password":
        return (
          <div key="password" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={() => setView("email")} />
            {error && <div id="registration-error" role="alert" className="p-3 rounded-lg bg-[#fce8e6] text-[#e30000] text-sm">{error}</div>}
            <form onSubmit={handleRegister} className="flex flex-col gap-6">
              <ul id="password-requirements" className="text-xs text-[#6e6e73] list-disc pl-4">{requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
              <GooglePasswordField
                label="Create a password"
                disabled={loading}
                invalid={!!error}
                describedBy="password-requirements"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputField
                label="Confirm password"
                disabled={loading}
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <ActionRow
                left={
                  duplicate ? (
                    <div className="flex flex-col gap-2"><Link to={authLink('/login')} state={{ email }} className="text-sm text-[#0066cc] font-medium hover:underline">Sign in instead</Link><Link to="/forgot-password" state={{ email }} className="text-sm text-[#0066cc] font-medium hover:underline">Reset password</Link></div>
                  ) : null
                }
              >
                <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                  {loading ? <Spinner /> : "Create account"}
                </button>
              </ActionRow>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout {...layoutProps}>
      <BillingAuthNotice action={view === 'verification' ? 'Verify your email' : 'Create an account'} />
      {renderContent()}
    </AuthLayout>
  );
}
