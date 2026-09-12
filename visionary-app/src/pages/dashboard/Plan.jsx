import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Target, BookOpen, CheckCircle2, ArrowRight, TrendingUp, Zap, Award } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function Plan() {
  const studentData = useStudentData();
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const userName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Learner";

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  // Generate daily plan based on student data
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  
  // Get topics that need attention (low mastery or not started)
  const needsAttentionTopics = studentData.topics
    .filter((t) => t.status === "not-started" || t.status === "needs-review" || (t.mastery || 0) < 50)
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
    .slice(0, 5);

  // Get in-progress topics to continue
  const inProgressTopics = studentData.topics
    .filter((t) => t.status === "in-progress")
    .sort((a, b) => new Date(b.last_studied || "2000-01-01") - new Date(a.last_studied || "2000-01-01"))
    .slice(0, 3);

  // Recommended daily goals
  const dailyGoalMinutes = 45;
  const todayStudyMinutes = studentData.studyLogs
    .filter((log) => log.date === today.toISOString().split("T")[0])
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  
  const progressPercent = Math.min(100, Math.round((todayStudyMinutes / dailyGoalMinutes) * 100));

  // Weekly summary
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLogs = studentData.studyLogs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= weekAgo && logDate <= today;
  });
  
  const totalWeekMinutes = weekLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const weekSessions = weekLogs.length;
  const avgDailyMinutes = Math.round(totalWeekMinutes / 7);

  // Upcoming exams (if any)
  const upcomingExams = (studentData.exams || []).filter((e) => {
    const examDate = new Date(e.date);
    return examDate >= today;
  }).slice(0, 3);

  // Subject balance recommendation
  const subjectPriority = [...studentData.subjects]
    .sort((a, b) => (a.overall_mastery || 0) - (b.overall_mastery || 0))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      {/* Hero: Today's Plan */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] lg:text-[32px] font-medium text-[#202124] tracking-tight">
            Good morning, {userName}
          </h1>
          <p className="text-sm text-[#5f6368] mt-1">
            {dayName}'s personalized learning plan • {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Daily progress ring */}
        <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-[#dadce0]/50">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e8eaed"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={themeColor.accent}
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold" style={{ color: themeColor.accent }}>{progressPercent}%</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-[#202124]">Daily Goal</h3>
            <p className="text-sm text-[#5f6368] mt-0.5">
              {todayStudyMinutes} of {dailyGoalMinutes} minutes studied today
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Zap className="w-4 h-4" style={{ color: themeColor.accent }} />
              <span className="text-xs font-medium" style={{ color: themeColor.accent }}>
                {progressPercent >= 100 ? "🎉 Goal achieved!" : `${dailyGoalMinutes - todayStudyMinutes} minutes to go`}
              </span>
            </div>
          </div>
          <Link
            to="/dashboard/learn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{ backgroundColor: themeColor.light, color: themeColor.accent }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Priority Focus */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-medium text-[#202124]">Priority focus</h2>
            <p className="text-sm text-[#5f6368] mt-1">Start with these to build momentum</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inProgressTopics.length > 0 ? (
            inProgressTopics.map((t) => (
              <Link
                key={t.id}
                to={`/dashboard/learn/${t.id}`}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dadce0]/50 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
                  <BookOpen className="w-5 h-5" style={{ color: themeColor.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202124] truncate">{t.name}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">{t.subject} • {(t.mastery || 0)}% mastery</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5f6368] group-hover:translate-x-1 transition-transform" />
              </Link>
            ))
          ) : (
            <div className="col-span-2 flex items-center gap-4 p-6 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">All caught up!</p>
                <p className="text-xs text-green-600 mt-0.5">No in-progress topics. Explore new concepts.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttentionTopics.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-medium text-[#202124]">Needs attention</h2>
              <p className="text-sm text-[#5f6368] mt-1">Build foundation in these areas</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {needsAttentionTopics.map((t, i) => (
              <Link
                key={t.id}
                to={`/dashboard/learn/${t.id}`}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dadce0]/50 hover:shadow-md transition-all group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202124] truncate">{t.name}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">{t.subject} • {(t.mastery || 0)}% confidence</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${t.mastery || 0}%`, backgroundColor: t.mastery >= 40 ? themeColor.accent : "#fbbc05" }} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6368] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subject Balance */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Subject balance</h2>
          <p className="text-sm text-[#5f6368] mt-1">Focus more on these subjects this week</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subjectPriority.map((s) => (
            <Link
              key={s.id}
              to={`/dashboard/learn?subject=${encodeURIComponent(s.name)}`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-[#dadce0]/50 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
                <Target className="w-6 h-6" style={{ color: themeColor.accent }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#202124]">{s.name}</p>
                <p className="text-xs text-[#5f6368] mt-0.5">{s.overall_mastery || 0}% mastery</p>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.overall_mastery || 0}%`, backgroundColor: s.overall_mastery >= 70 ? "#34a853" : themeColor.accent }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-medium text-[#202124]">Weekly summary</h2>
            <p className="text-sm text-[#5f6368] mt-1">Your learning activity over the past 7 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f1f3f4]">
            <TrendingUp className="w-4 h-4 text-[#5f6368]" />
            <span className="text-xs font-medium text-[#5f6368]">Last 7 days</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
            <Clock className="w-6 h-6" style={{ color: themeColor.accent }} />
            <span className="text-2xl font-semibold text-[#202124]">{Math.round(totalWeekMinutes / 60)}h {totalWeekMinutes % 60}m</span>
            <span className="text-xs text-[#5f6368]">Total study time</span>
          </div>
          <div className="flex flex-col gap-2 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
            <Calendar className="w-6 h-6" style={{ color: themeColor.accent }} />
            <span className="text-2xl font-semibold text-[#202124]">{weekSessions}</span>
            <span className="text-xs text-[#5f6368]">Study sessions</span>
          </div>
          <div className="flex flex-col gap-2 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
            <Award className="w-6 h-6" style={{ color: themeColor.accent }} />
            <span className="text-2xl font-semibold text-[#202124]">{avgDailyMinutes}m</span>
            <span className="text-xs text-[#5f6368]">Daily average</span>
          </div>
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-[22px] font-medium text-[#202124]">Upcoming exams</h2>
            <p className="text-sm text-[#5f6368] mt-1">Prepare for these assessments</p>
          </div>
          <div className="flex flex-col gap-3">
            {upcomingExams.map((exam) => {
              const examDate = new Date(exam.date);
              const daysUntil = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={exam.id} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dadce0]/50">
                  <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
                    <span className="text-xs font-medium" style={{ color: themeColor.accent }}>{examDate.toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="text-xl font-semibold" style={{ color: themeColor.accent }}>{examDate.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#202124]">{exam.name}</p>
                    <p className="text-xs text-[#5f6368] mt-0.5">{exam.subject} • {daysUntil} days remaining</p>
                  </div>
                  <Link
                    to={`/dashboard/practice?subject=${encodeURIComponent(exam.subject)}`}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{ backgroundColor: themeColor.light, color: themeColor.accent }}
                  >
                    Practice
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          to="/dashboard/practice"
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-[#dadce0]/50 hover:shadow-md transition-all"
        >
          <Target className="w-4 h-4" style={{ color: themeColor.accent }} />
          <span className="text-sm font-medium text-[#202124]">Quick practice</span>
        </Link>
        <Link
          to="/dashboard/ask"
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-[#dadce0]/50 hover:shadow-md transition-all"
        >
          <BookOpen className="w-4 h-4" style={{ color: themeColor.accent }} />
          <span className="text-sm font-medium text-[#202124]">Ask AGI</span>
        </Link>
        <Link
          to="/dashboard/build"
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-[#dadce0]/50 hover:shadow-md transition-all"
        >
          <Zap className="w-4 h-4" style={{ color: themeColor.accent }} />
          <span className="text-sm font-medium text-[#202124]">Build project</span>
        </Link>
      </div>
    </div>
  );
}
