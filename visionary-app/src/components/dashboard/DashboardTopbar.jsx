import { useState, useRef, useEffect } from "react";
import { Search, Menu, Flame, HelpCircle, Globe, LayoutDashboard, TrendingUp, Settings, LogOut, ChevronRight, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import VisionaryLogo from "@/components/VisionaryLogo";

export default function DashboardTopbar({ userName, onToggleSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const studentData = useStudentData();
  const streak = studentData.dailyStats?.streak || 0;
  const masteredCount = (studentData.topics || []).filter((t) => t.status === "mastered").length;
  const used = masteredCount;
  const total = 100;
  const storagePct = Math.min(100, Math.round(used / total * 100));
  const storageFull = storagePct >= 85;
  const joinYear = user?.created_date ? new Date(user.created_date).getFullYear() : null;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = userName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex items-center gap-3 h-16 px-4 lg:px-6 bg-white border-b border-[#e8eaed] shrink-0 z-30">
      {/* Hamburger toggle */}
      <button
        onClick={onToggleSidebar}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f1f3f4] active:scale-95 transition-all duration-200 shrink-0"
        aria-label="Toggle navigation">
        
        <Menu className="w-5 h-5 text-[#5f6368]" />
      </button>

      {/* Logo */}
      <Link to="/dashboard/home" className="flex items-center shrink-0">
        <VisionaryLogo />
      </Link>

      {/* Search — the centered visual anchor, Google Meet style */}
      <div className="flex-1 flex justify-center px-4">
        <div className="flex items-center gap-2.5 w-full max-w-[640px] h-11 px-4 bg-[#f8f9fa] rounded-2xl border border-transparent focus-within:bg-white focus-within:border-[#dadce0] focus-within:shadow-lg focus-within:shadow-gray-200/50 transition-all duration-200">
          <Search className="w-[18px] h-[18px] text-[#5f6368] shrink-0" />
          <input
            type="text"
            placeholder="What do you want to learn today?"
            className="flex-1 bg-transparent text-sm text-[#202124] placeholder:text-[#5f6368] outline-none font-normal" />
          
        </div>
      </div>

      {/* Right utilities */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#f1f3f4] transition-colors duration-200">
          <Flame className="w-[18px] h-[18px] text-orange-500" />
          <span className="text-sm font-semibold text-[#3c4043] [font-family:'Google_Sans',_sans-serif]">{streak}</span>
        </div>
        {/* Help */}
        <button className="w-9 h-9 flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] rounded-xl transition-colors duration-200 [font-family:'Google_Sans',_sans-serif]">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>
        {/* Globe */}
        <button className="w-9 h-9 hidden sm:flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] rounded-xl transition-colors duration-200 [font-family:'Google_Sans',_sans-serif]">
          <Globe className="w-[18px] h-[18px]" />
        </button>
        {/* Profile with dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a73e8] to-[#1557b0] flex items-center justify-center text-sm font-semibold text-white shrink-0 hover:ring-2 hover:ring-[#1a73e8]/20 hover:shadow-lg transition-all [font-family:'Google_Sans',_sans-serif]">
            
            {initial}
          </button>
          {menuOpen &&
          <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-[#e8eaed] py-2 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-[#e8eaed] bg-gradient-to-br from-[#f8f9fa] to-white">
                <p className="text-sm font-semibold text-[#202124]">{userName}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {joinYear && <span className="text-xs text-[#5f6368]">Member since {joinYear}</span>}
                  <span className="px-2.5 py-0.5 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-xs font-semibold capitalize">{user?.role || "Member"}</span>
                </div>
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#202124]">Visionary Storage</span>
                    <span className="text-xs text-[#5f6368]">{used}/{total} GB</span>
                  </div>
                  <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${storagePct}%`, backgroundColor: storageFull ? "#ea4335" : "#1a73e8" }} />
                  </div>
                  <Link to="/dashboard/subscription" className="flex items-center gap-1.5 text-xs font-semibold mt-2.5 hover:underline" style={{ color: storageFull ? "#ea4335" : "#1a73e8" }}>
                    {storageFull ? "Storage almost full — upgrade" : "Manage plan"} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              {/* Menu items */}
              <Link to="/dashboard/home" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors group">
                <LayoutDashboard className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                <span className="text-sm font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors">Dashboard</span>
              </Link>
              <Link to="/dashboard/learn" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors group">
                <TrendingUp className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                <span className="text-sm font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors">Progress</span>
              </Link>
              <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors group">
                <UserCircle className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                <span className="text-sm font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors">Profile</span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors group">
                <Settings className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                <span className="text-sm font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors">Settings</span>
              </button>
              <button
              onClick={() => base44.auth.logout("/login")}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors border-t border-[#e8eaed] mt-1 group">
              
                <LogOut className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#ea4335] transition-colors" />
                <span className="text-sm font-semibold text-[#202124] group-hover:text-[#ea4335] transition-colors">Sign out</span>
              </button>
              {/* Footer */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[#e8eaed] mt-0.5">
                <span className="text-xs text-[#5f6368] hover:text-[#1a73e8] cursor-pointer font-medium">Privacy</span>
                <span className="text-xs text-[#5f6368] hover:text-[#1a73e8] cursor-pointer font-medium">Terms</span>
              </div>
            </div>
          }
        </div>
      </div>
    </header>);

}