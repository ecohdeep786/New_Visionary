import {organizationCopy} from '@/lib/organizationCopy';
import {privacyCopy} from '@/lib/privacyCopy';
import {useWorkspace} from '@/hooks/useWorkspace';
import {workspaceText} from '@/lib/workspaceStrings';
import {useWorkspaceScroll} from '@/hooks/useWorkspaceScroll';
import { Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, NavLink } from "react-router-dom";
import QueryProvider from './QueryProvider';
import WorkspaceOpening from './WorkspaceOpening';
import ConnectedAccountLayout from './ConnectedAccountLayout';
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";
import { canAccessDashboardPath, dashboardAreaOwner, isOrganizationArea, navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import { presentNavigation } from '@/lib/navigationPresentation';
import { saveLastPath,organizationAccess } from '@/services/workspaceService';
import {organizationPathAllowed,organizationSectionKind} from '@/services/organizationPolicy';
import OrganizationAccessHome from '@/pages/dashboard/OrganizationAccessHome';
import OrganizationBilling from '@/pages/dashboard/OrganizationBilling';
import RoleAreaUnavailable from '@/pages/dashboard/RoleAreaUnavailable';
import { getStagePresentation } from '@/services/stagePresentation';
import './workspace.css';
import './workspace-design.css';
import '@/styles/workspace-premium.css';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CloudOff, Ellipsis } from "lucide-react";
import { shellCopy } from './shellCopy';
import FeedbackPrompt from './FeedbackPrompt';
import { feedbackSurface } from '@/services/feedbackClient';

export default function DashboardLayout() {
  return import.meta.env.DEV ? <PreviewDashboardLayout /> : <ConnectedAccountLayout />;
}

