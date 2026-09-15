import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { appClient } from '@/api/appClient';
import { queryClientInstance } from '@/lib/query-client';
import { bootstrapPerson, selectWorkspace as selectStoredWorkspace, addRole as addStoredRole, setAgeBand as setStoredAgeBand } from '@/services/workspaceService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [workspaceState, setWorkspaceState] = useState(null);
  const [workspaceError, setWorkspaceError] = useState('');

  useEffect(() => {
    if (!user || !user.onboarding_complete) { setWorkspaceState(null); return; }
    const refresh = () => { try { setWorkspaceState(bootstrapPerson(user)); setWorkspaceError(''); } catch (error) { setWorkspaceError(error.message); } };
    refresh();
    window.addEventListener('visionary:v2-change', refresh);
    window.addEventListener('visionary:workspace-change', refresh);
    return () => { window.removeEventListener('visionary:v2-change', refresh); window.removeEventListener('visionary:workspace-change', refresh); };
  }, [user]);
  const activeWorkspace = workspaceState?.workspaces.find(w => w.id === workspaceState.active);
  const switchWorkspace = (workspaceId) => { queryClientInstance.cancelQueries(); queryClientInstance.clear(); selectStoredWorkspace(user.id, workspaceId); };
  const addRole = (role) => { const workspace = addStoredRole(user.id, role); switchWorkspace(workspace.id); };

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setAuthError(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
    const syncSession = (event) => {
      if (event.key === 'visionary_session_token' || event.key === 'visionary_users' || event.key === null) {
        queryClientInstance.clear();
        checkUserAuth();
      }
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [checkUserAuth]);

  const logout = useCallback(() => {
    appClient.auth.logout();
    queryClientInstance.clear();
    setUser(null);
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback(async (updates) => {
    const updatedUser = await appClient.auth.updateMe(updates);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  return (
    <AuthContext.Provider value={{
      user: user ? { ...user, identity: activeWorkspace?.role || user.identity } : null,
      account: user,
      person: workspaceState?.person,
      workspaces: workspaceState?.workspaces || [],
      activeWorkspace,
      workspaceError,
      switchWorkspace,
      addRole,
      setAgeBand: (ageBand) => setStoredAgeBand(user.id, ageBand),
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked: !isLoadingAuth,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
