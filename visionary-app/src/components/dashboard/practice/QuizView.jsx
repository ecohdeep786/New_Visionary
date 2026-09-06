import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark, Check, X, Lightbulb, ArrowRight, ArrowLeft,
  SkipForward, Star, BookOpen, Trophy, RotateCw,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";

const GOOGLE_BLUE = "#1a73e8";

export default function QuizView({ topic, questions, loading, onExit, onComplete }) {
  const themeColor = useThemeColor();
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizState, setQuizState] = useState("answering");
  const [showHint, setShowHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  const question = questions?.[currentQ];
  const totalQuestions = questions?.length || 0;

  const handleCheck = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === question.correct_answer;
    if (isCorrect) {
      setQuizState("correct");
      setScore(score + 1);
    } else if (attemptCount === 0) {
      setQuizState("wrong");
      setAttemptCount(1);
    } else {
      setQuizState("explained");
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowHint(false);
    setQuizState("answering");
  };

  const goNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setQuizState("answering");
      setShowHint(false);
      setAttemptCount(0);
    } else {
      setQuizCompleted(true);
      onComplete(score);
    }
  };

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setSelectedAnswer(null);
      setQuizState("answering");
      setShowHint(false);
      setAttemptCount(0);
    }
  };

  const handleSave = async () => {
    if (saved || !question) return;
    try {
      await base44.entities.Question.create({
        subject: topic.subject || "",
        topic: topic.name || "",
        question: question.question,
      });
      setSaved(true);
    } catch {
      // silent
    }
  };

  const getOptionStyle = (idx) => {
    const base = { bg: "#fff", border: "#dadce0", text: "#202124", borderWidth: "1px" };
    if (quizState === "answering") {
      if (selectedAnswer === idx)
        return { bg: themeColor.light, border: themeColor.accent, text: themeColor.accent, borderWidth: "2px" };
      return base;
    }
    if (quizState === "correct") {
      if (idx === question.correct_answer)
        return { bg: "#e8f5e9", border: "#34a853", text: "#1e8e3e", borderWidth: "2px" };
      return base;
    }
    if (quizState === "wrong") {
      if (selectedAnswer === idx)
        return { bg: "#fce8e6", border: "#ea4335", text: "#d93025", borderWidth: "2px" };
      return base;
    }
    if (quizState === "explained") {
      if (idx === question.correct_answer)
        return { bg: "#e8f5e9", border: "#34a853", text: "#1e8e3e", borderWidth: "2px" };
      if (selectedAnswer === idx)
        return { bg: "#fce8e6", border: "#ea4335", text: "#d93025", borderWidth: "2px" };
      return base;
    }
    return base;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: GOOGLE_BLUE }} />
        <p className="text-sm text-[#5f6368]">Generating adaptive questions...</p>
      </div>
    );
  }

  // ── Quiz completed ──
  if (quizCompleted) {
    const pct = Math.round((score / totalQuestions) * 100);
    return (
      <div className="flex flex-col items-center gap-8 py-16 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
          <Trophy className="w-10 h-10" style={{ color: themeColor.accent }} />
        </div>
        <div>
          <h2 className="text-[32px] font-medium text-[#202124]">{score}/{totalQuestions}</h2>
          <p className="text-sm text-[#5f6368] mt-2">
            {pct === 100 ? "Perfect! You've mastered this topic." : pct >= 50 ? "Good work! Keep practicing to improve." : "Keep going — review the lesson and try again."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentQ(0); setSelectedAnswer(null); setQuizState("answering");
              setShowHint(false); setAttemptCount(0); setScore(0); setQuizCompleted(false);
            }}
            className="inline-flex items-center gap-2 h-11 px-6 text-white rounded-full text-sm font-medium active:scale-95 transition-all"
            style={{ backgroundColor: themeColor.accent }}
          >
            <RotateCw className="w-[18px] h-[18px]" /> Re-practice
          </button>
          <Link
            to={`/dashboard/ask?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[#dadce0] text-sm font-medium text-[#5f6368] hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="w-[18px] h-[18px]" /> Ask AGI
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const correctOption = question.options[question.correct_answer];

  return (
    <div className="flex flex-col gap-8 max-w-[760px] mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#5f6368]">
        <button onClick={onExit} className="hover:text-[#202124] transition-colors">Practice</button>
        <span className="text-[#9aa0a6]">›</span>
        <span>{topic.subject}</span>
        <span className="text-[#9aa0a6]">›</span>
        <span className="text-[#202124] font-medium truncate">Practice questions — {topic.name}</span>
      </nav>

      {/* Question header + Save */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] lg:text-[26px] font-medium text-[#202124] tracking-tight leading-snug flex-1">
          {question.question}
        </h1>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#dadce0] text-sm font-medium text-[#5f6368] hover:bg-gray-50 transition-colors shrink-0"
        >
          <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} style={saved ? { color: themeColor.accent } : {}} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {/* Question meta */}
      <p className="text-xs font-medium text-[#5f6368] tracking-wide uppercase">
        Question {currentQ + 1} of {totalQuestions}
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden -mt-4">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + (quizState !== "answering" ? 1 : 0)) / totalQuestions) * 100}%`, backgroundColor: themeColor.accent }} />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((opt, idx) => {
          const style = getOptionStyle(idx);
          const showCheck = (quizState === "correct" || quizState === "explained") && idx === question.correct_answer;
          const showX = (quizState === "wrong" || quizState === "explained") && idx === selectedAnswer && idx !== question.correct_answer;
          return (
            <button
              key={idx}
              onClick={() => quizState === "answering" && setSelectedAnswer(idx)}
              disabled={quizState !== "answering"}
              className="flex items-center gap-4 p-4 lg:p-5 rounded-2xl text-left transition-all"
              style={{
                backgroundColor: style.bg,
                border: `${style.borderWidth} solid ${style.border}`,
                color: style.text,
                cursor: quizState === "answering" ? "pointer" : "default",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
                style={{ backgroundColor: quizState === "answering" && selectedAnswer === idx ? "rgba(255,255,255,0.5)" : "#f1f3f4", color: "#5f6368" }}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="text-sm font-medium flex-1">{opt}</span>
              {showCheck && <Check className="w-5 h-5 shrink-0" style={{ color: "#34a853" }} />}
              {showX && <X className="w-5 h-5 shrink-0" style={{ color: "#ea4335" }} />}
            </button>
          );
        })}
      </div>

      {/* ── Correct feedback ── */}
      {quizState === "correct" && question.explanation && (
        <div className="p-6 rounded-2xl" style={{ backgroundColor: "#e8f5e9" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#34a853" }}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium" style={{ color: "#1e8e3e" }}>Correct!</p>
          </div>
          <p className="text-sm text-[#3c4043] leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* ── Hint box ── */}
      {quizState === "wrong" && showHint && question.hint && (
        <div className="p-6 rounded-2xl" style={{ backgroundColor: "#e9eef6" }}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" style={{ color: GOOGLE_BLUE }} />
            <p className="text-sm font-medium" style={{ color: GOOGLE_BLUE }}>Hint</p>
          </div>
          <p className="text-sm text-[#3c4043] leading-relaxed">{question.hint}</p>
        </div>
      )}

      {/* ── Explanation panel ── */}
      {quizState === "explained" && (
        <div className="p-6 rounded-2xl" style={{ backgroundColor: "#f1f5f9" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5" style={{ color: "#34a853", fill: "#34a853" }} />
            <p className="text-sm font-medium text-[#202124]">Correct answer is: {correctOption}</p>
          </div>
          <p className="text-xs font-medium tracking-wide uppercase mb-2" style={{ color: GOOGLE_BLUE }}>Solution / Explanation</p>
          <p className="text-sm text-[#3c4043] leading-relaxed mb-6">{question.explanation}</p>
          {question.recommended_lesson && (
            <>
              <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: GOOGLE_BLUE }}>Recommended for you</p>
              <Link
                to={`/dashboard/learn`}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#dadce0]/50 hover:bg-gray-50 transition-colors mb-3"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
                  <BookOpen className="w-4 h-4" style={{ color: themeColor.accent }} />
                </div>
                <p className="text-sm font-medium text-[#202124] flex-1">{question.recommended_lesson}</p>
                <ArrowRight className="w-4 h-4 text-[#5f6368] shrink-0" />
              </Link>
              <Link
                to={`/dashboard/ask?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: GOOGLE_BLUE, color: GOOGLE_BLUE }}
              >
                Go to lesson
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2">
        {/* Left: Previous + Skip */}
        <div className="flex items-center gap-4">
          {currentQ > 0 && (
            <button
              onClick={handlePrevious}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          )}
          {quizState === "answering" && (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors"
            >
              <SkipForward className="w-4 h-4" /> Skip
            </button>
          )}
        </div>

        {/* Right: state-specific actions */}
        <div className="flex items-center gap-3">
          {quizState === "answering" && (
            <button
              onClick={handleCheck}
              disabled={selectedAnswer === null}
              className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOOGLE_BLUE }}
            >
              Check
            </button>
          )}
          {quizState === "correct" && (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOOGLE_BLUE }}
            >
              {currentQ < totalQuestions - 1 ? "Next question" : "See results"} <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {quizState === "wrong" && (
            <>
              {!showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-medium transition-colors hover:bg-gray-50"
                  style={{ color: GOOGLE_BLUE }}
                >
                  <Lightbulb className="w-4 h-4" /> Show hint
                </button>
              )}
              <button
                onClick={handleTryAgain}
                className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GOOGLE_BLUE }}
              >
                Try again
              </button>
            </>
          )}
          {quizState === "explained" && (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOOGLE_BLUE }}
            >
              {currentQ < totalQuestions - 1 ? "Next question" : "See results"} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}