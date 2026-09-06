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
      <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden">
        <DashboardTopbar
          userName={userName}
          onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
        />
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <DashboardSidebar expanded={sidebarExpanded} />
          <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
            <Outlet />
          </main>
        </div>
        {showFloatingAsk && <FloatingAskButton />}
      </div>
    </ThemeColorProvider>
  );
}