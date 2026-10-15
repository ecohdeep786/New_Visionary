import React, { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { authDestination, authLink } from "@/lib/authReturnTo";
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Phone, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import BillingAuthNotice from "@/components/auth/BillingAuthNotice";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow, PhoneInput,
} from "@/components/auth/AuthUI";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { authErrorMessage } from '@/lib/authErrors';

export default function Register() {
  const { user, isAuthenticated, isLoadingAuth, checkUserAuth, authError } = useAuth();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [requirements, setRequirements] = useState(['Use at least 6 characters.']);

  if (isLoadingAuth) {
    return (
      <div data-font-surface="product" role="status" aria-label="Loading your account" aria-busy="true" className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <Spinner className="w-8 h-8 text-[#4285F4]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={authDestination(user)} replace />;
  }

  const checkEmailExists = async (emailToCheck) => {
    if (base44.auth.source === 'firebase') return false;
    try {
      const users = await base44.entities.User.filter({ email: emailToCheck });
      return users && users.length > 0;
    } catch {
      return false;
    }
  };

  const handleEmailContinue = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setError("This email is already registered. Try signing in instead.");
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
      setView(base44.auth.source === 'firebase' ? 'verification' : "otp");
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

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      navigate(authDestination(await checkUserAuth({ quiet: true })), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, 'That code could not be verified. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(authErrorMessage(err, 'The email could not be sent. Please try again.'));
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
            <Link to={authLink('/login')} className="text-[#4285F4] font-medium hover:underline">Sign in</Link>
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
            <Link to={authLink('/login')} className="text-[#4285F4] font-medium hover:underline">Sign in</Link>
          </>
        ),
      };

  const renderContent = () => {
    switch (view) {
      case 'verification': return <EmailVerification email={email} initialMessage={error} initialCooldown={error ? 0 : 60} onVerified={profile => navigate(authDestination(profile), { replace: true })} />;
      case "methods":
        return (
          <div key="methods" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
            <button type="button" onClick={() => { setError(""); setView("mobile"); }} className={primaryBtnClass}>
              <Phone className="w-4 h-4" /> Continue with Mobile Number
            </button>
            <button type="button" onClick={() => { setError(""); setView("email"); }} className={outlineBtnClass}>
              <Mail className="w-4 h-4" /> Continue with Email
            </button>
            <AuthDivider />
            <SocialAuthButtons onOrganization={() => { setError(""); setView("organization"); }} />
            {(error || authError) && <p role="alert" className="text-sm text-[#b3261e]">{error || authError.message}</p>}
            <p className="text-xs text-[#5f6368] text-center leading-relaxed mt-2">
              By continuing you agree to our{" "}
              <Link to="/privacy" className="text-[#4285F4] hover:underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link to="/terms" className="text-[#4285F4] hover:underline">Terms of Service</Link>.
            </p>
          </div>
        );

      case "email":
        return (
          <div key="email" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            {error && (
              <div className="p-4 rounded-lg bg-[#fce8e6] border border-red-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#ea4335] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#ea4335] font-medium">Email already registered</p>
                  <p className="text-xs text-[#ea4335] mt-1">{error}</p>
                  <Link to={authLink('/login')} className="text-xs text-[#4285F4] font-medium hover:underline mt-1.5 inline-block">
                    Sign in instead →
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
            {error && <div id="registration-error" role="alert" className="p-3 rounded-lg bg-[#fce8e6] text-[#ea4335] text-sm">{error}</div>}
            <form onSubmit={handleRegister} className="flex flex-col gap-6">
              <ul id="password-requirements" className="text-xs text-[#5f6368] list-disc pl-4">{requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
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
                    <div className="flex flex-col gap-2"><Link to={authLink('/login')} state={{ email }} className="text-sm text-[#4285F4] font-medium hover:underline">Sign in instead</Link><Link to="/forgot-password" state={{ email }} className="text-sm text-[#4285F4] font-medium hover:underline">Reset password</Link></div>
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

      case "otp":
        return (
          <div key="otp" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#e8f0fd] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#4285F4]" />
              </div>
              <h2 className="text-2xl font-normal text-[#121317]">Verify your email</h2>
              <p className="text-sm text-[#5f6368] mt-2 leading-relaxed">
                We sent a 6-digit code to <span className="font-medium text-[#121317]">{email}</span>
              </p>
            </div>
            {error && <div className="p-3 rounded-lg bg-[#fce8e6] text-[#ea4335] text-sm">{error}</div>}
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
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
            <div className="flex justify-center">
              <button type="button" onClick={handleVerify} disabled={loading || otpCode.length < 6} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : "Verify"}
              </button>
            </div>
            <p className="text-center text-sm text-[#5f6368]">
              Didn't receive the code?{" "}
              <button type="button" onClick={handleResend} className="text-[#4285F4] font-medium hover:underline">
                Resend
              </button>
            </p>
          </div>
        );

      case "mobile":
        return (
          <div key="mobile" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            <form onSubmit={(e) => { e.preventDefault(); setError("Mobile sign-up is coming soon. Please use email or social sign-up."); }} className="flex flex-col gap-6">
              <PhoneInput
                label="Mobile number"
                autoFocus
                value={phone}
                onChange={setPhone}
                required
              />
              {error && <div className="p-3 rounded-lg bg-[#ffffff] text-[#b06000] text-sm">{error}</div>}
              <ActionRow
                left={
                  <button type="button" onClick={goToMethods} className="text-sm text-[#4285F4] font-medium hover:underline">
                    Use another method
                  </button>
                }
              >
                <button type="submit" className={primaryBtnAutoClass}>Continue</button>
              </ActionRow>
            </form>
          </div>
        );

      case "organization":
        return (
          <div key="org" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            <form onSubmit={(e) => { e.preventDefault(); setError("Organization sign-up is coming soon. Please use email or social sign-up."); }} className="flex flex-col gap-6">
              <InputField
                label="Organization email"
                type="email"
                autoFocus
                placeholder="you@school.edu"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                required
              />
              {error && <div className="p-3 rounded-lg bg-[#ffffff] text-[#b06000] text-sm">{error}</div>}
              <ActionRow
                left={
                  <button type="button" onClick={goToMethods} className="text-sm text-[#4285F4] font-medium hover:underline">
                    Use another method
                  </button>
                }
              >
                <button type="submit" className={primaryBtnAutoClass}>Continue</button>
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
