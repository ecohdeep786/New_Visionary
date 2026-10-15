import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './auth-context.js';
import { appClient } from '@/api/appClient';
import { queryClientInstance } from '@/lib/query-client';
import { authErrorMessage, authFlowError } from '@/lib/authErrors';
import { bootstrapPerson, selectWorkspace as selectStoredWorkspace, addRole as addStoredRole, setAgeBand as setStoredAgeBand } from '@/services/workspaceService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [workspaceState, setWorkspaceState] = useState(null);
  const [workspaceError, setWorkspaceError] = useState('');
  const requestVersion = useRef(0);
  const accountId = useRef(null);
  const accountEpoch = useRef(0), activeCommands = useRef(0), verifiedAt = useRef(0);

  useEffect(() => {
    if (!user || !user.onboarding_complete) { setWorkspaceState(null); return; }
    const refresh = () => { try { setWorkspaceState(bootstrapPerson(user)); setWorkspaceError(''); } catch (error) { setWorkspaceError(error.message); } };
    refresh();
    window.addEventListener('visionary:v2-change', refresh);
    window.addEventListener('visionary:workspace-change', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('visionary:v2-change', refresh); window.removeEventListener('visionary:workspace-change', refresh); window.removeEventListener('storage', refresh); };
  }, [user]);
  const retryWorkspace = () => {
    if (!user || !user.onboarding_complete) return;
    try { setWorkspaceState(bootstrapPerson(user)); setWorkspaceError(''); }
    catch (error) { setWorkspaceError(error.message); }
  };
  const activeWorkspace = workspaceState?.workspaces.find(w => w.id === workspaceState.active);
  const switchWorkspace = (workspaceId) => { queryClientInstance.cancelQueries(); queryClientInstance.clear(); selectStoredWorkspace(user.id, workspaceId); };
  const addRole = (role) => { const workspace = addStoredRole(user.id, role); switchWorkspace(workspace.id); };

  const checkUserAuth = useCallback(async (options = {}) => {
    if (options.background && activeCommands.current) return null;
    const version = ++requestVersion.current;
    if (!options.quiet) setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.me();
      if (version !== requestVersion.current) return null;
      if (accountId.current !== currentUser.id) { await queryClientInstance.cancelQueries(); queryClientInstance.clear(); setWorkspaceState(null); }
      if (version !== requestVersion.current) return null;
      if (accountId.current !== currentUser.id) ++accountEpoch.current;
      accountId.current = currentUser.id; verifiedAt.current = Date.now();
      setUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      if (version !== requestVersion.current) return null;
      await queryClientInstance.cancelQueries(); queryClientInstance.clear();
      if (version !== requestVersion.current) return null;
      setUser(null);
      ++accountEpoch.current;
      accountId.current = null; setWorkspaceState(null);
      setAuthError(error.status === 401 || error.message === 'Not signed in' ? null : { type: 'unavailable', message: authErrorMessage(error, 'Your account could not be loaded. Please retry.') });
      return null;
    } finally {
      if (version === requestVersion.current) setIsLoadingAuth(false);
    }
  }, []);

  const runAccountCommand = useCallback(async (action, signingIn = false) => {
    if (signingIn) { ++accountEpoch.current; ++requestVersion.current; }
    const epoch = accountEpoch.current, expectedId = signingIn ? null : accountId.current;
    if (!signingIn && !expectedId) throw authFlowError('auth/account-changed');
    ++activeCommands.current;
    try {
      const result = await action();
      const profile = appClient.auth.source === 'firebase' ? result : await appClient.auth.me();
      if (epoch !== accountEpoch.current || expectedId && profile?.id !== expectedId) throw authFlowError('auth/account-changed');
      if (!profile || typeof profile.id !== 'string' || typeof profile.onboarding_complete !== 'boolean' || appClient.auth.source === 'firebase' && appClient.auth.currentProfile() !== profile) throw authFlowError('auth/profile-unavailable');
      // The authenticated mutation response is the authoritative transaction result.
      // Invalidate older reads rather than making a second network request to confirm it.
      ++requestVersion.current;
      if (accountId.current !== profile.id) { await queryClientInstance.cancelQueries(); queryClientInstance.clear(); setWorkspaceState(null); }
      if (epoch !== accountEpoch.current) throw authFlowError('auth/account-changed');
      accountId.current = profile.id; verifiedAt.current = Date.now();
      setUser(profile); setAuthError(null); setIsLoadingAuth(false); return profile;
    } finally { --activeCommands.current; }
  }, []);

  useEffect(() => {
    checkUserAuth();
    const syncSession = (event) => {
      if (event.key === 'visionary_session_token' || event.key === 'visionary_users' || event.key === 'visionary_auth_epoch' || event.key === null) {
        ++accountEpoch.current;
        queryClientInstance.clear();
        checkUserAuth();
      }
    };
    window.addEventListener('storage', syncSession);
    window.addEventListener('visionary:auth-change', checkUserAuth);
    const refresh = () => { if (appClient.auth.source === 'firebase' && !document.hidden) checkUserAuth({ quiet: true, background: true }); };
    const activity = event => {
      if (event.isTrusted && accountId.current && !document.hidden && Date.now() - verifiedAt.current >= 5 * 60 * 1000) {
        verifiedAt.current = Date.now(); refresh();
      }
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('pointerdown', activity, { passive: true, capture: true }); window.addEventListener('keydown', activity, { capture: true });
    return () => { ++requestVersion.current; window.removeEventListener('storage', syncSession); window.removeEventListener('visionary:auth-change', checkUserAuth); window.removeEventListener('focus', refresh); window.removeEventListener('pointerdown', activity, true); window.removeEventListener('keydown', activity, true); };
  }, [checkUserAuth]);

  const logout = useCallback(async () => {
    ++accountEpoch.current;
    ++requestVersion.current;
    await appClient.auth.logout();
    ++requestVersion.current;
    queryClientInstance.clear();
    accountId.current = null; setWorkspaceState(null); setIsLoadingAuth(false); setAuthError(null);
    setUser(null);
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback(async (updates,options) => {
    return runAccountCommand(() => appClient.auth.updateMe(updates,options));
  }, [runAccountCommand]);

  return (
    <AuthContext.Provider value={{
      user: user ? { ...user, identity: activeWorkspace?.role || user.identity } : null,
      account: user,
      person: workspaceState?.person,
      workspaces: workspaceState?.workspaces || [],
      activeWorkspace,
      workspaceError,
      retryWorkspace,
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
      signInViaEmailPassword: (email, password) => runAccountCommand(() => appClient.auth.loginViaEmailPassword(email, password), true),
      signInWithProvider: provider => runAccountCommand(() => appClient.auth.loginWithProvider(provider, '/'), true),
      verifyEmail: () => runAccountCommand(() => appClient.auth.verifyEmail(), true),
      completeOnboarding: data => runAccountCommand(() => appClient.auth.completeOnboarding(data)),
      completeIntroduction: () => runAccountCommand(() => appClient.auth.completeIntroduction()),
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
