import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
// import { base44 } from "@/api/base44Client";

/**
 * Visionary's teacher moat: an AI teaching companion that reads the teacher's
 * real workload (classes + assignments) and surfaces one specific, actionable
 * insight per visit. Auto-generates on mount; refreshable.
 */
export default function TeacherInsightCard({ accent }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  const generate = async () => {
    setLoading(true);
    try {
      const classes = await base44.entities.Classroom.list("-created_date", 10);
      let assignmentCount = 0;
      for (const c of classes || []) {
        try {
          const a = await base44.entities.Assignment.filter({ class_id: c.id });
          assignmentCount += (a || []).length;
        } catch {}
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Visionary's AI teaching companion. A teacher has ${(classes || []).length} classes and ${assignmentCount} assignments. Write ONE short insight or nudge (2-3 sentences, warm, specific, no greeting) to help them teach better this week. If they have no classes yet, encourage creating their first class. If they have classes but no assignments, suggest tagging concepts when they create work to build a mastery map.`,
      });
      setInsight(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setInsight("Focus on one class today — a single, well-prepared lesson beats three rushed ones.");
    }
    setLoading(false);
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="rounded-3xl p-8 bg-white border border-[#dadce0]/60 flex items-start gap-5">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
        <Sparkles className="w-6 h-6" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#202124] mb-1.5">Your teaching insight</p>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-[#3c4043] leading-relaxed">{insight}</p>
        )}
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0"
        aria-label="Refresh insight"
      >
        <RefreshCw className={`w-4 h-4 text-[#5f6368] ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}