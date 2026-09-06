import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Target, ArrowRight, Clock, TrendingUp,
  RotateCw, ArrowLeft, PencilRuler, Brain,
} from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import SubjectPills from "@/components/dashboard/learn/SubjectPills";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";
import QuizView from "@/components/dashboard/practice/QuizView";

function getAdaptLevel(mastery) {
  if (mastery >= 70) return "Advanced";
  if (mastery >= 40) return "Intermediate";
  return "Foundational";
}

const levelColors = {
  Foundational: "bg-green-50 text-green-700",
  Intermediate: "bg-amber-50 text-amber-700",
  Advanced: "bg-rose-50 text-rose-700",
};

export default function Practice() {
  const studentData = useStudentData();
  const themeColor = useThemeColor();
  const [searchParams, setSearchParams] = useSearchParams();

  const contextSubject = searchParams.get("subject");
  const contextTopic = searchParams.get("topic");

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const subjects = studentData.subjects;
  const activeSubject = selectedSubject || contextSubject || subjects[0]?.name || null;

  // Auto-start quiz from URL params
  useEffect(() => {
    if (contextSubject && contextTopic && !studentData.loading && !activeChallenge && !loadingQuiz) {
      const topic = studentData.topics.find(
        (t) => t.name === contextTopic && t.subject === contextSubject
      );
      if (topic) startQuiz(topic);
    }
  }, [contextSubject, contextTopic, studentData.loading, activeChallenge, loadingQuiz]);

  const startQuiz = useCallback(async (topic) => {
    setActiveChallenge(topic);
    setLoadingQuiz(true);
    setQuiz(null);
    setSearchParams({ subject: topic.subject, topic: topic.name }, { replace: true });

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert quiz generator for K-12 students. Create a quiz for the topic "${topic.name}" in ${topic.subject}.

The student's current mastery is ${topic.mastery || 0}%. ${
  (topic.mastery || 0) < 40
    ? "Start with foundational questions."
    : (topic.mastery || 0) < 70
    ? "Use intermediate level questions."
    : "Use advanced level questions."
}

Generate exactly 10 multiple-choice questions. Mix regular MCQ (4 options) with True/False (2 options). Each question should have exactly one correct answer, a hint that guides without revealing the answer, a clear explanation, and a recommended lesson title for further study.

Return ONLY a JSON object:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "hint": "A helpful hint without revealing the answer",
      "explanation": "Why the correct answer is correct",
      "recommended_lesson": "A topic name for further study"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "number" },
                  hint: { type: "string" },
                  explanation: { type: "string" },
                  recommended_lesson: { type: "string" },
                },
              },
            },
          },
        },
        model: "gemini_3_flash",
      });
      setQuiz(typeof res === "string" ? JSON.parse(res) : res);
    } catch {
      setQuiz({
        questions: [
          {
            question: `What is the main concept of ${topic.name}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct_answer: 0,
            hint: "Think about the fundamental definition.",
            explanation: "Unable to generate quiz. Please try again.",
            recommended_lesson: topic.name,
          },
        ],
      });
    }
    setLoadingQuiz(false);
  }, []);

  const handleQuizComplete = async (finalScore) => {
    if (!activeChallenge || !quiz) return;
    const total = quiz.questions.length;
    const pct = Math.round((finalScore / total) * 100);
    const newMastery = Math.round(((activeChallenge.mastery || 0) + pct) / 2);

    try {
      await base44.entities.Topic.update(activeChallenge.id, {
        practice_count: (activeChallenge.practice_count || 0) + 1,
        mastery: newMastery,
        last_studied: new Date().toISOString().split("T")[0],
        status: newMastery >= 70 ? "mastered" : "in-progress",
      });
      await base44.entities.StudyLog.create({
        date: new Date().toISOString().split("T")[0],
        subject: activeChallenge.subject,
        topic: activeChallenge.name,
        duration_minutes: total * 2,
        confidence: pct,
      });
    } catch {
      // silent
    }
  };

  const exitQuiz = () => {
    setActiveChallenge(null);
    setQuiz(null);
    setSearchParams({}, { replace: true });
  };

  // ── Quiz active ──
  if (activeChallenge) {
    return (
      <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1000px] mx-auto w-full">
        <button
          onClick={exitQuiz}
          className="flex items-center gap-2 text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors self-start"
        >
          <ArrowLeft className="w-[18px] h-[18px]" /> Exit quiz
        </button>
        <QuizView
          topic={activeChallenge}
          questions={quiz?.questions}
          loading={loadingQuiz}
          onExit={exitQuiz}
          onComplete={handleQuizComplete}
        />
      </div>
    );
  }

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  // ── Topics for selected subject ──
  const subjectTopics = studentData.topics
    .filter((t) => t.subject === activeSubject)
    .sort((a, b) => {
      const getNum = (ch) => {
        if (!ch) return 999;
        const match = ch.match(/\d+/);
        return match ? parseInt(match[0]) : 999;
      };
      return getNum(a.chapter) - getNum(b.chapter);
    })
    .map((t) => ({
      ...t,
      adaptLevel: getAdaptLevel(t.mastery || 0),
      questions: 10,
      isMastered: t.status === "mastered",
    }));

  const overallMastery = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + (s.overall_mastery || 0), 0) / subjects.length)
    : 0;
  const masteredCount = studentData.topics.filter((t) => t.status === "mastered").length;
  const totalPractice = studentData.topics.reduce((sum, t) => sum + (t.practice_count || 0), 0);

  return (
    <div className="flex flex-col gap-12 p-8 lg:p-12 max-w-[1200px] mx-auto w-full">
      <SubjectPills subjects={subjects} activeSubject={activeSubject} onSelect={setSelectedSubject} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 lg:gap-6">
        <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
            <TrendingUp className="w-5 h-5" style={{ color: themeColor.accent }} />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-medium text-[#202124] leading-none">{overallMastery}%</p>
            <p className="text-xs text-[#5f6368] mt-1.5">Overall confidence</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
          <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-medium text-[#202124] leading-none">{masteredCount}</p>
            <p className="text-xs text-[#5f6368] mt-1.5">Topics mastered</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-medium text-amber-800 leading-none">{totalPractice}</p>
            <p className="text-xs text-amber-600 mt-1.5">Practice sessions</p>
          </div>
        </div>
      </div>

      {/* Topics heading */}
      <div>
        <h2 className="text-[22px] font-medium text-[#202124]">{activeSubject} — Practice questions</h2>
        <p className="text-sm font-normal text-[#5f6368] mt-1">Pick any topic to start a 10-question adaptive quiz</p>
      </div>

      {/* Topic cards */}
      {subjectTopics.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Target className="w-10 h-10 text-[#dadce0]" />
          <p className="text-sm text-[#5f6368]">No topics available for this subject yet.</p>
          <Link to="/dashboard/learn" className="text-sm font-medium hover:underline" style={{ color: themeColor.accent }}>
            Browse lessons →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectTopics.map((t) => {
            const lc = levelColors[t.adaptLevel] || levelColors.Intermediate;
            return (
              <button
                key={t.id}
                onClick={() => startQuiz(t)}
                className="flex flex-col text-left bg-white rounded-3xl border border-[#dadce0]/50 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="w-full h-20 shrink-0">
                  <SubjectIllustration subject={t.subject} className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-3 p-6 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${lc}`}>{t.adaptLevel}</span>
                    {t.isMastered && (
                      <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">Mastered</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#5f6368] mb-1">{t.chapter || t.subject}</p>
                    <h3 className="text-[17px] font-medium text-[#202124] line-clamp-2">{t.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#5f6368]">
                    <span>{t.questions} questions</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.questions * 2} min</span>
                    {t.practice_count > 0 && (
                      <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" />{t.practice_count}×</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[#5f6368]">{t.mastery || 0}%</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${t.mastery || 0}%`, backgroundColor: themeColor.accent }} />
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-center gap-1.5 h-10 text-white rounded-full text-xs font-medium mt-1"
                    style={{ backgroundColor: themeColor.accent }}
                  >
                    {t.isMastered ? (
                      <><RotateCw className="w-3.5 h-3.5" /> Re-practice</>
                    ) : (
                      <><PencilRuler className="w-3.5 h-3.5" /> Start practice <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}