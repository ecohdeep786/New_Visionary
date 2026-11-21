import { Suspense, lazy } from 'react';
import ConnectedWorkspaceLayout from './ConnectedWorkspaceLayout';

/* FHE-05 composition root + FHE-20 route-table split. In development the
 * approved preview workspace runs (browser-local development store); the
 * optimized production build instead hosts the same shell design around
 * server-owned account state through ConnectedWorkspaceLayout. The preview
 * boundary is DEV-conditional: the static DEV replacement removes both the
 * lazy reference and the preview chunk from the production artifact — the
 * production graph can no longer even name the preview module. */
const PreviewDashboardLayout = import.meta.env.DEV ? lazy(() => import('./PreviewDashboardLayout')) : null;

export default function DashboardLayout() {
  return import.meta.env.DEV
    ? <Suspense fallback={null}><PreviewDashboardLayout /></Suspense>
    : <ConnectedWorkspaceLayout />;
}
