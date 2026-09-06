import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircleQuestion, PencilRuler, Boxes, Crown, GraduationCap } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const studentNav = [
  { to: "/dashboard/home", label: "Home", icon: Home },
  { to: "/dashboard/classes", label: "Classes", icon: GraduationCap },
  { to: "/dashboard/learn", label: "Learn", icon: BookOpen },
  { to: "/dashboard/ask", label: "Ask", icon: MessageCircleQuestion },
  { to: "/dashboard/practice", label: "Practice", icon: PencilRuler },
  { to: "/dashboard/build", label: "Build", icon: Boxes },
  { to: "/dashboard/subscription", label: "Plans", icon: Crown },
];

const teacherNav = [
  { to: "/dashboard/home", label: "Classes", icon: Home },
  { to: "/dashboard/ask", label: "Ask", icon: MessageCircleQuestion },
  { to: "/dashboard/subscription", label: "Plans", icon: Crown },
];

const sharedNav = [
  { to: "/dashboard/home", label: "Home", icon: Home },
  { to: "/dashboard/ask", label: "Ask", icon: MessageCircleQuestion },
  { to: "/dashboard/subscription", label: "Plans", icon: Crown },
];

export default function DashboardSidebar({ expanded }) {
  const themeColor = useThemeColor();
  const { user } = useAuth();
  const identity = user?.identity || "student";
  const [hasClasses, setHasClasses] = useState(false);

  useEffect(() => {
    if (identity !== "student" || !user?.email) return;
    let active = true;
    (async () => {
      try {
        const enr = await base44.entities.Enrollment.filter({ student_email: user.email });
        if (active && (enr || []).length > 0) setHasClasses(true);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [identity, user?.email]);

  let navItems = identity === "student" ? studentNav : identity === "teacher" ? teacherNav : sharedNav;
  if (identity === "student" && !hasClasses) {
    navItems = navItems.filter((n) => n.to !== "/dashboard/classes");
  }

  return (
    <aside
      className={`${expanded ? "w-[280px] px-3" : "w-[80px] px-2"} flex flex-col bg-[#f8f9fa] border-r border-[#dadce0]/60 shrink-0 h-full transition-all duration-200 overflow-hidden`}
    >
      {/* Fixed, non-scrolling nav — vertically centered so every item always fits the screen */}
      <nav className="flex flex-col gap-1 flex-1 justify-center overflow-hidden py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                expanded
                  ? `flex items-center gap-4 h-12 px-4 rounded-full transition-all duration-200 w-full ${isActive ? "" : "hover:bg-gray-100 active:scale-[0.98]"}`
                  : `flex flex-col items-center gap-1.5 py-2 transition-all duration-200 w-full ${isActive ? "" : "hover:bg-gray-100/60 active:scale-95"}`
              }
              style={({ isActive }) => (expanded && isActive ? { backgroundColor: themeColor.light } : undefined)}
            >
              {({ isActive }) =>
                expanded ? (
                  <>
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} style={{ color: isActive ? themeColor.accent : "#5f6368" }} />
                    <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`} style={{ color: isActive ? themeColor.accent : "#444746" }}>
                      {item.label}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-9 rounded-full flex items-center justify-center transition-all duration-200" style={{ backgroundColor: isActive ? themeColor.light : "transparent" }}>
                      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.3 : 1.8} style={{ color: isActive ? themeColor.accent : "#5f6368" }} />
                    </div>
                    <span className={`text-xs leading-tight text-center ${isActive ? "font-medium" : "font-normal"}`} style={{ color: isActive ? themeColor.accent : "#444746" }}>
                      {item.label}
                    </span>
                  </>
                )
              }
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}