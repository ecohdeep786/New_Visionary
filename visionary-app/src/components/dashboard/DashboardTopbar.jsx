import { useState } from "react";
import { Search, Menu, Plus, HelpCircle, Settings, LogOut, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import VisionaryLogo from "@/components/VisionaryLogo";
import { navigationFor } from "@/lib/dashboardNavigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DashboardTopbar({ userName, onToggleSidebar, sidebarExpanded }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const student = useStudentData();
  const role = user?.identity;
  const connect = role === "student" ? { label: "Join a class", to: "/dashboard/classes?join=1" }
    : role === "teacher" ? { label: "Create a class", to: "/dashboard/home?create=1" }
    : role === "parent" ? { label: "Connect your child", to: "/dashboard/child" }
    : { label: "Add people", to: "/dashboard/people" };
  const destinations = [...navigationFor(role), { label: "Profile", to: "/dashboard/profile" }, { label: "Settings", to: "/dashboard/settings" },
    ...student.topics.map(t => ({ label: t.name, detail: t.subject, to: "/dashboard/learn/" + t.id }))];
  const results = destinations.filter(item => (item.label + " " + (item.detail || "")).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);
  const openResult = (to) => { setSearchOpen(false); setQuery(""); navigate(to); };
  return <header className="z-30 flex h-16 shrink-0 items-center gap-2 bg-[#f8fafd] px-3 sm:px-5">
    <button onClick={onToggleSidebar} aria-label="Toggle navigation" aria-expanded={sidebarExpanded} aria-controls="dashboard-navigation" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#444746] hover:bg-slate-200/60"><Menu className="h-5 w-5" /></button>
    <Link to="/dashboard/home" aria-label="Visionary home" className="shrink-0"><VisionaryLogo /></Link>
    <div className="flex flex-1 justify-center sm:px-6">
      <button onClick={() => setSearchOpen(true)} className="flex h-10 w-10 items-center justify-center gap-3 rounded-full bg-[#eaf0f8] text-[#5f6368] sm:w-full sm:max-w-xl sm:justify-start sm:px-4" aria-label="Search your workspace">
        <Search className="h-5 w-5 shrink-0" /><span className="hidden text-sm sm:block">Search your workspace</span>
      </button>
    </div>
    <Link to={connect.to} aria-label={connect.label} title={connect.label} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1a73e8] hover:bg-[#e8f0fe]"><Plus className="h-6 w-6" /></Link>
    <Link to="/contact" aria-label="Help and support" className="hidden h-10 w-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-slate-200/60 sm:flex"><HelpCircle className="h-5 w-5" /></Link>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button aria-label="Open account menu" className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] font-medium text-white ring-offset-2 focus-visible:ring-2">{userName.charAt(0).toUpperCase()}</button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-3"><p className="truncate text-sm">{userName}</p><p className="mt-1 truncate text-xs font-normal text-[#5f6368]">{user?.email}</p><p className="mt-2 text-xs font-normal capitalize text-[#1a73e8]">{role} workspace · Local preview</p></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/dashboard/profile")} className="gap-3 rounded-lg py-3"><UserCircle className="h-4 w-4" />Manage profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")} className="gap-3 rounded-lg py-3"><Settings className="h-4 w-4" />Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { logout(); navigate("/login", { replace: true }); }} className="gap-3 rounded-lg py-3"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader><DialogTitle>Search your workspace</DialogTitle><DialogDescription>Find a page or one of your learning topics.</DialogDescription></DialogHeader>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pages and topics" aria-label="Search pages and topics" className="rounded-xl border border-[#dadce0] px-4 py-3 text-sm focus:border-[#1a73e8] focus:outline-none" />
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">{results.length ? results.map(item => <button key={item.to} onClick={() => openResult(item.to)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-[#e8f0fe]"><span>{item.label}</span><span className="ml-4 truncate text-xs text-[#5f6368]">{item.detail || "Page"}</span></button>) : <p className="px-4 py-6 text-sm text-[#5f6368]">No results. Try a page name or topic.</p>}</div>
      </DialogContent>
    </Dialog>
  </header>;
}

