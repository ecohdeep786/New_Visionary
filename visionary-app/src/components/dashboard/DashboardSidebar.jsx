import { NavLink } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {workspaceText} from '@/lib/workspaceStrings';
import { Ellipsis } from 'lucide-react';
import { getStagePresentation } from '@/services/stagePresentation';
import { presentNavigation } from '@/lib/navigationPresentation';

// Google-style navigation: pill states, a neutral hover, and blue reserved for the
// selected item. In the collapsed rail the active pill wraps only the icon, Gmail-style;
// expanded rows carry the pill behind the whole label.
export default function DashboardSidebar({ expanded, onNavigate, onExpand }) {
  const { user } = useAuth();
  const {ctx,data}=useWorkspace();
  const locale=data?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
  const policy=ctx?.role==='organization'?organizationAccess(ctx):null;
  const allowed=item=>!policy||organizationPathAllowed(policy,item.to);
  const tier = ctx ? getStagePresentation(ctx).tier : 'higher';
  const navigation = presentNavigation(user?.identity,tier,navigationFor(user?.identity,locale),secondaryNavigation(user?.identity,locale));
  const items = navigation.primary.filter(allowed);
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `workspace-nav-link group flex min-h-12 shrink-0 rounded-full transition-colors ${expanded ? `items-center gap-3 px-4 py-2.5${isActive ? " font-medium" : " hover:bg-[#eceef1]"}` : `flex-col items-center justify-center gap-1 px-1 py-2${isActive ? " font-medium" : ""}`}`}
      style={({ isActive }) => ({ color: isActive ? "#0b57d2" : "#121317", backgroundColor: expanded && isActive ? "#e8f0fd" : undefined })}>
      {({ isActive }) => <>
        <span className={`flex h-8 items-center justify-center rounded-full transition-colors ${expanded ? "w-auto" : "w-14"}${!expanded && !isActive ? " group-hover:bg-[#eceef1]" : ""}`}
          style={!expanded && isActive ? { backgroundColor: "#e8f0fd" } : undefined}>
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        </span>
        <span className={expanded ? "text-sm" : "text-xs"} style={{ color: isActive ? "#4285F4" : undefined }}>{item.label}</span>
      </>}
    </NavLink>;
  };
  return <aside id="dashboard-navigation" data-expanded={expanded} className={`${expanded ? "w-60 px-3" : "w-[88px] px-2"} workspace-sidebar flex h-full shrink-0 flex-col py-3`}>
    <nav lang={locale} aria-label={t('primaryNavigation')} className="workspace-navigation flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-3"><div className="workspace-nav-group">{items.map(renderItem)}</div>{expanded?<><p className="workspace-nav-section-label">{t('moreWorkspace')}</p><div className="workspace-nav-group workspace-nav-secondary">{navigation.secondary.filter(allowed).map(renderItem)}</div></>:<button className="workspace-nav-more" onClick={onExpand} aria-label={t('moreNavigation')}><Ellipsis aria-hidden="true" size={20}/><span>{t('more')}</span></button>}</nav>
  </aside>;
}
