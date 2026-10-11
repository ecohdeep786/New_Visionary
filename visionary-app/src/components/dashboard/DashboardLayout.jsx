import {organizationCopy} from '@/lib/organizationCopy';
import {privacyCopy} from '@/lib/privacyCopy';
import {useWorkspace} from '@/hooks/useWorkspace';
import {workspaceText} from '@/lib/workspaceStrings';
import {useWorkspaceScroll} from '@/hooks/useWorkspaceScroll';
import { Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import AudioPresence from "./AudioPresence";
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";
import { canAccessDashboardPath, navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import { presentNavigation } from '@/lib/navigationPresentation';
import { saveLastPath,organizationAccess } from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import OrganizationAccessHome from '@/pages/dashboard/OrganizationAccessHome';
import OrganizationBilling from '@/pages/dashboard/OrganizationBilling';
import { getStagePresentation } from '@/services/stagePresentation';
import './workspace.css';
import './workspace-design.css';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Ellipsis } from "lucide-react";
import { shellCopy } from './shellCopy';

export default function DashboardLayout() {
  const { user, activeWorkspace, workspaceError, retryWorkspace } = useAuth();
  const {data:scopeData,error:scopeError,refresh:refreshScope}=useWorkspace();
  const lastInterface=useRef({personId:null,workspaceId:null,locale:'en'});
  if(scopeData){lastInterface.current={personId:user?.id,workspaceId:activeWorkspace?.id,locale:scopeData.preferences.interfaceLocale||'en'};}
  const locale=scopeData?.preferences.interfaceLocale||(lastInterface.current.personId===user?.id&&lastInterface.current.workspaceId===activeWorkspace?.id?lastInterface.current.locale:'en');const t=key=>workspaceText(locale,key);
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.matchMedia('(min-width: 1200px)').matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [connectionChanged, setConnectionChanged] = useState(false);
  const mobileTrigger = useRef(null);
  const navigationSelected = useRef(false);
  const shell = shellCopy(locale);
  const previousRoute=useRef('');
  useEffect(() => {
    const update = () => { setOffline(!navigator.onLine); setConnectionChanged(true); };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const adapt = event => { if (event.matches) setMobileOpen(false); };
    desktop.addEventListener('change', adapt);
    return () => desktop.removeEventListener('change', adapt);
  }, []);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1200px)');
    const adapt = event => setSidebarExpanded(event.matches);
    wide.addEventListener('change', adapt);
    return () => wide.removeEventListener('change', adapt);
  }, []);
  useEffect(() => {
    const refresh = () => { queryClient.invalidateQueries(); };
    window.addEventListener("visionary:workspace-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("visionary:workspace-change", refresh); window.removeEventListener("storage", refresh); };
  }, [queryClient]);
  useWorkspaceScroll(user?.id, activeWorkspace?.id, location.pathname, location.search, Boolean(activeWorkspace && !workspaceError && !scopeError));
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
  const presented = presentNavigation(ctx.role,stageTier,navigation,secondaryNavigation(ctx.role,locale).filter(item=>!policy||organizationPathAllowed(policy,item.to)),location.pathname);
  return <ThemeColorProvider>
    <div lang={locale} data-role={ctx.role} data-area={location.pathname.split('/')[2] || 'home'} className={`visionary-workspace workspace-shell stage-${stageTier} flex h-dvh flex-col overflow-hidden text-[#121317]`}>
      <a className="workspace-skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>{shell.skip}</a>
      <DashboardTopbar userName={userName} sidebarExpanded={sidebarExpanded || mobileOpen} onToggleSidebar={() => window.matchMedia("(min-width: 768px)").matches ? setSidebarExpanded(v => !v) : setMobileOpen(v => !v)} />
      <div role="status" aria-live="polite" aria-atomic="true" className={offline ? 'workspace-connectivity' : 'sr-only'}>{offline ? shell.offline : connectionChanged ? shell.online : ''}</div>
      <div className={`workspace-presence-anchor${sidebarExpanded ? " is-expanded" : ""}`}><AudioPresence /></div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full md:block"><DashboardSidebar expanded={sidebarExpanded} onExpand={() => setSidebarExpanded(true)} /></div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent id="mobile-workspace-navigation" lang={locale} side="left" onCloseAutoFocus={event => {
          event.preventDefault();
          const target = navigationSelected.current ? document.getElementById('main') : window.matchMedia('(min-width: 768px)').matches ? document.querySelector('[aria-controls="dashboard-navigation"]') : mobileTrigger.current;
          target?.focus({ preventScroll: true });
          navigationSelected.current = false;
        }} className="workspace-navigation-sheet w-[min(20rem,calc(100vw-2rem))] bg-[#ffffff] p-0 pt-14 [&>button]:min-h-12 [&>button]:min-w-12">
          <SheetTitle lang={locale} className="sr-only">{t("workspaceNavigation")}</SheetTitle><SheetDescription lang={locale} className="sr-only">{t("navigationDescription")}</SheetDescription>
          <DashboardSidebar id="mobile-dashboard-navigation" expanded onNavigate={() => { navigationSelected.current = true; setMobileOpen(false); }} />
        </SheetContent></Sheet>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
          <div className="workspace-surface min-h-full overflow-hidden">{!permitted?<div className="v-page" lang={locale}><h1 className="v-title">{organizationCopy(locale,'Permission required')}</h1><p className="v-notice" role="alert">{organizationCopy(locale,'Your {role} permission does not include this section. Ask the organization owner to review access.',{role:organizationCopy(locale,policy.label)})}</p><NavLink to="/dashboard/home" className="v-button">{organizationCopy(locale,'Return to workspace')}</NavLink></div>:policy&&activeWorkspace.organizationId&&location.pathname==='/dashboard/home'?<OrganizationAccessHome key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:policy&&location.pathname==='/dashboard/subscription'?<OrganizationBilling key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:<Suspense key={ctx.personId+":"+activeWorkspace.id+":"+location.pathname} fallback={<div lang={locale} className="v-page" role="status" aria-busy="true">{t("openingWorkspace")}</div>}><Outlet /></Suspense>}</div>
        </main>
      </div>
      <nav lang={locale} aria-label={t("mobileNavigation")} className="workspace-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[#dadce0] bg-white md:hidden">{presented.mobile.map(item=>{const Icon=item.icon;return <NavLink key={item.key} to={item.to} className={({isActive})=>`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs ${isActive?'bg-[#e8f0fd] font-medium text-[#1967d2]':'text-[#5f6368]'}`}><Icon aria-hidden="true" size={19}/>{item.label}</NavLink>;})}<button ref={mobileTrigger} aria-label={t("moreNavigation")} aria-haspopup="dialog" aria-controls="mobile-workspace-navigation" aria-expanded={mobileOpen} data-active={presented.mobileMoreActive} className="workspace-bottom-more flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs text-[#5f6368]" onClick={()=>setMobileOpen(true)}><Ellipsis aria-hidden="true" size={19}/>{t("more")}</button></nav>
    </div>
  </ThemeColorProvider>;
}
