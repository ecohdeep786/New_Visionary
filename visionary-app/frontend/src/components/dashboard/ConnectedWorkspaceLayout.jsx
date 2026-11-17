import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import QueryProvider from './QueryProvider';
import WorkspaceOpening from './WorkspaceOpening';
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import ConnectedWorkspaces from './ConnectedWorkspaces';
import ConnectedProfile from './ConnectedProfile';
import ConnectedLearningHistory from './ConnectedLearningHistory';
import ConnectedConsents from './ConnectedConsents';
import ApprovedPrivacyPolicy from './ApprovedPrivacyPolicy';
import ConnectedAccountSecurity from './ConnectedAccountSecurity';
import GettingStarted from '@/components/onboarding/GettingStarted';
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";
import { ConnectedWorkspaceProvider, useConnectedWorkspace } from '@/hooks/ConnectedWorkspaceProvider';
import { navigationFor, secondaryNavigation } from "@/lib/dashboardNavigation";
import { presentNavigation } from '@/lib/navigationPresentation';
import { workspaceText } from '@/lib/workspaceStrings';
import { connectedSurfaceCopy } from '@/lib/connectedSurfaceCopy';
import { shellCopy } from './shellCopy';
import { privacyCopy } from '@/lib/privacyCopy';
import FeedbackPrompt from './FeedbackPrompt';
import { feedbackSurface } from '@/services/feedbackClient';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CloudOff, Ellipsis } from "lucide-react";
import './workspace.css';
import './workspace-design.css';
import '@/styles/workspace-premium.css';

const roleFeatures = {
  student: 'Practice, projects, and classroom assignments',
  teacher: 'Classrooms, assignments, and grading',
  parent: 'Guardian connections and shared learner reports',
  professional: 'Career goals and portfolio projects',
  organization: 'Cohorts, curriculum, and organization membership',
  default: 'Interactive learning and shared workspaces',
};

/**
 * FHE-05 — the production composition root. The optimized build hosts the
 * approved workspace shell (sidebar, topbar, phone navigation, skip link,
 * offline banner, focus management) around server-owned account state: the
 * workspace context comes from ConnectedWorkspaceProvider (overview list,
 * idempotent provisioning, readback confirmation), and every routed area
 * renders either a service-backed connected surface or an explicit
 * unavailable room. Nothing from the development preview store executes here.
 */
export default function ConnectedWorkspaceLayout() {
  return <QueryProvider><ConnectedWorkspaceProvider><ConnectedWorkspaceShell /></ConnectedWorkspaceProvider></QueryProvider>;
}

function ConnectedWorkspaceShell() {
  const { user } = useAuth();
  const connected = useConnectedWorkspace();
  const { status, error, active } = connected;
  const locale = connected.data?.preferences.interfaceLocale || 'en';
  const t = key => workspaceText(locale, key);
  const shell = shellCopy(locale);
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const role = user?.identity;
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.matchMedia('(min-width: 1200px)').matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLimit, setMobileLimit] = useState(4);
  const mobileNavigation = useRef(null);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [connectionChanged, setConnectionChanged] = useState(false);
  const mobileTrigger = useRef(null);
  const navigationSelected = useRef(false);
  const previousRoute = useRef('');
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
  }, [active?.id]);
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
  /* Route-change focus management, as in the approved shell: after moving
   * between workspace rooms, keyboard and screen-reader focus lands on the
   * main landmark (unless a dialog owns it). */
  useEffect(() => {
    if (!active) return;
    const route = active.id + ':' + location.pathname;
    const changed = previousRoute.current && previousRoute.current !== route;
    previousRoute.current = route;
    if (!changed) return;
    const frame = requestAnimationFrame(() => { if (!document.querySelector('[role="dialog"][data-state="open"]')) document.getElementById('main')?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, active?.id]);
  const navigation = navigationFor(role, locale);
  const secondary = secondaryNavigation(role, locale);
  /* The connected shell presents the account's own navigation at the default
   * tier with no workspace policy filter (KAN-210 degraded-state law): every
   * destination lands on its service-backed surface or an honest room. */
  const presented = presentNavigation(role, 'higher', navigation, secondary, location.pathname, mobileLimit);
  function shellFor(mainNode) {
    return <ThemeColorProvider>
      <div lang={locale} data-role={role} data-area={location.pathname.split('/')[2] || 'home'} className="visionary-workspace workspace-shell stage-higher flex h-dvh flex-col overflow-hidden text-[#1d1d1f]">
        <a className="workspace-skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>{shell.skip}</a>
        <DashboardTopbar userName={userName} sidebarExpanded={sidebarExpanded || mobileOpen} onToggleSidebar={() => window.matchMedia("(min-width: 768px)").matches ? setSidebarExpanded(v => !v) : setMobileOpen(v => !v)} />
        <div role="status" aria-live="polite" aria-atomic="true" className={offline ? 'workspace-connectivity' : 'sr-only'}>{offline ? shell.offline : connectionChanged ? shell.online : ''}</div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden h-full md:block"><DashboardSidebar expanded={sidebarExpanded} onExpand={() => setSidebarExpanded(true)} /></div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent id="mobile-workspace-navigation" lang={locale} side="left" onCloseAutoFocus={event => {
              event.preventDefault();
              const target = navigationSelected.current ? document.getElementById('main') : window.matchMedia('(min-width: 768px)').matches ? document.querySelector('[aria-controls="dashboard-navigation"]') : mobileTrigger.current;
              target?.focus({ preventScroll: true });
              navigationSelected.current = false;
            }} className="workspace-navigation-sheet w-[min(20rem,calc(100vw-2rem))] bg-[#ffffff] p-0 pt-14 [&>button]:min-h-12 [&>button]:min-w-12">
              <SheetTitle lang={locale} className="sr-only">{t("workspaceNavigation")}</SheetTitle><SheetDescription lang={locale} className="sr-only">{t("navigationDescription")}</SheetDescription>
              <DashboardSidebar id="mobile-dashboard-navigation" expanded onNavigate={() => { navigationSelected.current = true; setMobileOpen(false); }} />
            </SheetContent>
          </Sheet>
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">{mainNode}</main>
        </div>
        <nav ref={mobileNavigation} lang={locale} aria-label={t("mobileNavigation")} className="workspace-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--v-border)] bg-white md:hidden">{presented.mobile.map(item => { const Icon = item.icon; return <NavLink key={item.key} to={item.to} className="workspace-bottom-link flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-2 text-xs"><span className="workspace-bottom-icon"><Icon aria-hidden="true" size={20}/></span><span>{item.label}</span></NavLink>; })}<button ref={mobileTrigger} aria-label={t("moreNavigation")} aria-haspopup="dialog" aria-controls="mobile-workspace-navigation" aria-expanded={mobileOpen} data-active={presented.mobileMoreActive} aria-current={presented.mobileMoreActive ? 'true' : undefined} className="workspace-bottom-more flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-2 text-xs" onClick={() => setMobileOpen(true)}><span className="workspace-bottom-icon"><Ellipsis aria-hidden="true" size={20}/></span><span>{t("more")}</span></button></nav>
      </div>
    </ThemeColorProvider>;
  }
  const recoveryCopy = privacyCopy(locale);
  function unavailable(message, onRetry) {
    return shellFor(<div className="workspace-surface min-h-full overflow-hidden flex items-center justify-center p-6 sm:p-10" lang={locale}>
      <section className="w-full max-w-md rounded-[var(--v-radius-panel)] border border-[var(--v-border)] bg-[var(--v-surface)] p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{background:'var(--v-soft)'}}><CloudOff size={24} aria-hidden="true" style={{color:'var(--v-action)'}}/></div>
        <h1 className="mt-5 text-xl font-medium">{recoveryCopy('Workspace unavailable')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#6e6e73]" role="alert" lang="en">{message}</p>
        {onRetry && <div className="mt-6 flex justify-center"><button className="v-button primary" onClick={onRetry}>{recoveryCopy('Retry workspace')}</button></div>}
      </section>
    </div>);
  }
  if (status === 'loading') {
    return shellFor(<div className="workspace-surface min-h-full overflow-hidden"><WorkspaceOpening locale={locale} title="Visionary" note={t("openingWorkspace")} /></div>);
  }
  if (status === 'unavailable') {
    /* Server-owned truth: records live on Visionary's servers; the shell could
     * not confirm the account's workspaces on this attempt. */
    return unavailable(error, connected.retry);
  }
  return shellFor(<div className="workspace-surface min-h-full overflow-hidden">
    <ConnectedWorkspaceContent accountId={user?.id} identity={role} locale={locale} />
    <FeedbackPrompt key={active?.id + ':' + user?.id} accountId={user?.id} locale={locale} surface={feedbackSurface(location.pathname)} />
  </div>);
}

