import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MarketTrends({ subjects }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const subjectNames = subjects.map((s) => s.name).join(", ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a market trends analyst for students. Find 3 current, real-world developments or trends related to these academic subjects: ${subjectNames}. For each, provide a short title (max 8 words), a 1-2 sentence summary of why it matters to a student, and which subject it relates to. Focus on recent innovations, career opportunities, or real-world applications that would excite a K-12 student. Return as JSON.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  subject: { type: "string" },
                },
              },
            },
          },
        },
      });
      setTrends(res.trends || []);
    } catch {
      setTrends([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (subjects.length > 0) fetchTrends();
  }, [subjects.length]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 leading-none">Market Trends</h2>
            <p className="text-xs text-gray-400 mt-1.5">How your subjects connect to the real world</p>
          </div>
        </div>
        <button onClick={fetchTrends} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-3 p-7 bg-white rounded-3xl border border-gray-200">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin shrink-0" />
          <span className="text-sm text-gray-400">Finding trends in your subjects...</span>
        </div>
      ) : trends.length === 0 ? (
        <div className="flex items-center gap-3 p-7 bg-white rounded-3xl border border-gray-200">
          <Globe className="w-5 h-5 text-gray-300" />
          <span className="text-sm text-gray-400">Trends will appear here once you add subjects.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {trends.map((t, i) => (
            <div key={i} className="flex flex-col gap-3 p-7 bg-white rounded-3xl border border-gray-200 hover:shadow-sm transition-all">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium self-start">{t.subject}</span>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">{t.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{t.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}