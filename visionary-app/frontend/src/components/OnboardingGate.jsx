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
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
