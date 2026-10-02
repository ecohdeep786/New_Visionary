import {workspaceText} from '@/lib/workspaceStrings';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import { useEffect, useState } from "react";
import { Search, Menu, Plus, HelpCircle, Settings, LogOut, UserCircle, Users, Crown, Bell, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import VisionaryLogo from "@/components/VisionaryLogo";
import { navigationFor,secondaryNavigation } from "@/lib/dashboardNavigation";
import { PRODUCT_ACCESS } from "@/lib/productAccess";
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useWorkspace } from '@/hooks/useWorkspace';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DashboardTopbar({ userName, onToggleSidebar, sidebarExpanded }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchError,setSearchError]=useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const student = useStudentData();
  const { data: workspaceData, ctx } = useWorkspace();
  const role = ctx?.role || user?.identity;
  const locale=workspaceData?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
  const searchPrompt=t('search_'+role);
  let policy=null;try{if(ctx?.role==='organization')policy=organizationAccess(ctx);}catch{policy={permissions:[]};}
  const allowed=to=>!policy||organizationPathAllowed(policy,to);
  const connect = role === "student" ? { label: "Join a class", to: "/dashboard/classes?join=1" }
    : role === "professional" ? { label: "Set a career goal", to: "/dashboard/career" }
    : role === "teacher" ? { label: "Create a class", to: "/dashboard/classes?create=1" }
    : role === "parent" ? { label: "Connect your child", to: "/dashboard/child" }
    : { label: "Add people", to: "/dashboard/people" };
  connect.label=t('connect_'+role);
  const plan = workspaceData?.subscription.plan || PRODUCT_ACCESS.plan;
  const destinations = [...navigationFor(role,locale), ...secondaryNavigation(role,locale), { label: t("profile"), to: "/dashboard/profile" }, { label: t("settings"), to: "/dashboard/settings" },{label:t('support'),to:'/dashboard/support'},
    ...(role === 'student' ? student.topics.map(t => ({ label: t.name, detail: t.subject, to: "/dashboard/learn/" + t.id })) : [])].filter(item=>allowed(item.to));
  const results = destinations.filter(item => (item.label + " " + item.to + " " + (item.detail || "")).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);
  const openResult = (to) => { try{if(ctx?.role==='organization'&&!organizationPathAllowed(organizationAccess(ctx),to))throw Error('Your current permission does not include this destination.');setSearchError('');setSearchOpen(false);setQuery('');navigate(to);}catch(error){setSearchError(error.message);} };
  useEffect(() => {
    const onShortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);
  return <header lang={locale} className="z-30 flex h-16 shrink-0 items-center gap-2 bg-white px-3 sm:px-5">
    <button onClick={onToggleSidebar} aria-label={t("toggleNavigation")} aria-expanded={sidebarExpanded} aria-controls="dashboard-navigation" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8f0fd] md:flex"><Menu className="h-5 w-5" /></button>
    <Link to="/dashboard/home" aria-label={t("visionaryHome")} className="workspace-brand shrink-0"><VisionaryLogo /></Link>
    <WorkspaceSwitcher />
    <div className="flex flex-1 justify-center sm:px-6">
      <button onClick={() => setSearchOpen(true)} className="workspace-search-trigger flex h-11 w-11 items-center justify-center gap-3 rounded-full bg-[#f1f5fb] text-[#5f6368] hover:bg-[#e8f0fd] sm:w-full sm:max-w-xl sm:justify-start sm:px-4" aria-label={searchPrompt}>
        <Search className="h-5 w-5 shrink-0" /><span className="hidden min-w-0 flex-1 truncate text-left text-sm sm:block">{searchPrompt}</span><kbd className="workspace-search-shortcut hidden text-xs sm:inline">Ctrl K</kbd>
      </button>
    </div>
    {allowed(connect.to)&&<Link to={connect.to} aria-label={connect.label} title={connect.label} className="workspace-connect-action hidden h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-2 text-[#0b57d2] hover:bg-[#e8f0fd] md:flex xl:px-3"><Plus className="h-5 w-5" /><span className="hidden text-sm font-medium xl:inline">{connect.label}</span></Link>}
    <span className="w-14 shrink-0 md:hidden" aria-hidden="true" />
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button aria-label={t("accountMenu")} className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b57d2] text-sm font-medium text-white ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#4285F4]">{userName.charAt(0).toUpperCase()}</button></DropdownMenuTrigger>
      <DropdownMenuContent lang={locale} align="end" sideOffset={8} className="workspace-account-menu w-[min(320px,calc(100vw-24px))] rounded-[20px] bg-white p-2">
        <DropdownMenuLabel className="p-3 font-normal"><div className="flex items-center gap-3"><div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b57d2] text-lg font-medium text-white">{userName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-base font-medium text-[#121317]">{userName}</p><p className="mt-0.5 truncate text-xs text-[#5f6368]">{user?.email}</p></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e8f0fd] px-3 py-1 text-xs font-medium capitalize text-[#0b57d2]">{t("role_"+role)} {t("workspace")}</span><span className="rounded-full border border-[#dadce0] px-3 py-1 text-xs text-[#5f6368]">{plan} · {t("localPreview")}</span></div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/dashboard/profile")} className="workspace-account-item gap-3"><UserCircle aria-hidden="true" />{t("yourProfile")}</DropdownMenuItem>
        {allowed("/dashboard/subscription")&&<DropdownMenuItem onSelect={() => navigate("/dashboard/subscription")} className="workspace-account-item gap-3"><Crown aria-hidden="true" />{t(role==='organization'?'billing':'plans')}</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")} className="workspace-account-item gap-3"><Settings aria-hidden="true" />{t("settings")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs font-medium text-[#5f6368]">{t("yourWorkspace")}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate("/dashboard/connections")} className="workspace-account-item gap-3"><Users aria-hidden="true" />{t("connectionRequests")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/notifications')} className="workspace-account-item gap-3"><Bell aria-hidden="true" />{t("notifications")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/personalization')} className="workspace-account-item gap-3"><SlidersHorizontal aria-hidden="true" />{t("personalization")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/privacy')} className="workspace-account-item gap-3"><ShieldCheck aria-hidden="true" />{t("privacyConsent")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/support')} className="workspace-account-item gap-3"><HelpCircle aria-hidden="true" />{t("support")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { logout(); navigate("/login", { replace: true }); }} className="workspace-account-item gap-3"><LogOut aria-hidden="true" />{t("signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent lang={locale} className="max-w-xl rounded-2xl">
        <DialogHeader><DialogTitle lang={locale}>{t("searchTitle")}</DialogTitle><DialogDescription lang={locale}>{searchPrompt}. {t("searchScope")}</DialogDescription></DialogHeader>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPrompt} lang={locale} aria-label={t("searchInput")} className="v-field" />
        {searchError&&<p lang="en" className="v-notice v-error" role="alert">{searchError}</p>}
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">{results.length ? results.map(item => <button key={item.to} onClick={() => openResult(item.to)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-[#e8f0fd]"><span>{item.label}</span><span className="ml-4 truncate text-xs text-[#5f6368]">{item.detail || t("page")}</span></button>) : <p className="px-4 py-6 text-sm text-[#5f6368]">{t("searchEmpty")}</p>}</div>
      </DialogContent>
    </Dialog>
  </header>;
}
