import { Sparkles, ArrowRight } from "lucide-react";

export default function AGIInsightCard({ insight, actionLabel, accentClass = "bg-blue-50 text-blue-600" }) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-slate-200 flex-1 min-w-[260px]">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accentClass}`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed flex-1 pt-1.5">{insight}</p>
      </div>
      {actionLabel && (
        <button className="flex items-center gap-1.5 self-start text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1">
          {actionLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}