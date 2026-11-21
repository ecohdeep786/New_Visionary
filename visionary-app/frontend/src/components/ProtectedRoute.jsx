import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div data-font-surface="product" role="status" aria-busy="true" className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white">
    <div aria-hidden="true" className="w-8 h-8 border-4 border-[#d2d2d7] border-t-[#0066cc] rounded-full animate-spin motion-reduce:animate-none"></div>
    <p className="text-sm text-[#6e6e73]">Connecting to Visionary…</p>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return <div data-font-surface="product" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"><p role="alert">{authError.message || 'Your account could not be loaded.'}</p><button onClick={checkUserAuth} className="text-[#0066cc]">Retry loading account</button></div>;
  }

  if (!isAuthenticated) {
    /* Deep-link recovery (F-01): the requested destination must survive the
     * auth gate. Redirecting to /login?returnTo=… routes the post-sign-in
     * navigation through authReturnTo's hardened safeReturnTo() validation
     * (same-origin, dashboard-only, app-param stripping) instead of losing
     * the intended workspace path to the /dashboard/home fallback. */
    const intended = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(intended)}`} replace />;
  }

  return <Outlet />;
}
