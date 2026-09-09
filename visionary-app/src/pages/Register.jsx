import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { safeReturnTo } from "@/lib/authReturnTo";
import { Mail, Phone, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow, PhoneInput,
} from "@/components/auth/AuthUI";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const { isAuthenticated, isLoadingAuth, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <Spinner className="w-8 h-8 text-[#1a73e8]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard/home" replace />;
  }

  const checkEmailExists = async (emailToCheck) => {
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
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setView("otp");
    } catch (err) {
      const msg = err.message || "Registration failed";
      if (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("already")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(msg);
      }
    } finally {
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
      await checkUserAuth();
      navigate(safeReturnTo(), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid verification code");
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
      setError(err.message || "Failed to resend code");
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
            <Link to="/login" className="text-[#1a73e8] font-medium hover:underline">Sign in</Link>
          </>
        ),
      }
    : {
        title: "Create a Visionary account",
        supportingText: "Start your personalized learning journey today.",
        accountInfo: null,
        footer: (
          <>
            I already have an account.{" "}
            <Link to="/login" className="text-[#1a73e8] font-medium hover:underline">Sign in</Link>
          </>
        ),
      };

  const renderContent = () => {
    switch (view) {
      case "methods":
        return (
          <div key="methods" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
            <button onClick={() => { setError(""); setView("mobile"); }} className={primaryBtnClass}>
              <Phone className="w-4 h-4" /> Continue with Mobile Number
            </button>
            <button onClick={() => { setError(""); setView("email"); }} className={outlineBtnClass}>
              <Mail className="w-4 h-4" /> Continue with Email
            </button>
            <AuthDivider />
            <SocialAuthButtons onOrganization={() => { setError(""); setView("organization"); }} />
            <p className="text-xs text-[#5f6368] text-center leading-relaxed mt-2">
              By continuing you agree to our{" "}
              <span className="text-[#1a73e8] cursor-pointer hover:underline">Privacy Policy</span>
              {" "}and{" "}
              <span className="text-[#1a73e8] cursor-pointer hover:underline">Terms of Service</span>.
            </p>
          </div>
        );

      case "email":
        return (
          <div key="email" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#ea4335] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#ea4335] font-medium">Email already registered</p>
                  <p className="text-xs text-[#ea4335] mt-1">{error}</p>
                  <Link to="/login" className="text-xs text-[#1a73e8] font-medium hover:underline mt-1.5 inline-block">
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
            {error && !error.includes("already") && <div className="p-3 rounded-lg bg-red-50 text-[#ea4335] text-sm">{error}</div>}
            <form onSubmit={handleRegister} className="flex flex-col gap-6">
              <GooglePasswordField
                label="Create a password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <ActionRow
                left={
                  error && error.includes("already") ? (
                    <Link to="/login" className="text-sm text-[#1a73e8] font-medium hover:underline">
                      Sign in instead
                    </Link>
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
              <div className="w-14 h-14 rounded-full bg-[#e8f0fe] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#1a73e8]" />
              </div>
              <h2 className="text-2xl font-normal text-[#202124]">Verify your email</h2>
              <p className="text-sm text-[#5f6368] mt-2 leading-relaxed">
                We sent a 6-digit code to <span className="font-medium text-[#202124]">{email}</span>
              </p>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-50 text-[#ea4335] text-sm">{error}</div>}
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
              <button onClick={handleVerify} disabled={loading || otpCode.length < 6} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : "Verify"}
              </button>
            </div>
            <p className="text-center text-sm text-[#5f6368]">
              Didn't receive the code?{" "}
              <button onClick={handleResend} className="text-[#1a73e8] font-medium hover:underline">
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
              {error && <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">{error}</div>}
              <ActionRow
                left={
                  <button onClick={goToMethods} className="text-sm text-[#1a73e8] font-medium hover:underline">
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
              {error && <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">{error}</div>}
              <ActionRow
                left={
                  <button onClick={goToMethods} className="text-sm text-[#1a73e8] font-medium hover:underline">
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
      {renderContent()}
    </AuthLayout>
  );
}