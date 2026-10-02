import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { snapshot } from '@/services/workspaceService';

export function useWorkspace() {
  const { user, activeWorkspace, person } = useAuth();
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => { const events=['visionary:v2-change','storage','visionary:workspace-change','visionary:mentor-change','visionary:learning-change','visionary:plan-change','visionary:community-change']; events.forEach(event=>window.addEventListener(event,refresh)); return () => events.forEach(event=>window.removeEventListener(event,refresh)); }, [refresh]);
  const base = useMemo(() => activeWorkspace && user ? { personId: user.id, workspaceId: activeWorkspace.id, role: activeWorkspace.role, locale: 'en' } : null, [activeWorkspace?.id, activeWorkspace?.role, user?.id]);
  const result = useMemo(() => { if(!base) return {data:null,error:''}; try {return {data:snapshot(base),error:''};} catch(error){return {data:null,error:error.message};} }, [base, revision]);
  return { ...result, revision, refresh, ctx: base ? {...base,locale:result.data?.preferences.locale || 'en'} : null, person, workspace:activeWorkspace };
}
