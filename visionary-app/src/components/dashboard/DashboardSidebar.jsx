import { NavLink } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";

// Google-style navigation: pill states, a neutral hover, and blue reserved for the
// selected item. In the collapsed rail the active pill wraps only the icon, Gmail-style;
// expanded rows carry the pill behind the whole label.
export default function DashboardSidebar({ expanded, onNavigate }) {
  const { user } = useAuth();
  const items = navigationFor(user?.identity);
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `group flex min-h-12 shrink-0 rounded-full transition-colors ${expanded ? `items-center gap-3 px-4 py-2.5${isActive ? " font-medium" : " hover:bg-[#eceef1]"}` : `flex-col items-center justify-center gap-1 px-1 py-2${isActive ? " font-medium" : ""}`}`}
      style={({ isActive }) => ({ color: isActive ? "#0b57d2" : "#121317", backgroundColor: expanded && isActive ? "#e8f0fd" : undefined })}>
      {({ isActive }) => <>
        <span className={`flex h-8 items-center justify-center rounded-full transition-colors ${expanded ? "w-auto" : "w-14"}${!expanded && !isActive ? " group-hover:bg-[#eceef1]" : ""}`}
          style={!expanded && isActive ? { backgroundColor: "#e8f0fd" } : undefined}>
          {/* Selected = solid filled glyph, exactly like the Google Skills reference:
              uniform dark-blue fill on the light-blue pill; label in blue. */}
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8}
            fill={isActive ? "currentColor" : "none"} />
        </span>
        <span className={expanded ? "text-sm" : "text-xs"} style={{ color: isActive ? "#4285F4" : undefined }}>{item.label}</span>
      </>}
    </NavLink>;
  };
  return <aside id="dashboard-navigation" className={`${expanded ? "w-64 px-3" : "w-[88px] px-2"} flex h-full shrink-0 flex-col bg-white py-3`}>
    <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-3">{items.map(renderItem)}{expanded&&<>{secondaryNavigation(user?.identity).map(renderItem)}</>}</nav>
  </aside>;
}
