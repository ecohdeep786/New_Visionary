import { Link } from "react-router-dom";
import { Play, ArrowRight, Clock, Box } from "lucide-react";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ContinueCard({ topic, studyLogs = [] }) {
  const themeColor = useThemeColor();

  if (!topic) return null;
  const mastery = topic.mastery || 0;
  const isResume = topic.status === "in-progress" || topic.status === "needs-review";

  const topicLogs = studyLogs.filter((l) => l.topic === topic.name);
  const totalMinutes = topicLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const estDuration = topic.has_3d ? 20 : 15;

  return (
    <Link
      to={`/dashboard/learn/${topic.id}`}
      className="relative overflow-hidden rounded-3xl block group"
      style={{ backgroundColor: themeColor.light }}
    >
      <div className="absolute right-0 top-0 h-full w-2/5 opacity-25 pointer-events-none">
        <SubjectIllustration subject={topic.subject} className="w-full h-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 p-8">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: themeColor.accent }}>
          <Play className="w-[18px] h-[18px]" style={{ fill: themeColor.accent }} />
          {isResume ? "Continue where you left off" : "Start your next lesson"}
        </div>

        <div>
          <h2 className="text-[22px] font-medium text-[#202124] tracking-tight leading-tight">{topic.name}</h2>
          <p className="text-base font-normal text-[#3c4043] mt-1">
            {topic.subject}{topic.chapter ? ` · ${topic.chapter}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-[6px] bg-black/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-200" style={{ width: `${mastery}%`, backgroundColor: themeColor.accent }} />
          </div>
          <span className="text-sm font-medium text-[#202124] w-10 text-right">{mastery}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-normal text-[#3c4043]">
            {topic.has_3d && (
              <span className="flex items-center gap-2">
                <Box className="w-[18px] h-[18px]" /> 3D lesson
              </span>
            )}
            <span className="flex items-center gap-2">
              <Clock className="w-[18px] h-[18px]" />
              {totalMinutes > 0 ? `${totalMinutes} min spent` : `~${estDuration} min`}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full text-sm font-medium group-hover:gap-3 transition-all"
            style={{ color: themeColor.accent }}
          >
            {isResume ? "Continue" : "Start"} <ArrowRight className="w-[18px] h-[18px]" />
          </div>
        </div>
      </div>
    </Link>
  );
}