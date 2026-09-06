import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { primaryBtnAutoClass, Spinner, InputField, BackButton, ActionRow } from "@/components/auth/AuthUI";

export default function ForgotUserId() {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthLayout
      title="Find your email or user ID"
      supportingText="We'll help you recover your account access."
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
            <h2 className="text-2xl font-normal text-[#202124]">Check your messages</h2>
            <p className="text-sm text-[#5f6368] leading-relaxed max-w-sm">
              If an account is associated with <span className="font-medium text-[#202124]">{contact}</span>, we'll send your account details to your recovery contact.
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
              label="Phone number or recovery email"
              type="text"
              autoFocus
              placeholder="+1 555 000 0000 or recovery@email.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <ActionRow
              left={
                <Link to="/login" className="text-sm text-[#1a73e8] font-medium hover:underline">
                  Remember your email?
                </Link>
              }
            >
              <button type="submit" disabled={loading} className={primaryBtnAutoClass}>
                {loading ? <Spinner /> : "Continue"}
              </button>
            </ActionRow>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}