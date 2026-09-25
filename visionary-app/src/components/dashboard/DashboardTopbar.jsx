import { useState } from "react";
import { Search, Menu, Plus, HelpCircle, Settings, LogOut, UserCircle, Users, Crown, Bell, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import VisionaryLogo from "@/components/VisionaryLogo";
import { navigationFor,secondaryNavigation } from "@/lib/dashboardNavigation";
import { PRODUCT_ACCESS } from "@/lib/productAccess";
import WorkspaceSwitcher from './WorkspaceSwitcher';
import AudioPresence from './AudioPresence';
import { useWorkspace } from '@/hooks/useWorkspace';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DashboardTopbar({ userName, onToggleSidebar, sidebarExpanded }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const student = useStudentData();
  const { data: workspaceData, ctx } = useWorkspace();
  const role = ctx?.role || user?.identity;
  const connect = role === "student" ? { label: "Join a class", to: "/dashboard/classes?join=1" }
    : role === "professional" ? { label: "Set a career goal", to: "/dashboard/career" }
    : role === "teacher" ? { label: "Create a class", to: "/dashboard/classes?create=1" }
    : role === "parent" ? { label: "Connect your child", to: "/dashboard/child" }
    : { label: "Add people", to: "/dashboard/people" };
  const plan = workspaceData?.subscription.plan || PRODUCT_ACCESS.plan;
  const destinations = [...navigationFor(role), ...secondaryNavigation(role), { label: "Profile", to: "/dashboard/profile" }, { label: "Settings", to: "/dashboard/settings" },
    ...(role === 'student' ? student.topics.map(t => ({ label: t.name, detail: t.subject, to: "/dashboard/learn/" + t.id })) : [])];
  const results = destinations.filter(item => (item.label + " " + (item.detail || "")).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);
  const openResult = (to) => { setSearchOpen(false); setQuery(""); navigate(to); };
  return <header className="z-30 flex h-16 shrink-0 items-center gap-2 border-b border-[#dadce0] bg-white px-3 sm:px-5">
    <button onClick={onToggleSidebar} aria-label="Toggle navigation" aria-expanded={sidebarExpanded} aria-controls="dashboard-navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8f0fd]"><Menu className="h-5 w-5" /></button>
    <Link to="/dashboard/home" aria-label="Visionary home" className="workspace-brand shrink-0"><VisionaryLogo /></Link>
    <WorkspaceSwitcher />
    <div className="flex flex-1 justify-center sm:px-6">
      <div className="v-audio-anchor relative inline-flex w-20 sm:w-full sm:max-w-xl">
        <button onClick={() => setSearchOpen(true)} className="flex h-11 w-20 items-center justify-start gap-3 rounded-full bg-[#f1f5fb] pl-3.5 text-[#5f6368] hover:bg-[#e8f0fd] sm:w-full sm:px-4" aria-label="Search your workspace">
          <Search className="h-5 w-5 shrink-0" /><span className="hidden text-sm sm:block">Search your workspace</span>
        </button>
        <AudioPresence />
      </div>
    </div>
    <Link to={connect.to} aria-label={connect.label} title={connect.label} className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-2 text-[#0b57d2] hover:bg-[#e8f0fd] xl:px-3"><Plus className="h-5 w-5" /><span className="hidden text-sm font-medium xl:inline">{connect.label}</span></Link>
    <Link to="/dashboard/connections" aria-label="Connections and requests" title="Connections and requests" className="hidden h-11 w-11 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8f0fd] sm:flex"><Users className="h-5 w-5" /></Link>
    <Link to="/dashboard/support" aria-label="Help and support" className="hidden h-11 w-11 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8f0fd] sm:flex"><HelpCircle className="h-5 w-5" /></Link>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button aria-label="Open account menu" className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b57d2] font-medium text-white ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#4285F4]">{userName.charAt(0).toUpperCase()}</button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="workspace-account-menu w-[min(320px,calc(100vw-24px))] rounded-[20px] bg-white p-2">
        <DropdownMenuLabel className="p-3 font-normal"><div className="flex items-center gap-3"><div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b57d2] text-lg font-medium text-white">{userName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-base font-medium text-[#121317]">{userName}</p><p className="mt-0.5 truncate text-xs text-[#5f6368]">{user?.email}</p></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e8f0fd] px-3 py-1 text-xs font-medium capitalize text-[#0b57d2]">{role} workspace</span><span className="rounded-full border border-[#dadce0] px-3 py-1 text-xs text-[#5f6368]">{plan} · Local preview</span></div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/dashboard/profile")} className="workspace-account-item gap-3"><UserCircle aria-hidden="true" />Your profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/dashboard/subscription")} className="workspace-account-item gap-3"><Crown aria-hidden="true" />Plans & usage</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")} className="workspace-account-item gap-3"><Settings aria-hidden="true" />Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs font-medium text-[#5f6368]">Your workspace</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate("/dashboard/connections")} className="workspace-account-item gap-3"><Users aria-hidden="true" />Connections and requests</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/notifications')} className="workspace-account-item gap-3"><Bell aria-hidden="true" />Notifications</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/personalization')} className="workspace-account-item gap-3"><SlidersHorizontal aria-hidden="true" />Personalization</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard/privacy')} className="workspace-account-item gap-3"><ShieldCheck aria-hidden="true" />Privacy & consent</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { logout(); navigate("/login", { replace: true }); }} className="workspace-account-item gap-3"><LogOut aria-hidden="true" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader><DialogTitle>Search your workspace</DialogTitle><DialogDescription>Find a page or one of your learning topics.</DialogDescription></DialogHeader>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pages and topics" aria-label="Search pages and topics" className="v-field" />
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">{results.length ? results.map(item => <button key={item.to} onClick={() => openResult(item.to)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-[#e8f0fd]"><span>{item.label}</span><span className="ml-4 truncate text-xs text-[#5f6368]">{item.detail || "Page"}</span></button>) : <p className="px-4 py-6 text-sm text-[#5f6368]">No results. Try a page name or topic.</p>}</div>
      </DialogContent>
    </Dialog>
  </header>;
}
