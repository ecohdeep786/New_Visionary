import {organizationCopy} from '@/lib/organizationCopy';
import {privacyCopy} from '@/lib/privacyCopy';
import {useWorkspace} from '@/hooks/useWorkspace';
import {workspaceText} from '@/lib/workspaceStrings';
import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import AudioPresence from "./AudioPresence";
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";
import { canAccessDashboardPath, navigationFor } from "@/lib/dashboardNavigation";
import { saveLastPath,organizationAccess } from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import OrganizationAccessHome from '@/pages/dashboard/OrganizationAccessHome';
import OrganizationBilling from '@/pages/dashboard/OrganizationBilling';
import { getStagePresentation } from '@/services/stagePresentation';
import './workspace.css';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Ellipsis } from "lucide-react";

export default function DashboardLayout() {
  const { user, activeWorkspace, workspaceError, retryWorkspace } = useAuth();
  const {data:scopeData,error:scopeError,refresh:refreshScope}=useWorkspace();
  const lastInterface=useRef({personId:null,workspaceId:null,locale:'en'});
  if(scopeData){lastInterface.current={personId:user?.id,workspaceId:activeWorkspace?.id,locale:scopeData.preferences.interfaceLocale||'en'};}
  const locale=scopeData?.preferences.interfaceLocale||(lastInterface.current.personId===user?.id&&lastInterface.current.workspaceId===activeWorkspace?.id?lastInterface.current.locale:'en');const t=key=>workspaceText(locale,key);
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const previousRoute=useRef('');
  useEffect(() => {
    const refresh = () => { queryClient.invalidateQueries(); };
    window.addEventListener("visionary:workspace-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("visionary:workspace-change", refresh); window.removeEventListener("storage", refresh); };
  }, [queryClient]);
  useEffect(() => { document.getElementById("main")?.scrollTo(0, 0); }, [location.pathname]);
  useEffect(()=>{
    if(!activeWorkspace)return;
    const route=activeWorkspace.id+':'+location.pathname;
    const changed=previousRoute.current&&previousRoute.current!==route;previousRoute.current=route;
    if(!changed)return;
    const frame=requestAnimationFrame(()=>{if(!document.querySelector('[role="dialog"][data-state="open"]'))document.getElementById('main')?.focus({preventScroll:true});});
    return()=>cancelAnimationFrame(frame);
  },[location.pathname,activeWorkspace?.id]);
  useEffect(() => { if(activeWorkspace&&user)saveLastPath({personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:'en'},location.pathname); },[location.pathname,activeWorkspace?.id]);
  const recoveryCopy=privacyCopy(locale);
  function recover(){retryWorkspace();refreshScope();}
  function unavailable(message){return <main className="p-8" lang={locale}><h1 className="v-title">{recoveryCopy('Workspace unavailable')}</h1><p className="v-notice v-error mt-4" role="alert" lang="en">{message}</p><p className="v-muted mt-3">{recoveryCopy('Your saved records remain on this device. Restore readable records, then retry.')}</p><button className="v-button mt-4" onClick={recover}>{recoveryCopy('Retry workspace')}</button></main>;}
  if(workspaceError||scopeError)return unavailable(workspaceError||scopeError);
  if(!activeWorkspace)return <main className="p-8" role="status">Preparing your workspace…</main>;
  if (!canAccessDashboardPath(user?.identity, location.pathname)) return <Navigate to="/dashboard/home" replace />;
  const ctx={personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:'en'};
  let policy;
  try{if(ctx.role==='organization')policy=organizationAccess(ctx);}catch(error){return unavailable(error.message);}
  const permitted=!policy||organizationPathAllowed(policy,location.pathname);
  const navigation=navigationFor(user.identity,locale).filter(item=>!policy||organizationPathAllowed(policy,item.to));
  let stageTier;try{stageTier=getStagePresentation({personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:"en"}).tier;}catch(error){return unavailable(error.message);}
  return <ThemeColorProvider>
    <div className={`visionary-workspace workspace-shell stage-${stageTier} flex h-dvh flex-col overflow-hidden text-[#121317]`}>
      <DashboardTopbar userName={userName} sidebarExpanded={sidebarExpanded || mobileOpen} onToggleSidebar={() => window.matchMedia("(min-width: 768px)").matches ? setSidebarExpanded(v => !v) : setMobileOpen(v => !v)} />
      <div className={`workspace-presence-anchor${sidebarExpanded ? " is-expanded" : ""}`}><AudioPresence /></div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full md:block"><DashboardSidebar expanded={sidebarExpanded} /></div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-72 bg-[#ffffff] p-0 pt-10">
          <SheetTitle lang={locale} className="sr-only">{t("workspaceNavigation")}</SheetTitle><SheetDescription lang={locale} className="sr-only">{t("navigationDescription")}</SheetDescription>
          <DashboardSidebar expanded onNavigate={() => setMobileOpen(false)} />
        </SheetContent></Sheet>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
          <div className="workspace-surface min-h-full overflow-hidden">{!permitted?<div className="v-page" lang={locale}><h1 className="v-title">{organizationCopy(locale,'Permission required')}</h1><p className="v-notice" role="alert">{organizationCopy(locale,'Your {role} permission does not include this section. Ask the organization owner to review access.',{role:organizationCopy(locale,policy.label)})}</p><NavLink to="/dashboard/home" className="v-button">{organizationCopy(locale,'Return to workspace')}</NavLink></div>:policy&&activeWorkspace.organizationId&&location.pathname==='/dashboard/home'?<OrganizationAccessHome key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:policy&&location.pathname==='/dashboard/subscription'?<OrganizationBilling key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:<Outlet key={activeWorkspace.id} />}</div>
        </main>
      </div>
      <nav lang={locale} aria-label={t("mobileNavigation")} className="workspace-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[#dadce0] bg-white md:hidden">{navigation.slice(0,4).map(item=>{const Icon=item.icon;return <NavLink key={item.key} to={item.to} className={({isActive})=>`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs ${isActive?'bg-[#e8f0fd] font-medium text-[#1967d2]':'text-[#5f6368]'}`}><Icon aria-hidden="true" size={19}/>{item.label}</NavLink>;})}<button aria-label={t("moreNavigation")} aria-expanded={mobileOpen} className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs text-[#5f6368]" onClick={()=>setMobileOpen(true)}><Ellipsis aria-hidden="true" size={19}/>{t("more")}</button></nav>
    </div>
  </ThemeColorProvider>;
}