function PreviewDashboardLayout() {
  const { user, activeWorkspace, workspaceError, retryWorkspace } = useAuth();
  const {data:scopeData,error:scopeError,refresh:refreshScope}=useWorkspace();
  const lastInterface=useRef({personId:null,workspaceId:null,locale:'en'});
  if(scopeData){lastInterface.current={personId:user?.id,workspaceId:activeWorkspace?.id,locale:scopeData.preferences.interfaceLocale||'en'};}
  const locale=scopeData?.preferences.interfaceLocale||(lastInterface.current.personId===user?.id&&lastInterface.current.workspaceId===activeWorkspace?.id?lastInterface.current.locale:'en');const t=key=>workspaceText(locale,key);
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.matchMedia('(min-width: 1200px)').matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLimit, setMobileLimit] = useState(4);
  const mobileNavigation = useRef(null);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [connectionChanged, setConnectionChanged] = useState(false);
  const mobileTrigger = useRef(null);
  const navigationSelected = useRef(false);
  const shell = shellCopy(locale);
  const previousRoute=useRef('');
  useEffect(() => {
    const adapt = () => {
      const textSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setMobileLimit(Math.max(2, Math.min(4, Math.floor(window.innerWidth / Math.max(64, textSize * 3.75)) - 1)));
    };
    adapt();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(adapt);
    if (mobileNavigation.current) observer?.observe(mobileNavigation.current);
    window.addEventListener('resize', adapt);
    return () => { observer?.disconnect(); window.removeEventListener('resize', adapt); };
  }, [activeWorkspace?.id]);
  useEffect(() => { setMobileOpen(false); }, [location.key]);
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
  /* Workspace-change cache invalidation lives in QueryProvider (it owns the
   * query client), keeping useQueryClient out of this component's body so
   * the shell renders before the client resolves. */
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
  /* KAN-210: opening and error states are rooms in the product, not windows
   * broken outside it. shellFor renders the full shell chrome (brand, rail,
   * topbar, phone bar) around any main content, so "Workspace unavailable"
   * keeps its navigation and identity while a centered panel explains,
   * reassures and retries. Degraded states present navigation at the default
   * tier with no policy filter — exactly what DashboardSidebar derives for a
   * missing workspace context. */
  function shellFor(mainNode,presented,tier,role){return <QueryProvider><ThemeColorProvider>
    <div lang={locale} data-role={role||user?.identity} data-area={location.pathname.split('/')[2] || 'home'} className={`visionary-workspace workspace-shell stage-${tier} flex h-dvh flex-col overflow-hidden text-[#121317]`}>
      <a className="workspace-skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>{shell.skip}</a>
      <DashboardTopbar userName={userName} sidebarExpanded={sidebarExpanded || mobileOpen} onToggleSidebar={() => window.matchMedia("(min-width: 768px)").matches ? setSidebarExpanded(v => !v) : setMobileOpen(v => !v)} />
      <div role="status" aria-live="polite" aria-atomic="true" className={offline ? 'workspace-connectivity' : 'sr-only'}>{offline ? shell.offline : connectionChanged ? shell.online : ''}</div>
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
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">{mainNode}</main>
      </div>
      <nav ref={mobileNavigation} lang={locale} aria-label={t("mobileNavigation")} className="workspace-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--v-border)] bg-white md:hidden">{presented.mobile.map(item=>{const Icon=item.icon;return <NavLink key={item.key} to={item.to} className="workspace-bottom-link flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-2 text-xs"><span className="workspace-bottom-icon"><Icon aria-hidden="true" size={20}/></span><span>{item.label}</span></NavLink>;})}<button ref={mobileTrigger} aria-label={t("moreNavigation")} aria-haspopup="dialog" aria-controls="mobile-workspace-navigation" aria-expanded={mobileOpen} data-active={presented.mobileMoreActive} aria-current={presented.mobileMoreActive ? 'true' : undefined} className="workspace-bottom-more flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-2 text-xs" onClick={()=>setMobileOpen(true)}><span className="workspace-bottom-icon"><Ellipsis aria-hidden="true" size={20}/></span><span>{t("more")}</span></button></nav>
    </div>
  </ThemeColorProvider></QueryProvider>;}
  const degradedPresented=presentNavigation(user?.identity,'higher',navigationFor(user?.identity,locale),secondaryNavigation(user?.identity,locale),location.pathname,mobileLimit);
  function unavailable(message){return shellFor(
    <div className="workspace-surface min-h-full overflow-hidden flex items-center justify-center p-6 sm:p-10" lang={locale}>
      <section className="w-full max-w-md rounded-[var(--v-radius-panel)] border border-[var(--v-border)] bg-[var(--v-surface)] p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{background:'var(--v-soft)'}}><CloudOff size={24} aria-hidden="true" style={{color:'var(--v-action)'}}/></div>
        <h1 className="mt-5 text-xl font-medium">{recoveryCopy('Workspace unavailable')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]" role="alert" lang="en">{message}</p>
        <p className="mt-3 text-sm leading-6 text-[#5f6368]">{recoveryCopy('Your saved records remain on this device. Restore readable records, then retry.')}</p>
        <div className="mt-6 flex justify-center"><button className="v-button primary" onClick={recover}>{recoveryCopy('Retry workspace')}</button></div>
      </section>
    </div>,degradedPresented,'higher');}
  if(workspaceError||scopeError)return unavailable(workspaceError||scopeError);
  if(!activeWorkspace)return shellFor(<div className="workspace-surface min-h-full overflow-hidden"><WorkspaceOpening locale={locale} title="Visionary" note={t("openingWorkspace")} /></div>,degradedPresented,'higher');
  if (!canAccessDashboardPath(user?.identity, location.pathname)) {
    const section = location.pathname.split("/")[2] || "home";
    // FAP-75/FAP-87: never silently rewrite the address bar for a restricted deep link.
    if (isOrganizationArea(section) || dashboardAreaOwner(section)) {
      /* KAN-210 shell law: a restricted area is a room in the product, not a
       * bare page — the gate keeps the full shell chrome and renders inside
       * the main landmark, with the viewer's own workspace navigation. */
      let gateTier;
      try { gateTier = getStagePresentation({ personId: user.id, workspaceId: activeWorkspace.id, role: activeWorkspace.role, locale: "en" }).tier; }
      catch (error) { return unavailable(error.message); }
      const gatePresented = presentNavigation(activeWorkspace.role, gateTier, navigationFor(user.identity, locale), secondaryNavigation(user.identity, locale), location.pathname, mobileLimit);
      return shellFor(<RoleAreaUnavailable />, gatePresented, gateTier, activeWorkspace.role);
    }
    return <Navigate to="/dashboard/home" replace />;
  }
  const ctx={personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:'en'};
  let policy;
  try{if(ctx.role==='organization')policy=organizationAccess(ctx);}catch(error){return unavailable(error.message);}
  const permitted=!policy||organizationPathAllowed(policy,location.pathname);
  const navigation=navigationFor(user.identity,locale).filter(item=>!policy||organizationPathAllowed(policy,item.to));
  let stageTier;try{stageTier=getStagePresentation({personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:"en"}).tier;}catch(error){return unavailable(error.message);}
  const presented = presentNavigation(ctx.role,stageTier,navigation,secondaryNavigation(ctx.role,locale).filter(item=>!policy||organizationPathAllowed(policy,item.to)),location.pathname,mobileLimit);
  /* FAP-89: a capability denial keeps the owner-directed explanation (it can only
   * render for a non-owner profile, since the owner holds every capability); a
   * personal-learning section is not part of an organization workspace at all, so
   * the denial says that instead of sending the viewer — including the Owner —
   * to "ask the organization owner". */
  const denial=!policy?null:organizationSectionKind(location.pathname)==='personal'?<div className="v-page" lang={locale}><h1 className="v-title">{organizationCopy(locale,'Not available in this workspace')}</h1><p className="v-notice" role="alert">{organizationCopy(locale,'This section belongs to personal learning workspaces. It is not part of an organization workspace.')}</p><NavLink to="/dashboard/home" className="v-button">{organizationCopy(locale,'Return to workspace')}</NavLink></div>:<div className="v-page" lang={locale}><h1 className="v-title">{organizationCopy(locale,'Permission required')}</h1><p className="v-notice" role="alert">{organizationCopy(locale,'Your {role} permission does not include this section. Ask the organization owner to review access.',{role:organizationCopy(locale,policy.label)})}</p><NavLink to="/dashboard/home" className="v-button">{organizationCopy(locale,'Return to workspace')}</NavLink></div>;
  return shellFor(<>
    <div className="workspace-surface min-h-full overflow-hidden">{!permitted?denial:policy&&activeWorkspace.organizationId&&location.pathname==='/dashboard/home'?<OrganizationAccessHome key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:policy&&location.pathname==='/dashboard/subscription'?<OrganizationBilling key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={locale}/>:<Suspense key={ctx.personId+":"+activeWorkspace.id+":"+location.pathname} fallback={<WorkspaceOpening locale={locale} title="Visionary" note={t("openingWorkspace")} />}><Outlet /></Suspense>}</div>
    {permitted && <FeedbackPrompt key={ctx.personId+':'+ctx.workspaceId} accountId={ctx.personId} locale={locale} surface={feedbackSurface(location.pathname)}/>}
  </>,presented,stageTier,ctx.role);
}
