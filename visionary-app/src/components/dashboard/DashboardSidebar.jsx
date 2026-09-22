import { NavLink } from "react-router-dom";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";

export default function DashboardSidebar({ expanded, onNavigate }) {
  const theme = useThemeColor();
  const { user } = useAuth();
  const items = navigationFor(user?.identity);
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `flex shrink-0 rounded-2xl transition-colors ${expanded ? "items-center gap-3 px-4 py-3" : "flex-col items-center gap-1 px-1 py-2"} ${isActive ? "font-medium" : "hover:bg-[#dadce0]/50"}`}
      style={({ isActive }) => ({ color: isActive ? theme.accent : "#5f6368", backgroundColor: isActive ? theme.light : undefined })}>
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      <span className={expanded ? "text-sm" : "text-[11px]"}>{item.label}</span>
    </NavLink>;
  };
  return <aside id="dashboard-navigation" className={`${expanded ? "w-64 px-3" : "w-[80px] px-2"} flex h-full shrink-0 flex-col bg-[#ffffff] py-3`}>
    <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-3">{items.map(renderItem)}{expanded&&<><div className="my-3 border-t border-[#dadce0]"/>{secondaryNavigation(user?.identity).map(renderItem)}</>}</nav>
  </aside>;
}
