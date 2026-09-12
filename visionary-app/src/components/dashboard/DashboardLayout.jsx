import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import FloatingAskButton from "./FloatingAskButton";
import { useAuth } from "@/lib/AuthContext";
import { ThemeColorProvider } from "@/hooks/useThemeColor";

export default function DashboardLayout() {
  const { user } = useAuth();
  const userName = user?.full_name || user?.email?.split("@")[0] || "Learner";
  const location = useLocation();
  const showFloatingAsk = location.pathname !== "/dashboard/ask";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <ThemeColorProvider>
      <div className="flex flex-col h-screen bg-[#f8fafd] overflow-hidden">
        <DashboardTopbar
          userName={userName}
          onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
        />
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <DashboardSidebar expanded={sidebarExpanded} />
          <main id="main" className="flex-1 overflow-y-auto bg-[#f8fafd] p-2 sm:p-3 lg:p-4">
            <div className="min-h-full rounded-[20px] border border-[#e1e3e1] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
              <Outlet />
            </div>
          </main>
        </div>
        {showFloatingAsk && <FloatingAskButton />}
      </div>
    </ThemeColorProvider>
  );
}
