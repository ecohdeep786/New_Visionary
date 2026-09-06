import { Link } from "react-router-dom";
import { Flame, BookOpen, Target, Clock, Calendar, Crown, LogOut, ChevronRight, Bell, Globe, Shield, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";

export default function Profile() {
  const { user } = useAuth();
  const studentData = useStudentData();

  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const initial = userName?.charAt(0)?.toUpperCase() || "U";
  const joinDate = user?.created_date
    ? new Date(user.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  const streak = studentData.dailyStats?.streak || 0;
  const subjectCount = studentData.subjects?.length || 0;
  const masteredCount = studentData.topics?.filter((t) => t.status === "mastered").length || 0;
  const totalMinutes = studentData.studyLogs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
  const totalHours = Math.round(totalMinutes / 60);

  const stats = [
    { icon: Flame, label: "Day streak", value: streak, color: "#ea4335" },
    { icon: BookOpen, label: "Subjects", value: subjectCount, color: "#1a73e8" },
    { icon: Target, label: "Mastered", value: masteredCount, color: "#34a853" },
    { icon: Clock, label: "Study hours", value: totalHours, color: "#fbbc05" },
  ];

  const settings = [
    { icon: Bell, label: "Notifications", desc: "Manage your alerts" },
    { icon: Globe, label: "Language", desc: "English (United States)" },
    { icon: Shield, label: "Privacy & security", desc: "Account protection" },
    { icon: Palette, label: "Appearance", desc: "Theme and display" },
  ];

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a73e8]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[800px] mx-auto w-full">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-24 h-24 rounded-full bg-[#1a73e8] flex items-center justify-center text-4xl font-medium text-white">
          {initial}
        </div>
        <div className="text-center">
          <h1 className="text-[28px] font-normal text-[#202124]">{userName}</h1>
          <p className="text-sm text-[#5f6368] mt-1">{user?.email}</p>
          <div className="flex items-center gap-2 justify-center mt-2">
            {joinDate && (
              <span className="text-xs text-[#5f6368] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {joinDate}
              </span>
            )}
            <span className="px-2 py-0.5 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-xs font-medium capitalize">
              {user?.role || "Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl border border-[#dadce0]/50">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-2xl font-medium text-[#202124]">{s.value}</span>
              <span className="text-xs text-[#5f6368]">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Subscription */}
      <Link
        to="/dashboard/subscription"
        className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-[#dadce0]/50 hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#202124]">Subscription</p>
          <p className="text-xs text-[#5f6368] mt-0.5">Manage your plan</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#5f6368]" />
      </Link>

      {/* Settings */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[18px] font-medium text-[#202124] px-2">Settings</h2>
        <div className="bg-white rounded-2xl border border-[#dadce0]/50 overflow-hidden">
          {settings.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                  i < settings.length - 1 ? "border-b border-[#dadce0]/40" : ""
                }`}
              >
                <Icon className="w-5 h-5 text-[#5f6368]" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[#202124]">{s.label}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">{s.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5f6368]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={() => base44.auth.logout("/login")}
        className="flex items-center justify-center gap-2 h-12 rounded-full border border-[#dadce0] text-sm font-medium text-[#ea4335] hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}