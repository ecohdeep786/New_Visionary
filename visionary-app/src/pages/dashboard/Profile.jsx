import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, BookOpen, Target, Clock, Calendar, Crown, LogOut, ChevronRight, Bell, Globe, Shield, Palette, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const studentData = useStudentData();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("idle");

  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const initial = userName?.charAt(0)?.toUpperCase() || "U";
  const accountCreatedAt = user?.createdAt || user?.created_date;
  const joinDate = accountCreatedAt
    ? new Date(accountCreatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  useEffect(() => {
    setFullName(user?.full_name || user?.email?.split("@")[0] || "");
  }, [user?.full_name, user?.email]);

  const saveProfile = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) return;
    setStatus("saving");
    try {
      await updateUser({ full_name: trimmedName });
      setEditing(false);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  const cancelEditing = () => {
    setFullName(user?.full_name || user?.email?.split("@")[0] || "");
    setEditing(false);
    setStatus("idle");
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
      <div className="relative flex flex-col items-center gap-4 py-8">
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="relative self-end sm:absolute sm:right-0 sm:top-8 inline-flex h-10 items-center gap-2 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fafd]"
        >
          <Pencil className="h-4 w-4" /> Edit profile
        </button>
        <div className="w-24 h-24 rounded-full bg-[#1a73e8] flex items-center justify-center text-4xl font-medium text-white">
          {initial}
        </div>
        <div className="text-center">
          {editing ? (
            <div className="flex flex-col items-center gap-3">
              <label className="sr-only" htmlFor="profile-name">Display name</label>
              <input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 w-full max-w-xs rounded-lg border border-[#747775] bg-white px-3 text-center text-lg text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" autoFocus />
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={saveProfile} disabled={!fullName.trim() || status === "saving"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 text-sm font-medium text-white hover:bg-[#1557b0] disabled:opacity-60"><Check className="h-4 w-4" />{status === "saving" ? "Saving" : "Save"}</button>
                <button type="button" onClick={cancelEditing} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#3c4043] hover:bg-[#f8fafd]"><X className="h-4 w-4" />Cancel</button>
              </div>
            </div>
          ) : (
            <h1 className="text-[28px] font-normal text-[#202124]">{userName}</h1>
          )}
          <p className="text-sm text-[#5f6368] mt-1">{user?.email}</p>
          <div className="flex items-center gap-2 justify-center mt-2">
            {joinDate && (
              <span className="text-xs text-[#5f6368] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {joinDate}
              </span>
            )}
            <span className="px-2 py-0.5 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-xs font-medium capitalize">
              {user?.identity || user?.role || "Member"}
            </span>
          </div>
          {status === "saved" && <p className="mt-2 text-xs text-[#137333]" role="status">Profile saved.</p>}
          {status === "error" && <p className="mt-2 text-xs text-[#b3261e]" role="alert">We couldn’t save your profile. Try again.</p>}
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
              <Link
                key={i}
                to="/dashboard/settings"
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
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 h-12 rounded-full border border-[#dadce0] text-sm font-medium text-[#ea4335] hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}
