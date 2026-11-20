import React, { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { primaryBtnAutoClass, Spinner, InputField, BackButton, ActionRow } from "@/components/auth/AuthUI";
import { authErrorMessage } from '@/lib/authErrors';
import { authLink } from '@/lib/authReturnTo';

/**
 * ForgotPassword — Firebase is the only identity source (FAP-93). There is no
 * local reset token to fabricate: the request goes to the connected transport
 * and the success step keeps its anti-enumeration "Check your email" view —
 * no "reset link created" claim, no token continuation link. /reset-password
 * still accepts the historical ?token param (FAP-85 regression guard).
 */
export default function ForgotPassword() {
  const location = useLocation(), pending = useRef(false);
  const [email, setEmail] = useState(typeof location.state?.email === 'string' ? location.state.email.slice(0, 320) : "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError('');
    try {
      await base44.auth.resetPasswordRequest(email);
      setSent(true);
    } catch (cause) {
      if (cause.code === 'auth/user-not-found') setSent(true);
      else setError(authErrorMessage(cause, 'The reset request could not be sent. Please try again.'));
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your Visionary password"
      supportingText="Enter your account email to request a password reset link."
      footer={
        <Link to={authLink("/login")} state={{ email }} className="flex items-center gap-1 text-[#0066cc] font-medium hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
      }
    >
      {error && <p role="alert" className="mb-4 text-sm text-[#e30000]">{error}</p>}
      {sent ? (
        <div key="success" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col items-center gap-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(52,199,89,0.12)] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#137333]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-normal text-[#1d1d1f]">Check your email</h2>
            <p className="text-sm text-[#6e6e73] leading-relaxed max-w-sm">
              If an account exists for <span className="font-medium text-[#1d1d1f]">{email}</span>, you'll receive a password reset link shortly.
            </p>
          </div>
          <Link to={authLink("/login")} state={{ email }} className={primaryBtnAutoClass}>Back to sign in</Link>
          <button className="text-sm text-[#0066cc]" onClick={() => { setSent(false); setError(''); }}>Use a different email</button>
          <p className="text-sm text-[#6e6e73]">
            Don't have an account?{" "}
            <Link to={authLink("/register")} className="text-[#0066cc] font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      ) : (
        <div key="form" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
          <BackButton to={authLink("/login")} />
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <InputField
              label="Email address"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <ActionRow
              left={
                <Link to={authLink("/register")} className="text-sm text-[#0066cc] font-medium hover:underline">
                  Don't have an account?
                </Link>
              }
            >
              <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : "Send reset link"}
              </button>
            </ActionRow>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
