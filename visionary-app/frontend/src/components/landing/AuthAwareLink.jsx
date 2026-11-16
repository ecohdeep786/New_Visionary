import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/* The public pages' closing conversion CTAs (§8 cross-team review
 * limitation #2): a signed-in visitor's real next action is the workspace,
 * not the registration form — the nav already offers "Open Visionary"
 * (a4dcafba); these body CTAs now agree with it. Signed-out behavior is
 * unchanged, and a CTA whose label already states a non-registration
 * destination ("Continue on web", "Try the loop yourself", "Open
 * Visionary") only swaps its destination, keeping its truthful label. */
export function useSignedIn() {
  const { authChecked, isAuthenticated } = useAuth();
  return authChecked && isAuthenticated;
}

export default function AuthAwareLink({
  to = "/register",
  signedInTo = "/dashboard/home",
  signedInLabel,
  className,
  children,
  ...rest
}) {
  const signedIn = useSignedIn();
  return (
    <Link to={signedIn ? signedInTo : to} className={className} {...rest}>
      {signedIn && signedInLabel !== undefined ? signedInLabel : children}
    </Link>
  );
}
