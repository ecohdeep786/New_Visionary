import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function LaggingTopicsCard({ topics }) {
  const themeColor = useThemeColor();

  if (!topics || topics.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <AlertCircle className="w-[18px] h-[18px] text-green-500" />
        </div>
        <p className="text-base font-normal text-[#5f6368]">You're on track! No topics need urgent review.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {topics.slice(0, 4).map((t) => (
        <Link key={t.id} to={`/dashboard/learn/${t.id}`} className="flex items-center justify-between gap-8 py-5 group">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-base font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors truncate">{t.name}</span>
            <span className="text-sm font-normal text-[#5f6368] mt-1">{t.subject}</span>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-20 h-[4px] bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${t.mastery < 35 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${t.mastery || 0}%` }} />
              </div>
              <span className={`text-sm font-medium w-8 text-right ${t.mastery < 35 ? "text-red-500" : "text-amber-500"}`}>{t.mastery || 0}%</span>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: themeColor.light }}
            >
              <ArrowRight className="w-[18px] h-[18px] transition-colors" style={{ color: themeColor.accent }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}