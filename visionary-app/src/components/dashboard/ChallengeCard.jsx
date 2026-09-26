import { ArrowRight, RefreshCw, Target } from "lucide-react";

const adaptColors = {
  Foundational: "bg-[#e6f4ea] text-[#137333]",
  Intermediate: "bg-[#ffffff] text-[#5f6368]",
  Advanced: "bg-rose-50 text-rose-600",
};

export default function ChallengeCard({ title, subject, mastery, adaptLevel, questions }) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-[#dadce0] flex-1 min-w-[260px]">
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${adaptColors[adaptLevel] || adaptColors.Intermediate}`}>
          {adaptLevel}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
          <Target className="w-3.5 h-3.5" /> {mastery}% mastery
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-[#5f6368]">{subject}</span>
        <h3 className="text-base font-semibold text-[#121317] leading-snug">{title}</h3>
      </div>

      <div className="flex items-center gap-4 text-sm text-[#5f6368]">
        <span>{questions} adaptive questions</span>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2">
        <button className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#4285F4] text-white rounded-xl text-sm font-medium hover:bg-[#3367d6] transition-colors">
          Start Challenge <ArrowRight className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center gap-1.5 w-10 h-10 border border-[#dadce0] text-[#5f6368] rounded-xl hover:bg-[#ffffff] transition-colors" title="Re-teach me this">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}