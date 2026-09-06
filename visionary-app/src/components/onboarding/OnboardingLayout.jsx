import VisionaryLogo from "@/components/VisionaryLogo";
import LanguageSelector from "@/components/auth/LanguageSelector";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/auth/AuthUI";

export default function OnboardingLayout({
  step, totalSteps, title, subtitle,
  onBack, onContinue, canContinue, isSubmitting,
  children, showProgress = true, showNav = true,
  continueLabel = "Continue",
}) {
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <header className="shrink-0 flex items-center justify-between px-6 lg:px-10 py-4">
        <VisionaryLogo />
        <LanguageSelector />
      </header>

      {showProgress && (
        <div className="shrink-0 px-6 lg:px-10 pb-2">
          <div className="h-1 bg-[#e8eaed] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a73e8] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 lg:px-10 py-4">
        <div className="w-full max-w-[680px]">
          {title && (
            <h1 className="text-[24px] lg:text-[28px] font-normal text-[#202124] leading-tight mb-1">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-sm text-[#5f6368] mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>

      {showNav && (
        <footer className="shrink-0 flex items-center justify-between px-6 lg:px-10 py-4 border-t border-[#e8eaed]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue || isSubmitting}
            className="flex items-center gap-2 h-10 px-8 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1557b0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner /> : continueLabel}
          </button>
        </footer>
      )}
    </div>
  );
}