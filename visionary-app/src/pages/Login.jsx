import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, AlertCircle, RefreshCw, UserRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import {
  primaryBtnClass, primaryBtnAutoClass, outlineBtnClass,
  Spinner, AuthDivider, BackButton, InputField, GooglePasswordField, ActionRow, PhoneInput,
} from "@/components/auth/AuthUI";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [view, setView] = useState("methods");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
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
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Incorrect password");
      setView("wrongPassword");
    } finally {
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
        title: "Welcome",
        supportingText: null,
        accountInfo: email,
        footer: (
          <>
            Don't have an account?{" "}
            <Link to="/register" className="text-[#1a73e8] font-medium hover:underline">Create account</Link>
          </>
        ),
      }
    : {
        title: "Sign in",
        supportingText: "Use your Visionary Account",
        accountInfo: null,
        footer: (
          <>
            Don't have an account?{" "}
            <Link to="/register" className="text-[#1a73e8] font-medium hover:underline">Create account</Link>
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
            <div className="text-center mt-1">
              <Link to="/forgot-user-id" className="text-sm text-[#1a73e8] font-medium hover:underline">
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
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#ea4335] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#ea4335] font-medium">Account not found</p>
                  <p className="text-xs text-[#ea4335] mt-1">{error}</p>
                  <Link to="/register" className="text-xs text-[#1a73e8] font-medium hover:underline mt-1.5 inline-block">
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
                  <Link to="/forgot-user-id" className="text-sm text-[#1a73e8] font-medium hover:underline">
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
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <GooglePasswordField
                label="Enter your password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <ActionRow
                left={
                  <Link to="/forgot-password" className="text-sm text-[#1a73e8] font-medium hover:underline">
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
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#ea4335] shrink-0 mt-0.5" />
              <p className="text-sm text-[#ea4335]">The password you entered is incorrect. Please try again or use another method to sign in.</p>
            </div>
            <ActionRow
              left={
                <Link to="/forgot-password" className="text-sm text-[#1a73e8] font-medium hover:underline">
                  Forgot password?
                </Link>
              }
            >
              <button onClick={() => { setPassword(""); setError(""); setView("password"); }} className={primaryBtnAutoClass}>
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </ActionRow>
            <div className="flex flex-col gap-3 mt-2">
              <button onClick={goToMethods} className={outlineBtnClass}>
                Sign in with another method
              </button>
              <button onClick={useAnotherAccount} className="flex items-center justify-center gap-2 text-sm text-[#1a73e8] font-medium hover:underline self-center">
                <UserRound className="w-4 h-4" /> Use another account
              </button>
            </div>
          </div>
        );

      case "mobile":
        return (
          <div key="mobile" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
            <BackButton onClick={goToMethods} />
            <form onSubmit={(e) => { e.preventDefault(); setError("Mobile sign-in is coming soon. Please use email or social sign-in."); }} className="flex flex-col gap-6">
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
            <form onSubmit={(e) => { e.preventDefault(); setError("Organization sign-in is coming soon. Please use email or social sign-in."); }} className="flex flex-col gap-6">
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