import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function BuildHero({ userName, masteredCount, unlockedCount, recommendedProject }) {
  const themeColor = useThemeColor();

  // No unlocked projects — guide the user to learn first
  if (!recommendedProject) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
            <Sparkles className="w-5 h-5" style={{ color: themeColor.accent }} />
          </div>
          <span className="text-sm font-medium text-[#5f6368]">Your AGI teacher</span>
        </div>
        <div>
          <h1 className="text-[32px] font-medium text-[#202124] tracking-tight leading-tight">
            Hi {userName}, ready to build?
          </h1>
          <p className="text-base text-[#3c4043] mt-3 leading-relaxed max-w-xl">
            Master a concept first, and I'll unlock a real project for you to build. You've mastered {masteredCount} so far — keep learning and the build lab opens up.
          </p>
        </div>
        <Link
          to="/dashboard/learn"
          className="inline-flex items-center gap-2 h-11 px-7 text-white rounded-full text-sm font-medium self-start hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor.accent }}
        >
          Go to lessons <ArrowRight className="w-[18px] h-[18px]" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
          <Sparkles className="w-5 h-5" style={{ color: themeColor.accent }} />
        </div>
        <span className="text-sm font-medium text-[#5f6368]">Your AGI teacher</span>
      </div>

      <div>
        <h1 className="text-[32px] font-medium text-[#202124] tracking-tight leading-tight">
          Hi {userName}, ready to build?
        </h1>
        <p className="text-base text-[#3c4043] mt-3 leading-relaxed max-w-xl">
          You've mastered {masteredCount} concept{masteredCount !== 1 ? "s" : ""} — that unlocks {unlockedCount} project{unlockedCount !== 1 ? "s" : ""}. Here's where I'd start.
        </p>
      </div>

      {/* Recommended project — single primary action */}
      <div className="flex flex-col gap-5 p-6 bg-white rounded-3xl border border-[#dadce0]/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-[#5f6368]">Recommended for you</span>
            <h2 className="text-[22px] font-medium text-[#202124] leading-snug">{recommendedProject.title}</h2>
            <p className="text-sm text-[#5f6368]">Applies: {recommendedProject.concept}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 text-right">
            <span className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wide">Est. time</span>
            <span className="text-[22px] font-medium text-[#202124]">{recommendedProject.duration}</span>
          </div>
        </div>

        <div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${recommendedProject.difficultyColor}`}>
            {recommendedProject.difficulty}
          </span>
        </div>

        <button
          className="inline-flex items-center gap-2 h-11 px-7 text-white rounded-full text-sm font-medium self-start hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor.accent }}
        >
          Start building <ArrowRight className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}