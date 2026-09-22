import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import DecisionHome from './DecisionHome';

const Guide = lazy(() => import('./Guide'));

function DashboardSkeleton() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col gap-6 p-6 animate-pulse" aria-busy="true">
      <div className="h-28 w-full bg-[#e8f0fd] rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-[#e8f0fd] rounded-2xl" />
        <div className="h-44 bg-[#e8f0fd] rounded-2xl" />
        <div className="h-44 bg-[#e8f0fd] rounded-2xl" />
      </div>
      <div className="h-64 w-full bg-[#e8f0fd] rounded-2xl" />
    </div>
  );
}

/**
 * Role-aware dashboard router.
 * Branches the home experience by the user's onboarding identity.
 * Uses lazy chunking so students do not download teacher/parent/org bundles.
 */
export default function DashboardHome() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activityEntry = location.pathname.endsWith('/ask') || ['journey','session','topic'].some(key => params.has(key)) || location.state?.initialQuestion;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {activityEntry ? <Guide /> : <DecisionHome />}
    </Suspense>
  );
}
