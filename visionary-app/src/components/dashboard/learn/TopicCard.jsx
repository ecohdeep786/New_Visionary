import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MessageCircle, Target } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const statuses = { "not-started": "Not started", "in-progress": "In progress", "needs-review": "Needs review", mastered: "Mastered" };

export default function TopicCard({ topic, variant = "grid" }) {
  const theme = useThemeColor();
  const context = new URLSearchParams({ subject: topic.subject || "", topic: topic.name || "" });
  return (
    <article className={`rounded-xl border border-[#dadce0] bg-white p-5 ${variant === "list" ? "sm:flex sm:items-center sm:gap-5" : "flex flex-col"}`}>
      <div className="mb-4 flex items-center justify-between gap-3 sm:shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.light, color: theme.accent }}><BookOpen className="h-5 w-5" /></div>
        {variant !== "list" && <span className="rounded-md bg-[#f1f3f4] px-2 py-1 text-xs text-[#5f6368]">{statuses[topic.status] || "Not started"}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs text-[#5f6368]">{topic.chapter || topic.subject}</p>
        <h3 className="text-base font-medium leading-6 text-[#202124]"><Link className="hover:underline" to={`/dashboard/learn/${topic.id}`}>{topic.name}</Link></h3>
        <p className="mt-2 text-xs text-[#5f6368]">{topic.practice_count || 0} practice sessions{variant === "list" ? ` · ${statuses[topic.status] || "Not started"}` : ""}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#eef0f2] pt-4 sm:shrink-0">
        <Link to={`/dashboard/learn/${topic.id}`} className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.accent }}>Open lesson <ArrowRight className="h-4 w-4" /></Link>
        <Link to={`/dashboard/ask?${context}`} className="rounded-lg p-2 text-[#5f6368] hover:bg-gray-100" aria-label={`Ask about ${topic.name}`} title="Ask"><MessageCircle className="h-4 w-4" /></Link>
        <Link to={`/dashboard/practice?${context}`} className="rounded-lg p-2 text-[#5f6368] hover:bg-gray-100" aria-label={`Practice ${topic.name}`} title="Practice"><Target className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}
