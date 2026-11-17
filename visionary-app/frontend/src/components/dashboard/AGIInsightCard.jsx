import { Sparkles, ArrowRight } from "lucide-react";

export default function AGIInsightCard({ insight, actionLabel, accentClass = "bg-[#eef5ff] text-[#0071E3]" }) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-[#d2d2d7] flex-1 min-w-[260px]">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accentClass}`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm text-[#6e6e73] leading-relaxed flex-1 pt-1.5">{insight}</p>
      </div>
      {actionLabel && (
        <button className="flex items-center gap-1.5 self-start text-sm font-medium text-[#0071E3] hover:text-[#0071E3] transition-colors mt-1">
          {actionLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}