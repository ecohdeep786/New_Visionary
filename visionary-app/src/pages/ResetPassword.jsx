import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { primaryBtnAutoClass, Spinner, InputField, GooglePasswordField, BackButton, ActionRow } from "@/components/auth/AuthUI";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        title="Invalid reset link"
        supportingText="This password reset link is missing or invalid."
        footer={
          <Link to="/forgot-password" className="flex items-center gap-1 text-[#1a73e8] font-medium hover:underline">
            <ArrowLeft className="w-3 h-3" /> Request a new link
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <p className="text-sm text-[#3c4043] leading-relaxed max-w-sm">
            The link you used appears to be incomplete or has expired. Please request a new password reset email.
          </p>
          <Link to="/forgot-password" className={primaryBtnAutoClass}>Request new link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      supportingText="Create a strong password for your account."
      footer={
        <Link to="/login" className="flex items-center gap-1 text-[#1a73e8] font-medium hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <BackButton to="/login" />
        {error && <div className="p-3 rounded-lg bg-red-50 text-[#ea4335] text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <GooglePasswordField
            label="New password"
            autoComplete="new-password"
            autoFocus
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <InputField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
              {loading ? <Spinner /> : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}