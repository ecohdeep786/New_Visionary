import { Suspense, lazy } from 'react';
import ConnectedWorkspaceLayout from './ConnectedWorkspaceLayout';

/* FHE-05 composition root. In development the approved preview workspace runs
 * (browser-local development store); the optimized production build instead
 * hosts the same shell design around server-owned account state through
 * ConnectedWorkspaceLayout. The preview layout is a lazy boundary so the
 * production graph neither bundles nor executes the development store. */
const PreviewDashboardLayout = lazy(() => import('./PreviewDashboardLayout'));

export default function DashboardLayout() {
  return import.meta.env.DEV
    ? <Suspense fallback={null}><PreviewDashboardLayout /></Suspense>
    : <ConnectedWorkspaceLayout />;
}
