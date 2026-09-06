import { useState, useEffect } from "react";
import { Sparkles, Layers, RefreshCw, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KnowledgeHeatmap from "@/components/dashboard/teacher/tabs/KnowledgeHeatmap";

/**
 * Insights tab — Visionary's teacher differentiator.
 * - Concept coverage: topics touched by tagged assignments.
 * - Class mastery: live, computed from graded submissions per concept — the
 *   knowledge heatmap Google Classroom can't give you.
 * - AI class analysis: one specific nudge from the workload.
 */
export default function InsightsTab({ classId, classroom, accent }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const load = async () => {
    try {
      const [list, subs] = await Promise.all([
        base44.entities.Assignment.filter({ class_id: classId }),
        base44.entities.Submission.filter({ class_id: classId }),
      ]);
      setAssignments(list || []);
      setSubmissions(subs || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [classId]);

  const assignmentMap = {};
  (assignments || []).forEach((a) => (assignmentMap[a.id] = a));

  // Coverage — how many assignments touch each concept
  const coverage = {};
  (assignments || []).forEach((a) =>
    (a.topics || []).forEach((t) => {
      coverage[t] = (coverage[t] || 0) + 1;
    })
  );
  const coverageRows = Object.entries(coverage).sort((a, b) => b[1] - a[1]);
  const maxCov = coverageRows.length ? coverageRows[0][1] : 1;

  // Class mastery — average grade per concept across graded submissions
  const conceptGrades = {};
  (submissions || [])
    .filter((s) => s.status === "graded")
    .forEach((s) => {
      const a = assignmentMap[s.assignment_id];
      (a?.topics || []).forEach((c) => {
        if (!conceptGrades[c]) conceptGrades[c] = [];
        conceptGrades[c].push(s.grade || 0);
      });
    });
  const masteryRows = Object.entries(conceptGrades)
    .map(([c, grades]) => ({
      concept: c,
      avg: Math.round(grades.reduce((x, y) => x + y, 0) / grades.length),
      count: grades.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      const covText = coverageRows.length ? coverageRows.map(([t, c]) => `${t} (${c})`).join(", ") : "none yet";
      const masText = masteryRows.length ? masteryRows.map((m) => `${m.concept}: ${m.avg}%`).join(", ") : "no graded work yet";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Visionary's AI teaching analyst. A class "${classroom?.name || ""}" in ${classroom?.subject || "a subject"} has ${assignments.length} assignment(s). Coverage: ${covText}. Class mastery: ${masText}. Write ONE short (2-3 sentence) insight: flag the weakest concept and suggest a concrete teaching action. Be warm and specific. No greeting.`,
      });
      setInsight(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setInsight("Tag concepts on your assignments to unlock a live coverage map and mastery insights here.");
    }
    setInsightLoading(false);
  };
  useEffect(() => {
    if (!loading && assignments.length > 0) generateInsight();
  }, [loading, assignments.length]);

  return (
    <div className="flex flex-col gap-6 max-w-[680px]">
      {/* AI analysis */}
      <div className="rounded-3xl p-6 bg-white border border-[#dadce0]/60 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
          <Sparkles className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#202124] mb-1.5">AI class analysis</p>
          {assignments.length === 0 ? (
            <p className="text-sm text-[#5f6368] leading-relaxed">Create assignments and tag concepts to generate a class coverage insight.</p>
          ) : insightLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
            </div>
          ) : (
            <p className="text-sm text-[#3c4043] leading-relaxed">{insight}</p>
          )}
        </div>
        {assignments.length > 0 && (
          <button onClick={generateInsight} disabled={insightLoading} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label="Refresh analysis">
            <RefreshCw className={`w-4 h-4 text-[#5f6368] ${insightLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Class mastery — the knowledge heatmap */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5" style={{ color: accent }} />
          <h3 className="text-sm font-medium text-[#202124]">Class mastery</h3>
        </div>
        <p className="text-xs text-[#5f6368] mb-6">Average understanding per concept, live from graded work — the heatmap Google Classroom can't show you.</p>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
          </div>
        ) : masteryRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <BarChart3 className="w-10 h-10 text-[#dadce0]" />
            <p className="text-sm text-[#5f6368] max-w-sm">No graded work yet. As you return graded assignments, class mastery per concept fills in here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {masteryRows.map((m) => (
              <div key={m.concept}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#3c4043]">{m.concept}</span>
                  <span className="text-xs text-[#5f6368]">{m.avg}% · {m.count} graded</span>
                </div>
                <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.avg}%`, backgroundColor: m.avg >= 70 ? "#34a853" : m.avg >= 40 ? accent : "#ea4335" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <KnowledgeHeatmap submissions={submissions} assignments={assignments} accent={accent} />

      {/* Concept coverage */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-[#5f6368]" />
          <h3 className="text-sm font-medium text-[#202124]">Concept coverage</h3>
        </div>
        <p className="text-xs text-[#5f6368] mb-6">Topics your assignments touch — the backbone of your students' mastery map.</p>
        {coverageRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Layers className="w-10 h-10 text-[#dadce0]" />
            <p className="text-sm text-[#5f6368] max-w-sm">No concepts tagged yet. Add concept tags when creating assignments to map your coverage.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {coverageRows.map(([t, c]) => (
              <div key={t}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#3c4043]">{t}</span>
                  <span className="text-xs text-[#5f6368]">{c} assignment{c > 1 ? "s" : ""}</span>
                </div>
                <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c / maxCov) * 100}%`, backgroundColor: accent }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}