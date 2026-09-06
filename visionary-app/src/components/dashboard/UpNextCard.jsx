import { Link } from "react-router-dom";
import { ArrowRight, Clock, Box } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function UpNextCard({ topics, studyLogs = [] }) {
  const themeColor = useThemeColor();
  if (!topics || topics.length === 0) return null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Up Next</h2>
          <p className="text-sm font-normal text-[#5f6368] mt-1">Continue your learning journey</p>
        </div>
        <Link to="/dashboard/learn" className="text-sm text-[#1a73e8] hover:underline font-medium">View all</Link>
      </div>
      <div className="flex flex-col gap-4">
        {topics.map((t, i) => {
          const topicLogs = studyLogs.filter((l) => l.topic === t.name);
          const totalMinutes = topicLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
          const estDuration = t.has_3d ? 20 : 15;
          return (
            <Link
              key={t.id}
              to={`/dashboard/learn/${t.id}`}
              className="flex items-center gap-4 p-6 bg-white rounded-3xl hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                style={{ backgroundColor: themeColor.light, color: themeColor.accent }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-medium text-[#202124] truncate">{t.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm font-normal text-[#5f6368]">{t.subject}{t.chapter ? ` · ${t.chapter}` : ""}</p>
                  {t.has_3d && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: themeColor.light, color: themeColor.accent }}>
                      <Box className="w-3 h-3" /> 3D lesson
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm font-normal text-[#5f6368]">
                    <Clock className="w-[14px] h-[14px]" />
                    {totalMinutes > 0 ? `${totalMinutes} min` : `~${estDuration} min`}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: themeColor.light }}
              >
                <ArrowRight className="w-[18px] h-[18px] transition-colors" style={{ color: themeColor.accent }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}