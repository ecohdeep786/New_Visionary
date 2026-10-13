import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {workspaceText} from '@/lib/workspaceStrings';
import { Ellipsis } from 'lucide-react';
import { getStagePresentation } from '@/services/stagePresentation';
import { presentNavigation } from '@/lib/navigationPresentation';

// Primary tasks stay first; workspace tools and account preferences have separate
// groups. The same destinations remain reachable in the rail and phone sheet.
export default function DashboardSidebar({ expanded, onNavigate, onExpand, id = 'dashboard-navigation' }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const {ctx,data}=useWorkspace();
  const locale=data?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
  const policy=ctx?.role==='organization'?organizationAccess(ctx):null;
  const allowed=item=>!policy||organizationPathAllowed(policy,item.to);
  const tier = ctx ? getStagePresentation(ctx).tier : 'higher';
  const navigation = presentNavigation(user?.identity,tier,navigationFor(user?.identity,locale),secondaryNavigation(user?.identity,locale),pathname);
  const items = navigation.primary.filter(allowed);
  const accountKeys = ['notifications','personalization','privacy','subscription'];
  const secondary = navigation.secondary.filter(allowed);
  const tools = secondary.filter(item => !accountKeys.includes(item.key));
  const account = secondary.filter(item => accountKeys.includes(item.key));
  const renderItem = (item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} onClick={onNavigate}
      className={({ isActive }) => `workspace-nav-link group flex min-h-12 shrink-0 rounded-full transition-colors ${expanded ? `items-center gap-3 px-4 py-2.5${isActive ? " font-medium" : " hover:bg-[#eceef1]"}` : `flex-col items-center justify-center gap-1 px-1 py-2${isActive ? " font-medium" : ""}`}`}
      style={({ isActive }) => ({ color: isActive ? "var(--v-action)" : "var(--v-text)", backgroundColor: expanded && isActive ? "var(--v-soft)" : undefined })}>
      {({ isActive }) => <>
        <span className={`workspace-nav-icon flex h-8 items-center justify-center rounded-full transition-colors ${expanded ? "w-auto" : "w-14"}${!expanded && !isActive ? " group-hover:bg-[#eceef1]" : ""}`}
          style={!expanded && isActive ? { backgroundColor: "var(--v-soft)" } : undefined}>
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        </span>
        <span className={expanded ? "text-sm" : "text-xs"} style={{ color: isActive ? "var(--v-action)" : undefined }}>{item.label}</span>
      </>}
    </NavLink>;
  };
  return <aside id={id} data-expanded={expanded} className={`${expanded ? "w-60 px-3" : "w-[88px] px-2"} workspace-sidebar flex h-full shrink-0 flex-col py-3`}>
    <nav lang={locale} aria-label={t('primaryNavigation')} className="workspace-navigation flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-3">
      <div className="workspace-nav-group">{items.map(renderItem)}</div>
      {expanded ? <>
        {tools.length > 0 && <div className="workspace-nav-section" role="group" aria-label={t('workspaceTools')}><p className="workspace-nav-section-label" aria-hidden="true">{t('workspaceTools')}</p><div className="workspace-nav-group">{tools.map(renderItem)}</div></div>}
        {account.length > 0 && <div className="workspace-nav-section workspace-nav-account" role="group" aria-label={t('preferencesAndAccount')}><p className="workspace-nav-section-label" aria-hidden="true">{t('preferencesAndAccount')}</p><div className="workspace-nav-group">{account.map(renderItem)}</div></div>}
      </> : <button className="workspace-nav-more" onClick={onExpand} data-active={navigation.railMoreActive} aria-current={navigation.railMoreActive ? 'true' : undefined} aria-expanded={false} aria-controls={id} aria-label={t('moreNavigation')}><span className="workspace-nav-more-icon"><Ellipsis aria-hidden="true" size={20}/></span><span>{t('more')}</span></button>}
    </nav>
  </aside>;
}
