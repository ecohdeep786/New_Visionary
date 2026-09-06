import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Build a short AI reasoning string from student data
function buildReasoning(studentData, userName) {
  const { resumeTopic, laggingTopics, topics, dailyStats } = studentData;

  if (laggingTopics?.length > 0) {
    const t = laggingTopics[0];
    return `You've been working on ${t.name} — your confidence is at ${t.mastery || 0}%. Let's push past that plateau today.`;
  }
  if (resumeTopic) {
    const m = resumeTopic.mastery || 0;
    if (m < 50) return `You left off at ${resumeTopic.name} with ${m}% mastery. A focused session now will make a real difference.`;
    return `You're ${m}% through ${resumeTopic.name}. You're close — let's finish strong.`;
  }
  if (topics?.length === 0) {
    return `I'm ready to teach you anything. Let's pick your first topic together.`;
  }
  return `You're making steady progress. I've lined up exactly what you need next.`;
}

// "Things I remember" — 2–3 AI memory bullets
function buildMemoryItems(studentData) {
  const items = [];
  const { studyLogs, topics, dailyStats } = studentData;

  const subjectCounts = {};
  (studyLogs || []).forEach((l) => {
    subjectCounts[l.subject] = (subjectCounts[l.subject] || 0) + 1;
  });
  const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topSubject) items.push(`You study ${topSubject} most often`);

  const avgConf = (studyLogs || []).length > 0
    ? Math.round((studyLogs || []).reduce((s, l) => s + (l.confidence || 0), 0) / studyLogs.length)
    : null;
  if (avgConf !== null && avgConf > 0) items.push(`Your average confidence is ${avgConf}%`);

  const mastered = (topics || []).filter((t) => t.status === "mastered").length;
  if (mastered > 0) items.push(`You've mastered ${mastered} topic${mastered !== 1 ? "s" : ""} so far`);

  if (items.length === 0) items.push("Your learning journey starts here");

  return items.slice(0, 3);
}

export default function AITeacherHero({ userName, studentData }) {
  const themeColor = useThemeColor();
  const [thinkAloud, setThinkAloud] = useState(true);
  const [thinkStep, setThinkStep] = useState(0);

  const thinkSteps = [
    "Reviewing your recent sessions…",
    "Identifying your next challenge…",
    "Ready for you.",
  ];

  // Simulate AI "think-aloud" on mount — 2.5s total
  useEffect(() => {
    if (!thinkAloud) return;
    const timers = [
      setTimeout(() => setThinkStep(1), 900),
      setTimeout(() => setThinkStep(2), 1800),
      setTimeout(() => { setThinkAloud(false); }, 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const greeting = getGreeting();
  const reasoning = buildReasoning(studentData, userName);
  const memoryItems = buildMemoryItems(studentData);

  const primaryTopic =
    studentData.laggingTopics?.[0] ||
    studentData.resumeTopic ||
    studentData.upNext ||
    studentData.topics?.[0] ||
    null;

  const confidence = primaryTopic?.mastery || 0;
  const estimatedMinutes = primaryTopic?.has_3d ? 20 : 15;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + AI label */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: themeColor.light }}
        >
          <Sparkles className="w-5 h-5" style={{ color: themeColor.accent }} />
        </div>
        <span className="text-sm font-medium text-[#5f6368]">Your AGI teacher</span>
      </div>

      <div>
        <h1 className="text-[32px] lg:text-[40px] font-medium text-[#202124] tracking-tight leading-tight">
          {greeting}, {userName}.
        </h1>

        {/* AI Think-Aloud */}
        {thinkAloud ? (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "300ms" }} />
            </div>
            <span className="text-base text-[#5f6368]">{thinkSteps[thinkStep]}</span>
          </div>
        ) : (
          <p className="text-base text-[#3c4043] mt-3 leading-relaxed max-w-xl">
            {reasoning}
          </p>
        )}
      </div>

      {/* Today's lesson card — one clear primary action */}
      {!thinkAloud && primaryTopic && (
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ backgroundColor: themeColor.light }}
        >
          {/* Subject illustration on the right */}
          <div className="absolute right-0 top-0 h-full w-2/5 opacity-25 pointer-events-none">
            <SubjectIllustration subject={primaryTopic.subject} className="w-full h-full" />
          </div>

          <div className="relative z-10 flex flex-col gap-5 p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-[#5f6368]">Today's lesson</span>
                <h2 className="text-[22px] font-medium text-[#202124] leading-snug">{primaryTopic.name}</h2>
                <p className="text-sm text-[#5f6368]">
                  {primaryTopic.subject}{primaryTopic.chapter ? ` · ${primaryTopic.chapter}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                <span className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wide">Est. time</span>
                <span className="text-[22px] font-medium text-[#202124]">{estimatedMinutes} min</span>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-[#5f6368]">
                <span>Your confidence</span>
                <span className="font-medium">{confidence}%</span>
              </div>
              <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${confidence}%`, backgroundColor: themeColor.accent }}
                />
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex items-center gap-4">
              <Link
                to={`/dashboard/learn/${primaryTopic.id}`}
                className="inline-flex items-center gap-2 h-11 px-7 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: themeColor.accent }}
              >
                Start lesson <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
              <Link
                to={`/dashboard/practice?subject=${encodeURIComponent(primaryTopic.subject)}&topic=${encodeURIComponent(primaryTopic.name)}`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium text-[#3c4043] bg-white border border-[#dadce0] hover:bg-gray-50 transition-colors"
              >
                Practice instead
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Things I remember */}
      {!thinkAloud && memoryItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#5f6368]" />
            <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Things I remember about you</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {memoryItems.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: themeColor.light, color: themeColor.accent }}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}