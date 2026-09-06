import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Circle, Loader2, PanelRightClose } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ConceptNavigator({ topic, subConcepts, loadingConcepts, onToggleCollapse }) {
  const themeColor = useThemeColor();
  const mastery = topic.mastery || 0;

  // Derive per-concept progress from overall mastery
  const conceptsWithProgress = subConcepts.map((c, i) => {
    const threshold = (i + 1) / subConcepts.length;
    const prevThreshold = i / subConcepts.length;
    if (mastery / 100 >= threshold) return { ...c, status: "completed", progress: 100 };
    if (mastery / 100 > prevThreshold) return { ...c, status: "in-progress", progress: Math.round(((mastery / 100 - prevThreshold) / (threshold - prevThreshold)) * 100) };
    return { ...c, status: "not-started", progress: 0 };
  });

  const completedCount = conceptsWithProgress.filter((c) => c.status === "completed").length;

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-[#dadce0]/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
            <BookOpen className="w-4 h-4" style={{ color: themeColor.accent }} />
          </div>
          <div>
            <span className="text-sm font-medium text-[#202124] block">Concepts</span>
            <span className="text-xs text-[#5f6368]">{completedCount}/{subConcepts.length} completed</span>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#5f6368] hover:bg-gray-100 transition-colors shrink-0"
        >
          <PanelRightClose className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Sub-concept list */}
      <div className="flex flex-col max-h-[500px] overflow-y-auto">
        {loadingConcepts ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: themeColor.accent }} />
            <span className="text-sm text-[#5f6368]">Loading concepts...</span>
          </div>
        ) : conceptsWithProgress.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#5f6368]">No concepts available.</div>
        ) : (
          conceptsWithProgress.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#dadce0]/20 last:border-b-0">
              {c.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : c.status === "in-progress" ? (
                <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: themeColor.accent }}>
                  <div className="w-1/2 h-full rounded-l-full" style={{ backgroundColor: themeColor.accent }} />
                </div>
              ) : (
                <Circle className="w-4 h-4 text-[#dadce0] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#202124] truncate">{c.title}</p>
                <p className="text-xs text-[#5f6368] mt-0.5">{c.number} · Progress: {c.progress}%</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}