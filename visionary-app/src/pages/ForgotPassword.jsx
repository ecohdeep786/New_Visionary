import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { primaryBtnAutoClass, Spinner, InputField, BackButton, ActionRow } from "@/components/auth/AuthUI";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      supportingText="We'll help you reset it and get back to learning."
      footer={
        <Link to="/login" className="flex items-center gap-1 text-[#1a73e8] font-medium hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div key="success" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 flex flex-col items-center gap-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-normal text-[#202124]">Check your email</h2>
            <p className="text-sm text-[#5f6368] leading-relaxed max-w-sm">
              If an account exists for <span className="font-medium text-[#202124]">{email}</span>, you'll receive a password reset link shortly.
            </p>
          </div>
          <Link to="/login" className={primaryBtnAutoClass}>Back to sign in</Link>
          <p className="text-sm text-[#5f6368]">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#1a73e8] font-medium hover:underline">Sign up</Link>
          </p>
        </div>
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
            />
            <ActionRow
              left={
                <Link to="/register" className="text-sm text-[#1a73e8] font-medium hover:underline">
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