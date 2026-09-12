import { NavLink } from "react-router-dom";
import { Settings, UserCircle } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { navigationFor } from "@/lib/dashboardNavigation";

export default function DashboardSidebar({ expanded, onNavigate }) {
  const theme = useThemeColor();
  const { user } = useAuth();
  const { data: enrollments = [] } = useQuery({
    queryKey: ["workspace", "enrollments", user?.email],
    queryFn: () => appClient.entities.ClassEnrollment.filter({ student_email: user.email }),
    enabled: user?.identity === "student",
  });
  const connected = enrollments.some(e => e.status === "active");
  const items = navigationFor(user?.identity).filter(item => item.key !== "classes" || connected);
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `flex shrink-0 rounded-2xl transition-colors ${expanded ? "items-center gap-3 px-4 py-3" : "flex-col items-center gap-1 px-1 py-2"} ${isActive ? "font-medium" : "hover:bg-slate-200/50"}`}
      style={({ isActive }) => ({ color: isActive ? theme.accent : "#444746", backgroundColor: isActive ? theme.light : undefined })}>
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      <span className={expanded ? "text-sm" : "text-[11px]"}>{item.label}</span>
    </NavLink>;
  };
  return <aside id="dashboard-navigation" className={`${expanded ? "w-64 px-3" : "w-[80px] px-2"} flex h-full shrink-0 flex-col bg-[#f8fafd] py-3`}>
    <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">{items.map(renderItem)}</nav>
    <nav aria-label="Account navigation" className="mt-3 flex shrink-0 flex-col gap-1 border-t border-[#dadce0] pt-3">
      {[{ to: "/dashboard/profile", label: "Profile", icon: UserCircle }, { to: "/dashboard/settings", label: "Settings", icon: Settings }].map(renderItem)}
    </nav>
  </aside>;
}

