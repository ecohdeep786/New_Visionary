import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';

/* QueryProvider — mounts the shared query client around the dashboard shell.
 * The @tanstack modules are static imports of this module, which DashboardLayout
 * (already a lazy route chunk) pulls in, so the engine loads alongside the
 * dashboard chunk instead of riding the entry graph. Until the client resolves
 * the shell chrome still paints; the outlet content appears one microtask later.
 * Workspace changes invalidate the cache here — this component owns the client
 * (the listener previously lived in DashboardLayout via useQueryClient). */
export default function QueryProvider({ children }) {
  const [client, setClient] = useState(null);
  useEffect(() => {
    let mounted = true;
    getQueryClient().then((qc) => { if (mounted) setClient(qc); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!client) return undefined;
    const invalidate = () => { client.invalidateQueries(); };
    window.addEventListener('visionary:workspace-change', invalidate);
    window.addEventListener('storage', invalidate);
    return () => {
      window.removeEventListener('visionary:workspace-change', invalidate);
      window.removeEventListener('storage', invalidate);
    };
  }, [client]);
  if (!client) return null;
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
