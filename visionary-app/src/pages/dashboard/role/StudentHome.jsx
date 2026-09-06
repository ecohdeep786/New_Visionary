import { Link } from "react-router-dom";
import { ArrowRight, Boxes, ChevronRight } from "lucide-react";
import AITeacherHero from "@/components/dashboard/AITeacherHero";
import UpNextCard from "@/components/dashboard/UpNextCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import AchievementsCard from "@/components/dashboard/AchievementsCard";
import LaggingTopicsCard from "@/components/dashboard/LaggingTopicsCard";
import ExamReadinessCard from "@/components/dashboard/ExamReadinessCard";
import StreakCard from "@/components/dashboard/StreakCard";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";
import GamificationSection from "@/components/dashboard/GamificationSection";
import ReferralCard from "@/components/dashboard/ReferralCard";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function StudentHome() {
  const studentData = useStudentData();
  const { user } = useAuth();
  const userName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Learner";
  const themeColor = useThemeColor();

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  const upNextTopics = (studentData.upNextList || []).slice(0, 3);
  const streak = studentData.dailyStats?.streak || 0;

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      {/* 1. AGI Hero + Daily Streak */}
      <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
        <div className="flex-1">
          <AITeacherHero userName={userName} studentData={studentData} />
        </div>
        <div className="shrink-0">
          <StreakCard streak={streak} studyLogs={studentData.studyLogs} />
        </div>
      </div>

      {/* 2. Build */}
      <Link
        to="/dashboard/build"
        className="relative overflow-hidden flex items-center gap-5 p-8 bg-white rounded-3xl border border-[#dadce0]/50 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
          <Boxes className="w-6 h-6" style={{ color: themeColor.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-[22px] font-medium text-[#202124]">Build</p>
          <p className="text-sm font-normal text-[#5f6368] mt-1">Apply mastered concepts in real projects</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1" style={{ backgroundColor: themeColor.light }}>
          <ArrowRight className="w-[18px] h-[18px]" style={{ color: themeColor.accent }} />
        </div>
      </Link>

      {/* 4. Up Next */}
      <UpNextCard topics={upNextTopics} studyLogs={studentData.studyLogs} />

      {/* 5. Needs Attention */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-medium text-[#202124]">Needs attention</h2>
        </div>
        <div className="p-8 bg-white rounded-3xl">
          <LaggingTopicsCard topics={studentData.laggingTopics} />
        </div>
      </div>

      {/* 6. Your Subjects */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-medium text-[#202124]">Your subjects</h2>
            <p className="text-sm font-normal text-[#5f6368] mt-1">Track mastery across your curriculum</p>
          </div>
          <Link to="/dashboard/learn" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors" style={{ backgroundColor: themeColor.light, color: themeColor.accent }}>
            View mastery map <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentData.subjects.slice(0, 6).map((s) => {
            const mastery = s.overall_mastery || 0;
            return (
              <Link key={s.id} to={`/dashboard/learn?subject=${encodeURIComponent(s.name)}`} className="flex flex-col bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all">
                <div className="w-full h-28">
                  <SubjectIllustration subject={s.name} className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-4 p-8">
                  <div>
                    <h3 className="text-[17px] font-medium text-[#202124]">{s.name}</h3>
                    <p className="text-sm font-normal text-[#5f6368] mt-1">
                      {s.board ? `${s.board} · ` : ""}{s.topics_mastered || 0}/{s.topics_total || 0} mastered
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${mastery}%`, backgroundColor: mastery >= 70 ? "#34a853" : mastery >= 40 ? themeColor.accent : "#fbbc05" }} />
                    </div>
                    <span className="text-sm font-medium text-[#5f6368] w-8 text-right">{mastery}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 7. Exam Readiness */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">Exam readiness</h2>
        <ExamReadinessCard exams={studentData.exams} />
      </div>

      {/* 8. Progress */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-medium text-[#202124]">Progress</h2>
          <Link to="/dashboard/learn" className="text-sm text-[#1a73e8] hover:underline font-medium">View progress</Link>
        </div>
        <ProgressCard studentData={studentData} />
      </div>

      {/* 9. Take a break */}
      <CollapsibleSection title="Take a break" subtitle="Relax your mind, then come back stronger">
        <GamificationSection />
      </CollapsibleSection>

      {/* 10. Achievements */}
      <CollapsibleSection
        title="Achievements"
        action={
          <button className="flex items-center gap-1 text-sm text-[#1a73e8] font-medium hover:underline">
            View all <ChevronRight className="w-[18px] h-[18px]" />
          </button>
        }
      >
        <AchievementsCard studentData={studentData} />
      </CollapsibleSection>

      {/* Refer & earn */}
      <ReferralCard />
    </div>
  );
}