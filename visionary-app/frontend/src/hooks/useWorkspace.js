import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { snapshot } from '@/services/workspaceService';
import { useConnectedWorkspace } from '@/hooks/ConnectedWorkspaceProvider';

/* FHE-05 — one hook contract, two authorities.
 *
 * Development preview: the browser-local development store snapshot, exactly
 * as before. Production: the connected projection from
 * ConnectedWorkspaceProvider, whose workspace context is derived only from
 * server-owned records (overview list, idempotent provisioning). The preview
 * path can never execute in the optimized build: AuthContext keeps
 * activeWorkspace null there, so no snapshot is taken, and the connected
 * shell mounts the provider that supplies the same shape. */
function usePreviewWorkspace() {
  const { user, activeWorkspace, person } = useAuth();
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const events=['visionary:v2-change','storage','visionary:workspace-change','visionary:mentor-change','visionary:learning-change','visionary:plan-change','visionary:community-change'];
    events.forEach(event=>window.addEventListener(event,refresh));
    return () => events.forEach(event=>window.removeEventListener(event,refresh));
  }, [refresh]);
  const base = useMemo(() => activeWorkspace && user ? { personId: user.id, workspaceId: activeWorkspace.id, role: activeWorkspace.role, locale: 'en' } : null, [activeWorkspace?.id, activeWorkspace?.role, user?.id]);
  const result = useMemo(() => { if(!base) return {data:null,error:''}; try {return {data:snapshot(base),error:''};} catch(error){return {data:null,error:error.message};} }, [base, revision]);
  return { ...result, revision, refresh, ctx: base ? {...base,locale:result.data?.preferences.locale || 'en'} : null, person, workspace:activeWorkspace };
}

export function useWorkspace() {
  const preview = usePreviewWorkspace();
  const connected = useConnectedWorkspace();
  return import.meta.env.DEV ? preview : connected;
}
