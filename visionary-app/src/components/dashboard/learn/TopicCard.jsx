import { Link } from "react-router-dom";
import { ArrowRight, Box, Clock, MessageSquare, PencilRuler, CheckCircle2 } from "lucide-react";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";
import { useThemeColor } from "@/hooks/useThemeColor";

const STATUS_BADGE = {
  "not-started": { label: "Not started", cls: "bg-gray-100 text-gray-500" },
  "in-progress": { label: "In progress", cls: "bg-blue-50 text-blue-600" },
  "needs-review": { label: "In progress", cls: "bg-blue-50 text-blue-600" },
  mastered: { label: "Completed", cls: "bg-green-50 text-green-600" },
};

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE["not-started"];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.cls}`}>
      {status === "mastered" && <CheckCircle2 className="w-3 h-3" />}
      {badge.label}
    </span>
  );
}

export default function TopicCard({ topic, variant = "grid" }) {
  const themeColor = useThemeColor();
  const estDuration = topic.has_3d ? 20 : 15;
  const mastery = topic.mastery || 0;
  const subheading = topic.chapter || `${topic.subject} topic`;

  const askLink = `/dashboard/ask?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`;
  const practiceLink = `/dashboard/practice?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`;
  const learnLink = `/dashboard/learn/${topic.id}`;

  /* ── GRID variant ── */
  if (variant === "grid") {
    return (
      <div className="flex flex-col bg-white rounded-3xl border border-[#dadce0]/50 hover:shadow-md transition-all overflow-hidden">
        <Link to={learnLink} className="w-full h-28 lg:h-32 shrink-0 block">
          <SubjectIllustration subject={topic.subject} className="w-full h-full" />
        </Link>

        <div className="flex flex-col gap-3 p-6 flex-1">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={topic.status} />
            {topic.has_3d && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: themeColor.accent }}>
                <Box className="w-3.5 h-3.5" /> 3D
              </span>
            )}
          </div>

          <Link to={learnLink} className="flex flex-col gap-1.5">
            <h3 className="text-[17px] font-medium text-[#202124] leading-snug line-clamp-2 break-words">
              {topic.name}
            </h3>
          </Link>

          {/* One line: chapter · duration · 3D */}
          <div className="flex items-center gap-2 text-sm font-normal text-[#5f6368]">
            <span className="truncate">{subheading}</span>
            <span className="text-[#dadce0]">·</span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5" /> {estDuration} min
            </span>
            {topic.has_3d && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{ backgroundColor: themeColor.light, color: themeColor.accent }}>
                <Box className="w-3 h-3" /> 3D
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2.5 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${mastery}%`, backgroundColor: themeColor.accent }} />
            </div>
            <span className="text-xs font-medium text-[#5f6368] w-8 text-right">{mastery}%</span>
          </div>
        </div>

        {/* Bottom: Ask + Practice */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-[#dadce0]/40">
          <Link
            to={askLink}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Ask
          </Link>
          <Link
            to={practiceLink}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1a73e8" }}
          >
            <PencilRuler className="w-3.5 h-3.5" /> Practice
          </Link>
          <div className="flex-1" />
          <Link
            to={learnLink}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: themeColor.light }}
          >
            <ArrowRight className="w-[16px] h-[16px]" style={{ color: themeColor.accent }} />
          </Link>
        </div>
      </div>
    );
  }

  /* ── LIST variant ── */
  return (
    <div className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-[#dadce0]/50 hover:shadow-md transition-all">
      <Link to={learnLink} className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <StatusBadge status={topic.status} />
          {topic.has_3d && (
            <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: themeColor.accent }}>
              <Box className="w-3.5 h-3.5" /> 3D
            </span>
          )}
        </div>
        <h3 className="text-[17px] font-medium text-[#202124] truncate">{topic.name}</h3>
        {/* One line: chapter · duration */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-normal text-[#5f6368] truncate">{subheading}</span>
          <span className="text-[#dadce0] text-sm">·</span>
          <span className="flex items-center gap-1 text-sm font-normal text-[#5f6368] shrink-0">
            <Clock className="w-3.5 h-3.5" /> {estDuration} min
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[200px]">
            <div className="h-full rounded-full" style={{ width: `${mastery}%`, backgroundColor: themeColor.accent }} />
          </div>
          <span className="text-xs font-medium text-[#5f6368]">{mastery}%</span>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={askLink}
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed] transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Ask
        </Link>
        <Link
          to={practiceLink}
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1a73e8" }}
        >
          <PencilRuler className="w-3.5 h-3.5" /> Practice
        </Link>
        <Link
          to={learnLink}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: themeColor.light }}
        >
          <ArrowRight className="w-[16px] h-[16px]" style={{ color: themeColor.accent }} />
        </Link>
      </div>
    </div>
  );
}