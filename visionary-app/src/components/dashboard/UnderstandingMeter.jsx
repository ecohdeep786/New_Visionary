import { Link } from "react-router-dom";
import { Database, ArrowRight } from "lucide-react";

/**
 * Visionary Understanding meter — the core "moat" and revenue driver.
 * Treats longitudinal learning memory like Google Drive storage:
 * users see how much "understanding" they've accumulated and upgrade when full.
 */
export default function UnderstandingMeter({ used = 0, total = 100, accent = "#1a73e8", compact = false }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const remaining = Math.max(0, total - used);
  const isNearFull = pct >= 85;

  if (compact) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#202124]">Visionary Understanding</span>
          <span className="text-xs text-[#5f6368]">{used}/{total} GB</span>
        </div>
        <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isNearFull ? "#ea4335" : accent }} />
        </div>
        {isNearFull && (
          <Link to="/dashboard/subscription" className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
            Upgrade <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
          <Database className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div>
          <h2 className="text-[17px] font-medium text-[#202124]">Your Visionary Understanding</h2>
          <p className="text-sm text-[#5f6368]">A living map of everything you've learned</p>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-3xl font-medium text-[#202124]">{used}</span>
          <span className="text-sm text-[#5f6368] ml-1">/ {total} GB used</span>
        </div>
        <span className="text-sm font-medium" style={{ color: isNearFull ? "#ea4335" : accent }}>
          {remaining} GB left
        </span>
      </div>

      <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden mb-6">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isNearFull ? "#ea4335" : accent }} />
      </div>

      <p className="text-sm text-[#5f6368] leading-relaxed mb-6">
        Every lesson, practice question, and AI conversation deepens your understanding. Visionary preserves this map across years — so tomorrow's learning builds on everything you know today.
      </p>

      <Link
        to="/dashboard/subscription"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium transition-colors"
        style={{ backgroundColor: isNearFull ? "#ea4335" : accent, color: "#fff" }}
      >
        {isNearFull ? "Upgrade for more understanding" : "Manage plan"} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}