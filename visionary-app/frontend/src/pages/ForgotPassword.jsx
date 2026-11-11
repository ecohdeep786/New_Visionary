import React, { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { primaryBtnAutoClass, Spinner, InputField, BackButton, ActionRow } from "@/components/auth/AuthUI";
import { authErrorMessage } from '@/lib/authErrors';

/**
 * ForgotPassword — preview reset truthfulness law (FAP-85):
 * - In local preview (base44.auth.source !== 'firebase') no email is sent.
 *   The success step must not promise one: it discloses the local simulation
 *   and, when the local adapter returned a reset token, continues the user to
 *   /reset-password?token=… (single-use, expires in 15 minutes — see
 *   appClient.js RESET_TOKEN_TTL_MS; ResetPassword already reads ?token).
 * - Preview answers honestly when the address is not a local account,
 *   mirroring the preview sign-in voice ("Account not found"). The connected
 *   Firebase flow keeps its byte-identical anti-enumeration "Check your
 *   email" success view and sendPasswordResetEmail transport.
 */
export default function ForgotPassword() {
  const location = useLocation(), pending = useRef(false);
  const preview = base44.auth.source !== 'firebase';
  const [email, setEmail] = useState(typeof location.state?.email === 'string' ? location.state.email.slice(0, 320) : "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError('');
    try {
      const result = await base44.auth.resetPasswordRequest(email);
      if (preview) {
        // The preview adapter answers honestly: a resetToken means the local
        // account exists; no token means it does not. Preview sign-in already
        // says "Account not found", so revealing this locally is consistent.
        const token = typeof result?.resetToken === 'string' ? result.resetToken : '';
        setResetToken(token);
        setNotFound(!token);
        setSent(true);
      } else {
        setSent(true);
      }
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
      supportingText={preview ? "Enter your account email to create a local password reset token." : "Enter your account email to request a password reset link."}
      footer={
        <Link to="/login" className="flex items-center gap-1 text-[#0066cc] font-medium hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
      }
    >
      {error && <p role="alert" className="mb-4 text-sm text-[#e30000]">{error}</p>}
      {sent ? (
        preview ? (
          <div key="success" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col items-center gap-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(52,199,89,0.12)] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#137333]" />
            </div>
            {notFound ? (
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-normal text-[#1d1d1f]">No local account found</h2>
                <p className="text-sm text-[#6e6e73] leading-relaxed max-w-sm">
                  Local preview — no email is sent. No account exists for <span className="font-medium text-[#1d1d1f]">{email}</span> in this browser's local preview. Create one to continue.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-normal text-[#1d1d1f]">Finish resetting your password</h2>
                <p className="text-sm text-[#6e6e73] leading-relaxed max-w-sm">
                  Local preview — no email is sent. A single-use reset token was created in this browser's local storage and expires in 15 minutes. Continue to set a new password for <span className="font-medium text-[#1d1d1f]">{email}</span>.
                </p>
              </div>
            )}
            {!notFound && (
              <Link to={`/reset-password?token=${encodeURIComponent(resetToken)}`} className={primaryBtnAutoClass}>
                Continue to reset password
              </Link>
            )}
            <button className="text-sm text-[#0066cc]" onClick={() => { setSent(false); setResetToken(''); setNotFound(false); setError(''); }}>Use a different email</button>
            <p className="text-sm text-[#6e6e73]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#0066cc] font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        ) : (
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
          <Link to="/login" className={primaryBtnAutoClass}>Back to sign in</Link>
          <button className="text-sm text-[#0066cc]" onClick={() => { setSent(false); setError(''); }}>Use a different email</button>
          <p className="text-sm text-[#6e6e73]">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#0066cc] font-medium hover:underline">Sign up</Link>
          </p>
        </div>
        )
        ) : (
        <div key="form" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col gap-6">
          <BackButton to="/login" />
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
                <Link to="/register" className="text-sm text-[#0066cc] font-medium hover:underline">
                  Don't have an account?
                </Link>
              }
            >
              <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : (preview ? "Create reset token" : "Send reset link")}
              </button>
            </ActionRow>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
