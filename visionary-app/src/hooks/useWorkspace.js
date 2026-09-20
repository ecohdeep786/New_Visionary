import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { snapshot } from '@/services/workspaceService';

export function useWorkspace() {
  const { user, activeWorkspace, person } = useAuth();
  const [revision, setRevision] = useState(0);
  useEffect(() => { const refresh = () => setRevision(n => n + 1); window.addEventListener('visionary:v2-change', refresh); window.addEventListener('storage', refresh); window.addEventListener('visionary:workspace-change', refresh); return () => { window.removeEventListener('visionary:v2-change', refresh); window.removeEventListener('storage', refresh); window.removeEventListener('visionary:workspace-change', refresh); }; }, []);
  const base = useMemo(() => activeWorkspace && user ? { personId: user.id, workspaceId: activeWorkspace.id, role: activeWorkspace.role, locale: 'en' } : null, [activeWorkspace?.id, activeWorkspace?.role, user?.id]);
  const result = useMemo(() => { if(!base) return {data:null,error:''}; try {return {data:snapshot(base),error:''};} catch(error){return {data:null,error:error.message};} }, [base, revision]);
  return { ...result, revision, ctx: base ? {...base,locale:result.data?.preferences.locale || 'en'} : null, person, workspace:activeWorkspace };
}
