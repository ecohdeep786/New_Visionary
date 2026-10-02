import { NavLink } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {workspaceText} from '@/lib/workspaceStrings';

// Google-style navigation: pill states, a neutral hover, and blue reserved for the
// selected item. In the collapsed rail the active pill wraps only the icon, Gmail-style;
// expanded rows carry the pill behind the whole label.
export default function DashboardSidebar({ expanded, onNavigate }) {
  const { user } = useAuth();
  const {ctx,data}=useWorkspace();
  const locale=data?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
  const policy=ctx?.role==='organization'?organizationAccess(ctx):null;
  const allowed=item=>!policy||organizationPathAllowed(policy,item.to);
  const items = navigationFor(user?.identity,locale).filter(allowed);
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `workspace-nav-link group flex min-h-12 shrink-0 rounded-full transition-colors ${expanded ? `items-center gap-3 px-4 py-2.5${isActive ? " font-medium" : " hover:bg-[#eceef1]"}` : `flex-col items-center justify-center gap-1 px-1 py-2${isActive ? " font-medium" : ""}`}`}
      style={({ isActive }) => ({ color: isActive ? "#0b57d2" : "#121317", backgroundColor: expanded && isActive ? "#e8f0fd" : undefined })}>
      {({ isActive }) => <>
        <span className={`flex h-8 items-center justify-center rounded-full transition-colors ${expanded ? "w-auto" : "w-14"}${!expanded && !isActive ? " group-hover:bg-[#eceef1]" : ""}`}
          style={!expanded && isActive ? { backgroundColor: "#e8f0fd" } : undefined}>
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.3 : 1.8} />
        </span>
        <span className={expanded ? "text-sm" : "text-xs"} style={{ color: isActive ? "#4285F4" : undefined }}>{item.label}</span>
      </>}
    </NavLink>;
  };
  return <aside id="dashboard-navigation" className={`${expanded ? "w-64 px-3" : "w-[88px] px-2"} flex h-full shrink-0 flex-col bg-white py-3`}>
    <nav lang={locale} aria-label={t('primaryNavigation')} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-3">{items.map(renderItem)}{expanded&&<><span className="workspace-nav-divider" aria-hidden="true" /><p className="workspace-nav-section-label">{t('moreWorkspace')}</p>{secondaryNavigation(user?.identity,locale).filter(allowed).map(renderItem)}</>}</nav>
  </aside>;
}
