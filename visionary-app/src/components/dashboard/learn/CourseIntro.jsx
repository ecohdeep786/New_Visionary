import { useState, useEffect } from "react";
import { Play, Clock, Target, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";

export default function CourseIntro({ topic, onStart, isBookmarked }) {
  const themeColor = useThemeColor();
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (topic) generateObjectives();
  }, [topic?.id]);

  const generateObjectives = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create 5 learning objectives for the topic "${topic.name}" in ${topic.subject}. Each objective should be a short, actionable sentence starting with a verb (e.g., "Understand", "Explain", "Apply"). Return ONLY a JSON object.`,
        response_json_schema: {
          type: "object",
          properties: {
            objectives: { type: "array", items: { type: "string" } }
          }
        },
        model: "gemini_3_flash",
      });
      const data = typeof res === "string" ? JSON.parse(res) : res;
      setObjectives(data.objectives || []);
    } catch {
      setObjectives([
        `Understand the core concepts of ${topic.name}`,
        `Learn key principles and definitions`,
        `Apply knowledge through real-world examples`,
        `Practice with worked problems`,
        `Build confidence in the topic`,
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[800px] mx-auto w-full">
      {/* Hero illustration */}
      <div className="w-full h-40 rounded-3xl overflow-hidden">
        <SubjectIllustration subject={topic.subject} className="w-full h-full" />
      </div>

      {/* Topic info */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: themeColor.accent }}>
          {topic.subject} · {topic.chapter || "Chapter"}
        </p>
        <h1 className="text-[28px] lg:text-[32px] font-medium text-[#202124] tracking-tight leading-tight">
          {topic.name}
        </h1>
      </div>

      {/* What you'll learn */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/50 p-8">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5" style={{ color: themeColor.accent }} />
          <h2 className="text-[18px] font-medium text-[#202124]">What you'll learn</h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: themeColor.accent }} />
            <p className="text-sm text-[#5f6368]">Preparing your learning path...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: themeColor.light }}>
                  <span className="text-xs font-medium" style={{ color: themeColor.accent }}>{i + 1}</span>
                </div>
                <p className="text-sm text-[#3c4043] leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#5f6368]">
          <Clock className="w-4 h-4" /> ~10 min
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5f6368]">
          <BookOpen className="w-4 h-4" /> {topic.chapter || "Chapter"}
        </div>
        {isBookmarked && (
          <div className="flex items-center gap-2 text-sm" style={{ color: themeColor.accent }}>
            <CheckCircle2 className="w-4 h-4" /> Bookmarked
          </div>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="inline-flex items-center justify-center gap-2 h-12 px-8 text-white rounded-full text-sm font-medium self-start active:scale-95 transition-all"
        style={{ backgroundColor: themeColor.accent }}
      >
        <Play className="w-[18px] h-[18px]" /> Start learning
      </button>
    </div>
  );
}