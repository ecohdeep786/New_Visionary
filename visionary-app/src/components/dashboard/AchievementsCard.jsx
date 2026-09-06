import { Award, Flame, Target, Trophy, Check, Lock, Brain, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function AchievementsCard({ studentData }) {
  const themeColor = useThemeColor();
  const topics = studentData.topics || [];
  const mastered = topics.filter((t) => t.status === "mastered").length;
  const streak = studentData.dailyStats?.streak || 0;
  const studyLogs = studentData.studyLogs || [];
  const studyHours = Math.round(studyLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60);

  const achievements = [
    { label: "First step", sublabel: "Complete your first lesson", icon: Target, unlocked: mastered >= 1, progress: Math.min(mastered, 1), total: 1, color: "#1a73e8", bg: "#e8f0fe" },
    { label: "Knowledge seeker", sublabel: "Master 5 topics", icon: Brain, unlocked: mastered >= 5, progress: Math.min(mastered, 5), total: 5, color: "#34a853", bg: "#e6f4ea" },
    { label: "Consistent mind", sublabel: "Study 7 days in a row", icon: Flame, unlocked: streak >= 7, progress: Math.min(streak, 7), total: 7, color: "#fbbc05", bg: "#fef7e0" },
    { label: "Scholar", sublabel: "Master 10 topics", icon: Trophy, unlocked: mastered >= 10, progress: Math.min(mastered, 10), total: 10, color: "#a142f4", bg: "#f3e8fd" },
    { label: "Dedicated learner", sublabel: "Study for 10 hours total", icon: Zap, unlocked: studyHours >= 10, progress: Math.min(studyHours, 10), total: 10, color: "#ea4335", bg: "#fce8e6" },
    { label: "Expert", sublabel: "Master 25 topics", icon: Award, unlocked: mastered >= 25, progress: Math.min(mastered, 25), total: 25, color: "#00897b", bg: "#e0f2f1" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-3xl border border-[#dadce0]/60">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.label}
              className="flex flex-col gap-4 p-6 rounded-2xl transition-all"
              style={{ backgroundColor: a.unlocked ? a.bg : "#f8f9fa" }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: a.unlocked ? a.color : "#e8eaed" }}>
                  <Icon className="w-5 h-5" style={{ color: a.unlocked ? "#ffffff" : "#9aa0a6" }} />
                </div>
                {a.unlocked ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/70 rounded-full text-xs font-medium" style={{ color: a.color }}>
                    <Check className="w-3.5 h-3.5" /> Earned
                  </span>
                ) : (
                  <Lock className="w-[18px] h-[18px] text-[#9aa0a6]" />
                )}
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#202124]">{a.label}</p>
                <p className="text-sm text-[#5f6368] mt-0.5">{a.sublabel}</p>
              </div>
              {!a.unlocked && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a.progress / a.total) * 100}%`, backgroundColor: a.color }} />
                  </div>
                  <span className="text-xs font-medium text-[#5f6368]">{a.progress}/{a.total}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link
        to="/dashboard/subscription"
        className="inline-flex items-center justify-center gap-2 pt-4 border-t border-[#dadce0]/40 text-sm font-medium hover:underline"
        style={{ color: themeColor.accent }}
      >
        <Lock className="w-[18px] h-[18px]" />
        Unlock all achievements with a plan
      </Link>
    </div>
  );
}