function ConnectedWorkspaceContent({ accountId, identity, locale }) {
  const { pathname } = useLocation();
  const page = pathname.toLowerCase().replace(/\/+$/, '');
  if (!accountId) return <UnavailableArea identity={identity} locale={locale} />;
  if (page === '/dashboard/subscription') return <Outlet />;
  if (page === '/dashboard/profile') return <ConnectedProfile key={accountId} />;
  if (page === '/dashboard/connections') return <ConnectedWorkspaces key={accountId} accountId={accountId} />;
  if (page === '/dashboard/privacy') return <div key={accountId}><ApprovedPrivacyPolicy accountId={accountId} /><ConnectedConsents accountId={accountId} /></div>;
  if (page === '/dashboard/settings') return <ConnectedAccountSecurity key={accountId} accountId={accountId} />;
  if (page === '/dashboard/learn' || page.startsWith('/dashboard/learn/')) return <ConnectedLearningHistory key={accountId} accountId={accountId} />;
  if (page === '/dashboard' || page === '/dashboard/home') return <ConnectedHome accountId={accountId} identity={identity} locale={locale} />;
  return <UnavailableArea identity={identity} locale={locale} />;
}

function ConnectedHome({ accountId, identity, locale }) {
  const { account } = useAuth();
  const t = connectedSurfaceCopy(locale);
  const features = Object.hasOwn(roleFeatures, identity) ? roleFeatures[identity] : roleFeatures.default;
  return <div className="mx-auto max-w-3xl px-1 py-6 sm:py-10" lang={locale}>
    <section className="max-w-xl rounded-2xl border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">{t('Your Visionary account')}</h1>
      {account?.full_name && <p className="mt-2 break-words">{account.full_name}</p>}
      <p className="mt-4 text-slate-700">{t('{features} will be available once their online services are connected.', { features: t(features) })}</p>
      <div className="mt-4"><GettingStarted /></div>
    </section>
  </div>;
}

function UnavailableArea({ identity, locale }) {
  const t = connectedSurfaceCopy(locale);
  const features = Object.hasOwn(roleFeatures, identity) ? roleFeatures[identity] : roleFeatures.default;
  return <div className="mx-auto max-w-3xl px-1 py-6 sm:py-10" lang={locale}>
    <section className="max-w-xl rounded-2xl border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">{t('This workspace area is not available yet')}</h1>
      <p className="mt-4 text-slate-700">{t('{features} will be available once their online services are connected.', { features: t(features) })} {t('Your saved account records are unaffected.')}</p>
      <Link className="mt-4 inline-flex min-h-11 items-center underline" to="/dashboard/home">{t('Return to account home')}</Link>
    </section>
  </div>;
}
