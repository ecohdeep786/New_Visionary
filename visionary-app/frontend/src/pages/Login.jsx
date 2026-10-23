import React, { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { authDestination, authLink } from "@/lib/authReturnTo";
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Phone, AlertCircle, RefreshCw, UserRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import BillingAuthNotice from "@/components/auth/BillingAuthNotice";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow,
} from "@/components/auth/AuthUI";
import { useAuth } from "@/lib/AuthContext";
import { authErrorMessage, isCredentialError } from '@/lib/authErrors';
import PhoneAuth from '@/components/auth/PhoneAuth';
import useSignInMethods from '@/hooks/useSignInMethods';

export default function Login() {
  const { user, isAuthenticated, isLoadingAuth, checkUserAuth, signInViaEmailPassword, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = useRef(false);
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState(typeof location.state?.email === 'string' ? location.state.email.slice(0, 320) : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { phone: phoneEnabled } = useSignInMethods();

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

  const checkEmailExists = async (emailToCheck) => {
    if (import.meta.env.DEV || base44.auth.source === 'firebase') return true;
    try {
      const users = await base44.entities.User.filter({ email: emailToCheck });
      return users && users.length > 0;
    } catch {
      return true;
    }
  };

  const handleEmailContinue = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        setError("Couldn't find your Visionary Account. Try a different email or create a new account.");
        setLoading(false);
        return;
      }
      setView("password");
    } catch {
      setView("password");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setLoading(true);
    try {
      const profile = await signInViaEmailPassword(email, password);
      navigate(authDestination(profile), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, 'Sign-in could not finish. Please try again.'));
      setView(err.code === 'auth/email-not-verified' ? 'verification' : isCredentialError(err) ? 'wrongPassword' : 'password');
      if (isCredentialError(err)) setPassword('');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const goToMethods = () => {
    setError("");
    setView("methods");
  };

  const useAnotherAccount = () => {
    setEmail("");
    setPassword("");
    setError("");
    setView("email");
  };

  const isPasswordView = view === "password" || view === "wrongPassword";

  const layoutProps = isPasswordView
    ? {
        title: "Enter your password",
        supportingText: null,
        accountInfo: email,
        footer: (
          <>
            Don't have an account?{" "}
            <Link to={authLink('/register')} className="text-[#0066cc] font-medium hover:underline">Create account</Link>
          </>
        ),
      }
    : {
        title: "Sign in to Visionary",
        supportingText: phoneEnabled ? 'Use email, your phone number, or Google.' : 'Use email or Google to continue.',
        accountInfo: null,
        footer: (
          <>
            Don't have an account?{" "}
            <Link to={authLink('/register')} className="text-[#0066cc] font-medium hover:underline">Create account</Link>
          </>
        ),
      };

  const renderContent = () => {
    switch (view) {
      case 'verification': return <EmailVerification email={email} onVerified={profile => navigate(authDestination(profile), { replace: true })} />;
      case 'phone': return <PhoneAuth onBack={goToMethods} />;
      case "methods":
        return (
          <div key="methods" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
            <button type="button" onClick={() => { setError(''); setView('email'); }} className={primaryBtnClass}><Mail className="w-4 h-4" /> Continue with Email</button>
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
            <div className="text-center mt-1">
              <Link to="/forgot-user-id" className="text-sm text-[#0066cc] font-medium hover:underline">
                Forgot email or user ID?
              </Link>
            </div>
          </div>
        );

      case "email":
        return (
          <div key="email" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            {error && (
              <div className="p-4 rounded-lg bg-[#fce8e6] border border-red-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#e30000] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#e30000] font-medium">Account not found</p>
                  <p className="text-xs text-[#e30000] mt-1">{error}</p>
                  <Link to={authLink('/register')} className="text-xs text-[#0066cc] font-medium hover:underline mt-1.5 inline-block">
                    Create a new account →
                  </Link>
                </div>
              </div>
            )}
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
              <ActionRow
                left={
                  <Link to="/forgot-user-id" className="text-sm text-[#0066cc] font-medium hover:underline">
                    Forgot email?
                  </Link>
                }
              >
                <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                  {loading ? <Spinner /> : "Continue"}
                </button>
              </ActionRow>
            </form>
          </div>
        );

      case "password":
        return (
          <div key="password" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={() => setView("email")} />
            {error && <p id="login-error" role="alert" className="text-sm text-[#e30000]">{error}</p>}
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <GooglePasswordField
                label="Enter your password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                invalid={!!error}
                describedBy={error ? 'login-error' : undefined}
              />
              <ActionRow
                left={
                  <Link to="/forgot-password" className="text-sm text-[#0066cc] font-medium hover:underline">
                    Forgot password?
                  </Link>
                }
              >
                <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                  {loading ? <Spinner /> : "Sign in"}
                </button>
              </ActionRow>
            </form>
          </div>
        );

      case "wrongPassword":
        return (
          <div key="wrong" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={() => { setPassword(""); setError(""); setView("password"); }} />
            <div className="p-4 rounded-lg bg-[#fce8e6] border border-red-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#e30000] shrink-0 mt-0.5" />
              <p role="alert" className="text-sm text-[#e30000]">{error}</p>
            </div>
            <ActionRow
              left={
                <Link to="/forgot-password" className="text-sm text-[#0066cc] font-medium hover:underline">
                  Forgot password?
                </Link>
              }
            >
              <button type="button" onClick={() => { setPassword(""); setError(""); setView("password"); }} className={primaryBtnAutoClass}>
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </ActionRow>
            <div className="flex flex-col gap-3 mt-2">
              <button type="button" onClick={goToMethods} className={outlineBtnClass}>
                Sign in with another method
              </button>
              <button type="button" onClick={useAnotherAccount} className="flex items-center justify-center gap-2 text-sm text-[#0066cc] font-medium hover:underline self-center">
                <UserRound className="w-4 h-4" /> Use another account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout {...layoutProps}>
      <BillingAuthNotice action={view === 'verification' ? 'Verify your email' : 'Sign in'} />
      {renderContent()}
    </AuthLayout>
  );
}
