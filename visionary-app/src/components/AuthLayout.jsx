import React from "react";
import { Link } from "react-router-dom";
import VisionaryLogo from "@/components/VisionaryLogo";
import LanguageSelector from "@/components/auth/LanguageSelector";

export default function AuthLayout({
  title = "",
  supportingText = null,
  subtitle = null,
  icon: Icon = null,
  accountInfo = null,
  footer = null,
  children = null,
}) {
  const displaySubtitle = subtitle || supportingText;
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f0f2f5]">
      {/* Card area — centered, takes remaining space */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 min-h-0">
        <div className="w-full max-w-[960px] max-h-full bg-white rounded-[28px] shadow-[0_1px_2px_rgba(60,64,67,0.08),0_2px_6px_2px_rgba(60,64,67,0.06)] overflow-hidden border border-[#dadce0]/30">
          <div className="grid md:grid-cols-2 h-full">
            {/* Left: Branding — desktop only */}
            <div className="hidden md:flex flex-col justify-between items-start p-10 lg:p-14">
              <div className="flex items-center gap-3">
                <VisionaryLogo />
                {Icon && <Icon className="w-6 h-6 text-[#1a73e8]" />}
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="text-[28px] md:text-[30px] font-normal text-[#202124] leading-tight tracking-tight">
                  {title}
                </h1>
                {accountInfo && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#dadce0] self-start">
                    <div className="w-6 h-6 rounded-full bg-[#1a73e8] flex items-center justify-center text-xs text-white font-medium">
                      {accountInfo?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-[#202124]">{accountInfo}</span>
                  </div>
                )}
                {displaySubtitle && (
                  <p className="text-sm text-[#5f6368] leading-relaxed">
                    {displaySubtitle}
                  </p>
                )}
              </div>
              {footer && <div className="text-sm text-[#5f6368]">{footer}</div>}
            </div>
            {/* Right: Form — shows compact heading on mobile */}
            <div className="flex flex-col justify-center p-6 md:p-10 lg:p-14 overflow-y-auto max-h-full">
              {/* Mobile-only heading */}
              <div className="md:hidden flex flex-col gap-3 mb-6">
                <VisionaryLogo />
                <h1 className="text-[24px] font-normal text-[#202124] leading-tight tracking-tight">
                  {title}
                </h1>
                {accountInfo && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#dadce0] self-start">
                    <div className="w-6 h-6 rounded-full bg-[#1a73e8] flex items-center justify-center text-xs text-white font-medium">
                      {accountInfo?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-[#202124]">{accountInfo}</span>
                  </div>
                )}
                {supportingText && (
                  <p className="text-sm text-[#5f6368] leading-relaxed">{supportingText}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
      {/* Footer bar */}
      <div className="shrink-0 w-full max-w-[960px] mx-auto flex items-center justify-between px-4 py-2">
        <LanguageSelector />
        <div className="flex items-center gap-6 text-sm text-[#5f6368]">
          <Link to="/contact" className="hover:text-[#202124] transition-colors">Help</Link>
          <Link to="/privacy" className="hover:text-[#202124] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[#202124] transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}
