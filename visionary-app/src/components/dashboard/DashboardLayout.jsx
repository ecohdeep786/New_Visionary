import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import AudioPresence from "./AudioPresence";
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";
import { canAccessDashboardPath, navigationFor } from "@/lib/dashboardNavigation";
import { saveLastPath } from '@/services/workspaceService';
import './workspace.css';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Ellipsis } from "lucide-react";

export default function DashboardLayout() {
  const { user, activeWorkspace, workspaceError } = useAuth();
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const refresh = () => { queryClient.invalidateQueries(); };
    window.addEventListener("visionary:workspace-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("visionary:workspace-change", refresh); window.removeEventListener("storage", refresh); };
  }, [queryClient]);
  useEffect(() => { document.getElementById("main")?.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => { if(activeWorkspace&&user)saveLastPath({personId:user.id,workspaceId:activeWorkspace.id,role:activeWorkspace.role,locale:'en'},location.pathname); },[location.pathname,activeWorkspace?.id]);
  if(workspaceError)return <main className="p-8" role="alert">{workspaceError}</main>;
  if(!activeWorkspace)return <main className="p-8" role="status">Preparing your workspace…</main>;
  if (!canAccessDashboardPath(user?.identity, location.pathname)) return <Navigate to="/dashboard/home" replace />;
  return <ThemeColorProvider>
    <div className="visionary-workspace workspace-shell flex h-dvh flex-col overflow-hidden text-[#121317]">
      <DashboardTopbar userName={userName} sidebarExpanded={sidebarExpanded || mobileOpen} onToggleSidebar={() => window.matchMedia("(min-width: 768px)").matches ? setSidebarExpanded(v => !v) : setMobileOpen(v => !v)} />
      <div className={`workspace-presence-anchor${sidebarExpanded ? " is-expanded" : ""}`}><AudioPresence /></div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full md:block"><DashboardSidebar expanded={sidebarExpanded} /></div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-72 bg-[#ffffff] p-0 pt-10">
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle><SheetDescription className="sr-only">Choose a page in your workspace.</SheetDescription>
          <DashboardSidebar expanded onNavigate={() => setMobileOpen(false)} />
        </SheetContent></Sheet>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
          <div className="workspace-surface min-h-full overflow-hidden"><Outlet key={activeWorkspace.id} /></div>
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="workspace-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[#dadce0] bg-white md:hidden">{navigationFor(user.identity).slice(0,4).map(item=>{const Icon=item.icon;return <NavLink key={item.key} to={item.to} className={({isActive})=>`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs ${isActive?'bg-[#e8f0fd] font-medium text-[#1967d2]':'text-[#5f6368]'}`}><Icon aria-hidden="true" size={19}/>{item.label}</NavLink>;})}<button aria-label="More navigation" aria-expanded={mobileOpen} className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs text-[#5f6368]" onClick={()=>setMobileOpen(true)}><Ellipsis aria-hidden="true" size={19}/>More</button></nav>
    </div>
  </ThemeColorProvider>;
}
