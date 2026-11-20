import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { linkForDestination } from "@/lib/authReturnTo";

/**
 * Keeps the product journey deterministic: authenticated users set up their
 * learning context before visiting the personalised workspace.
 */
export default function OnboardingGate() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.onboarding_complete) {
    const destination = location.pathname + location.search;
    return <Navigate to={linkForDestination('/onboarding', destination)} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
