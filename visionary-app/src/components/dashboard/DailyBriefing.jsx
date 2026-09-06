import { useState, useEffect } from "react";
import { Brain, Sparkles, ArrowRight, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildStudentContext } from "@/hooks/useStudentData";
import { Link } from "react-router-dom";

export default function DailyBriefing({ studentData, userName }) {
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentData || studentData.loading) return;

    const generate = async () => {
      const context = buildStudentContext(studentData, userName);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Visionary, a personal AGI teacher for an Indian student. Write a warm, motivating daily briefing for ${userName} based on their learning data below. Address them by first name. In 3-4 sentences: (1) acknowledge recent progress or streak, (2) flag what needs attention today, (3) mention any upcoming exam urgency if relevant. Be encouraging like a real teacher who genuinely cares. Write as natural conversation — no markdown, no bullet points.\n\n${context}`,
        });
        setBriefing(
          typeof res === "string"
            ? res
            : res.answer || `Good morning ${userName}! Ready to learn today? Check your plan below.`
        );
      } catch {
        setBriefing(
          `Good morning ${userName}! You're on a 5-day streak — keep the momentum going. I see some topics need attention today. Let's tackle them together.`
        );
      }
      setLoading(false);
    };
    generate();
  }, [studentData?.loading]);

  return (
    <div className="flex flex-col gap-6 p-8 lg:p-10 bg-white rounded-3xl border border-gray-200 elevation-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AGI Daily Briefing</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-amber-700">5</span>
          <span className="text-xs text-amber-600">day streak</span>
        </div>
      </div>

      <div className="min-h-[60px]">
        {loading ? (
          <div className="flex items-center gap-2.5 text-gray-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Your AGI teacher is preparing today's briefing...</span>
          </div>
        ) : (
          <p className="text-base lg:text-lg text-gray-700 leading-relaxed">{briefing}</p>
        )}
      </div>

      <Link
        to="/dashboard/learn"
        className="flex items-center gap-2 self-start px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-colors w-fit"
      >
        Start today's plan <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}