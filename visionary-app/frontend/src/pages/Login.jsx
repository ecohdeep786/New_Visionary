import React, { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { authDestination, authLink } from "@/lib/authReturnTo";
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Phone, AlertCircle, RefreshCw, UserRound, Smartphone } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import BillingAuthNotice from "@/components/auth/BillingAuthNotice";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow, PhoneInput,
} from "@/components/auth/AuthUI";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/AuthContext";
import { authErrorMessage, isCredentialError } from '@/lib/authErrors';
import { signInMethods } from '@/api/firebase/signInMethods';

export default function Login() {
  const { user, isAuthenticated, isLoadingAuth, checkUserAuth, signInViaEmailPassword, confirmPhoneSignIn, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = useRef(false);
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState(typeof location.state?.email === 'string' ? location.state.email.slice(0, 320) : "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Real mobile sign-in rides on Firebase phone verification. The option stays
  // hidden until both the connected identity source and the environment enable
  // it; preview builds and the local demo never show a dead choice.
  const phoneEnabled = signInMethods.mobile && base44.auth.source === 'firebase' && import.meta.env?.VITE_ENABLE_PHONE_SIGNIN === '1';

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
    if (base44.auth.source === 'firebase') return true;
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

  const handlePhoneRequest = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    setError("");
    const phoneE164 = phone.replace(/\s+/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phoneE164)) {
      setError(authErrorMessage({ code: 'auth/invalid-phone-number' }));
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      const result = await base44.auth.requestPhoneSignIn(phoneE164);
      if (result?.verification === 'phone-sms' && result.confirmation) {
        setConfirmation(result.confirmation);
        setOtpCode("");
        setView("phoneCode");
      } else {
        setError(authErrorMessage({ code: 'auth/phone-sign-in-unavailable' }));
      }
    } catch (err) {
      setError(authErrorMessage(err, 'The sign-in code could not be sent. Please try again.'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handlePhoneConfirm = async () => {
    if (submitting.current || !confirmation) return;
    submitting.current = true;
    setError("");
    setLoading(true);
    try {
      const profile = await confirmPhoneSignIn(confirmation, otpCode);
      navigate(authDestination(profile), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, 'The sign-in code could not be verified. Please try again.'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
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
        supportingText: "Continue with Google, or use your email and password. Your sign-in is remembered on this browser; sign out on shared devices.",
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
      case "methods":
        return (
          <div key="methods" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
            {phoneEnabled && (
              <button type="button" onClick={() => { setError(""); setView("mobile"); }} className={primaryBtnClass}>
                <Phone className="w-4 h-4" /> Continue with Mobile Number
              </button>
            )}
            <button type="button" onClick={() => { setError(""); setView("email"); }} className={phoneEnabled ? outlineBtnClass : primaryBtnClass}>
              <Mail className="w-4 h-4" /> Continue with Email
            </button>
            {!phoneEnabled && <button type="button" disabled={!signInMethods.mobile} aria-describedby="mobile-unavailable" className={`${outlineBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
              <Phone className="w-4 h-4" /> Mobile sign-in unavailable
            </button>}
            {!phoneEnabled && <p id="mobile-unavailable" className="text-xs text-[#6e6e73] text-center">Mobile number sign-in is unavailable. Use another method below or email above.</p>}
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

      case "mobile":
        return (
          <div key="mobile" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            {error && <p role="alert" className="text-sm text-[#e30000]">{error}</p>}
            <form onSubmit={handlePhoneRequest} className="flex flex-col gap-6">
              <PhoneInput
                label="Mobile number"
                autoFocus
                value={phone}
                onChange={setPhone}
                required
              />
              <p className="text-xs text-[#6e6e73] -mt-4 leading-relaxed">We'll text you a sign-in code. Standard message rates may apply.</p>
              <ActionRow
                left={
                  <button type="button" onClick={goToMethods} className="text-sm text-[#0066cc] font-medium hover:underline">
                    Use another method
                  </button>
                }
              >
                <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                  {loading ? <Spinner /> : "Send code"}
                </button>
              </ActionRow>
            </form>
          </div>
        );

      case "phoneCode":
        return (
          <div key="phoneCode" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,102,204,0.10)] flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-[#0066cc]" />
              </div>
              <h2 className="text-2xl font-normal text-[#1d1d1f]">Enter the sign-in code</h2>
              <p className="text-sm text-[#6e6e73] mt-2 leading-relaxed">
                We sent a 6-digit code by SMS to <span className="font-medium text-[#1d1d1f]">{phone}</span>
              </p>
            </div>
            {error && <div id="phone-login-error" role="alert" className="p-3 rounded-lg bg-[#fce8e6] text-[#e30000] text-sm">{error}</div>}
            <div className="flex justify-center">
              <InputOTP maxLength={6} containerClassName="c1-phone-otp" value={otpCode} onChange={setOtpCode} autoComplete="one-time-code" autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <ActionRow
              left={
                <button type="button" disabled={loading} onClick={() => { setError(""); setView("mobile"); }} className="text-sm text-[#0066cc] font-medium hover:underline">
                  Change number
                </button>
              }
            >
              <button type="button" disabled={loading || otpCode.length < 6} onClick={handlePhoneConfirm} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : "Verify"}
              </button>
            </ActionRow>
            <p className="text-center text-sm text-[#6e6e73]">
              Didn't get the code?{" "}
              <button type="button" disabled={loading} onClick={handlePhoneRequest} className="text-[#0066cc] font-medium hover:underline">
                Resend code
              </button>
            </p>
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
      {phoneEnabled && <div id="auth-recaptcha" aria-hidden="true" />}
    </AuthLayout>
  );
}
