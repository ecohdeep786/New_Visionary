import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div data-font-surface="product" role="status" aria-busy="true" className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white">
    <div aria-hidden="true" className="w-8 h-8 border-4 border-[#dadce0] border-t-[#0b57d0] rounded-full animate-spin motion-reduce:animate-none"></div>
    <p className="text-sm text-[#5f6368]">Connecting to Visionary…</p>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

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
    return <div data-font-surface="product" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"><p role="alert">{authError.message || 'Your account could not be loaded.'}</p><button onClick={checkUserAuth} className="text-[#4285F4]">Retry loading account</button></div>;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
