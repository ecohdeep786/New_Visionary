import { useState, useRef, useEffect } from "react";
import { Search, Menu, Flame, HelpCircle, Globe, LayoutDashboard, TrendingUp, Settings, LogOut, ChevronRight, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import VisionaryLogo from "@/components/VisionaryLogo";

export default function DashboardTopbar({ userName, onToggleSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const studentData = useStudentData();
  const streak = studentData.dailyStats?.streak || 0;
  const masteredCount = (studentData.topics || []).filter((t) => t.status === "mastered").length;
  const used = masteredCount;
  const total = 100;
  const storagePct = Math.min(100, Math.round(used / total * 100));
  const storageFull = storagePct >= 85;
  const joinDate = user?.createdAt || user?.created_date;
  const joinYear = joinDate ? new Date(joinDate).getFullYear() : null;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = userName?.charAt(0)?.toUpperCase() || "U";

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const destinations = [
      { terms: ["learn", "course", "subject", "progress"], to: "/dashboard/learn" },
      { terms: ["ask", "question", "help", "ai"], to: "/dashboard/ask" },
      { terms: ["practice", "quiz", "test"], to: "/dashboard/practice" },
      { terms: ["build", "project"], to: "/dashboard/build" },
      { terms: ["class", "classroom"], to: "/dashboard/classes" },
      { terms: ["setting", "profile", "account"], to: "/dashboard/settings" },
    ];
    const match = destinations.find((item) => item.terms.some((term) => query.includes(term)));
    navigate(match?.to || "/dashboard/ask", { state: { initialQuestion: searchQuery.trim() } });
    setSearchQuery("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center gap-2 h-16 px-4 lg:px-8 bg-white border-b border-[#dadce0]/60 shrink-0 z-30">
      {/* Hamburger toggle */}
      <button
        onClick={onToggleSidebar}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200 shrink-0"
        aria-label="Toggle navigation">
        
        <Menu className="w-5 h-5 text-[#5f6368]" />
      </button>

      {/* Logo */}
      <Link to="/dashboard/home" className="flex items-center shrink-0">
        <VisionaryLogo />
      </Link>

      {/* Search — the centered visual anchor, Google Meet style */}
      <form onSubmit={handleSearch} className="flex-1 flex justify-center px-2 sm:px-4">
        <div className="flex items-center gap-2 w-full max-w-[560px] h-10 px-5 bg-[#f1f3f4] rounded-full border border-transparent focus-within:bg-white focus-within:border-[#1a73e8] focus-within:shadow-sm transition-all duration-200">
          <Search className="w-[18px] h-[18px] text-[#5f6368] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search learning, tools, and settings"
            aria-label="Search learning, tools, and settings"
            className="flex-1 min-w-0 bg-transparent text-sm text-[#202124] placeholder:text-[#5f6368] outline-none" />
        </div>
      </form>

      {/* Right utilities */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5">
          <Flame className="w-[18px] h-[18px] text-orange-500" />
          <span className="text-sm font-medium text-[#3c4043] [font-family:'Google_Sans',_sans-serif]">{streak}</span>
        </div>
        {/* Help */}
        <Link to="/contact" aria-label="Get help" className="w-9 h-9 flex items-center justify-center text-[#5f6368] hover:bg-gray-100 rounded-full transition-colors duration-200 [font-family:'Google_Sans',_sans-serif]">
          <HelpCircle className="w-[18px] h-[18px]" />
        </Link>
        {/* Globe */}
        <Link to="/dashboard/settings" aria-label="Language and display settings" className="w-9 h-9 hidden sm:flex items-center justify-center text-[#5f6368] hover:bg-gray-100 rounded-full transition-colors duration-200 [font-family:'Google_Sans',_sans-serif]">
          <Globe className="w-[18px] h-[18px]" />
        </Link>
        {/* Profile with dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-xs font-medium text-white shrink-0 hover:ring-2 hover:ring-[#1a73e8]/20 transition-all [font-family:'Google_Sans',_sans-serif]">
            
            {initial}
          </button>
          {menuOpen &&
          <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-lg border border-[#dadce0]/40 py-2 z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#dadce0]/40">
                <p className="text-sm font-medium text-[#202124]">{userName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {joinYear && <span className="text-xs text-[#5f6368]">Member since {joinYear}</span>}
                  <span className="px-2 py-0.5 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-xs font-medium capitalize">{user?.identity || user?.role || "Member"}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[#202124]">Visionary Understanding</span>
                    <span className="text-xs text-[#5f6368]">{used}/{total} GB</span>
                  </div>
                  <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${storagePct}%`, backgroundColor: storageFull ? "#ea4335" : "#1a73e8" }} />
                  </div>
                  <Link to="/dashboard/subscription" className="flex items-center gap-1 text-xs font-medium mt-2 hover:underline" style={{ color: storageFull ? "#ea4335" : "#1a73e8" }}>
                    {storageFull ? "Storage almost full — upgrade" : "Manage plan"} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              {/* Menu items */}
              <Link onClick={() => setMenuOpen(false)} to="/dashboard/home" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <LayoutDashboard className="w-[18px] h-[18px] text-[#5f6368]" />
                <span className="text-sm font-normal text-[#202124]">Dashboard</span>
              </Link>
              <Link onClick={() => setMenuOpen(false)} to="/dashboard/learn" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <TrendingUp className="w-[18px] h-[18px] text-[#5f6368]" />
                <span className="text-sm font-normal text-[#202124]">Progress</span>
              </Link>
              <Link onClick={() => setMenuOpen(false)} to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <UserCircle className="w-[18px] h-[18px] text-[#5f6368]" />
                <span className="text-sm font-normal text-[#202124]">Profile</span>
              </Link>
              <Link onClick={() => setMenuOpen(false)} to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <Settings className="w-[18px] h-[18px] text-[#5f6368]" />
                <span className="text-sm font-normal text-[#202124]">Settings</span>
              </Link>
              <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors border-t border-[#dadce0]/40 mt-1 group">
              
                <LogOut className="w-[18px] h-[18px] text-[#5f6368] group-hover:text-[#ea4335] transition-colors" />
                <span className="text-sm font-medium text-[#202124] group-hover:text-[#ea4335] transition-colors">Sign out</span>
              </button>
              {/* Footer */}
              <div className="flex items-center gap-3 px-4 py-2 border-t border-[#dadce0]/40">
                <Link to="/privacy" className="text-xs text-[#5f6368] hover:text-[#1a73e8]">Privacy</Link>
                <Link to="/terms" className="text-xs text-[#5f6368] hover:text-[#1a73e8]">Terms</Link>
              </div>
            </div>
          }
        </div>
      </div>
    </header>);

}
