import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Keeps the product journey deterministic: authenticated users set up their
 * learning context before visiting the personalised workspace.
 */
export default function OnboardingGate() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.onboarding_complete) {
    const destination = location.pathname + location.search;
    return <Navigate to={location.pathname === '/dashboard/subscription' ? `/onboarding?returnTo=${encodeURIComponent(destination)}` : '/onboarding'} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
