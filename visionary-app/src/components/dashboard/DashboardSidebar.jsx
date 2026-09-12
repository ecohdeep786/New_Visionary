import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircleQuestion, PencilRuler, Boxes, Crown, GraduationCap, Calendar } from "lucide-react";
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
  { to: "/dashboard/plan", label: "Plan", icon: Calendar },
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
  const [hoveredItem, setHoveredItem] = useState(null);

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
      className={`${expanded ? "w-[280px] px-3" : "w-[80px] px-2"} flex flex-col bg-white border-r border-[#e8eaed] shrink-0 h-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden`}
    >
      {/* Fixed, non-scrolling nav — vertically centered so every item always fits the screen */}
      <nav className="flex flex-col gap-1.5 flex-1 justify-center overflow-hidden py-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
              className={({ isActive }) =>
                expanded
                  ? `group relative flex items-center gap-4 h-12 px-4 rounded-2xl transition-all duration-200 w-full overflow-hidden ${isActive ? "" : "hover:bg-[#f1f3f4] active:scale-[0.98]"}`
                  : `group relative flex flex-col items-center gap-1.5 py-2.5 transition-all duration-200 w-full ${isActive ? "" : "hover:bg-[#f1f3f4]/60 active:scale-95"}`
              }
              style={({ isActive }) => {
                if (expanded && isActive) {
                  return { 
                    backgroundColor: themeColor.light,
                    boxShadow: `inset 0 1px 2px ${themeColor.accent}15`
                  };
                }
                return undefined;
              }}
            >
              {({ isActive }) => {
                const isHovered = hoveredItem === item.to && !isActive;
                return expanded ? (
                  <>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                        style={{ backgroundColor: themeColor.accent }}
                      />
                    )}
                    <div className="relative flex items-center gap-4 w-full">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${isHovered ? 'scale-105' : ''}`}
                        style={{ 
                          backgroundColor: isActive ? themeColor.accent : 'transparent',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          strokeWidth={isActive ? 2.3 : 1.8} 
                          style={{ 
                            color: isActive ? '#fff' : (isHovered ? themeColor.accent : '#5f6368'),
                            transition: 'all 0.2s cubic-bezier(0.2,0,0,1)'
                          }} 
                        />
                      </div>
                      <span 
                        className={`text-sm transition-all duration-200 ${isActive ? "font-semibold" : "font-normal"}`} 
                        style={{ 
                          color: isActive ? themeColor.accent : (isHovered ? '#202124' : '#444746'),
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${isHovered ? 'shadow-md' : ''}`}
                      style={{ 
                        backgroundColor: isActive ? themeColor.accent : (isHovered ? themeColor.light : 'transparent'),
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHovered ? `0 4px 12px ${themeColor.accent}25` : undefined
                      }}
                    >
                      <Icon 
                        className="w-5 h-5" 
                        strokeWidth={isActive ? 2.3 : 1.8} 
                        style={{ 
                          color: isActive ? '#fff' : (isHovered ? themeColor.accent : '#5f6368'),
                          filter: isHovered && !isActive ? `drop-shadow(0 2px 4px ${themeColor.accent}30)` : 'none',
                          transition: 'all 0.2s cubic-bezier(0.2,0,0,1)'
                        }} 
                      />
                    </div>
                    <span 
                      className={`text-[10px] leading-tight text-center font-medium tracking-tight transition-colors duration-200 ${isActive ? "" : ""}`} 
                      style={{ 
                        color: isActive ? themeColor.accent : (isHovered ? '#202124' : '#5f6368')
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Subtle gradient overlay at bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </aside>
  );
}