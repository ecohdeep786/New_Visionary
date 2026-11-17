import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { openSessionChannel } from '@/api/firebase/sessionSignal';
import { AuthContext } from './auth-context.js';
import { appClient } from '@/api/appClient';
import { resetQueryCache } from '@/lib/query-client';
import { authErrorMessage, authFlowError } from '@/lib/authErrors';
/* The workspace service is not needed for first paint: its bootstrap is a
 * DEV-only effect and its remaining call sites are user actions, so it is
 * loaded on first use (cached promise — the same pattern as the lazy
 * Firebase SDK) instead of riding the entry graph. The seam itself is
 * DEV-conditional (FHE-20 route-table split): the static DEV replacement
 * makes the preview store's dynamic import unreachable in the production
 * build, so the browser-local store's chunk never ships at all. */
let workspaceServicePromise = null;
const workspaceService = () => {
  if (!import.meta.env.DEV) return Promise.reject(new Error('The development workspace store is not available in production.'));
  return (workspaceServicePromise ??= import('@/services/workspaceService'));
};

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
    if (!import.meta.env.DEV || !user || !user.onboarding_complete) { setWorkspaceState(null); return; }
    const refresh = () => { workspaceService().then(({ bootstrapPerson }) => {
      try { setWorkspaceState(bootstrapPerson(user)); setWorkspaceError(''); } catch (error) { setWorkspaceError(error.message); }
    }); };
    refresh();
    window.addEventListener('visionary:v2-change', refresh);
    window.addEventListener('visionary:workspace-change', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('visionary:v2-change', refresh); window.removeEventListener('visionary:workspace-change', refresh); window.removeEventListener('storage', refresh); };
  }, [user]);
  const retryWorkspace = () => {
    if (!import.meta.env.DEV || !user || !user.onboarding_complete) return;
    workspaceService().then(({ bootstrapPerson }) => {
      try { setWorkspaceState(bootstrapPerson(user)); setWorkspaceError(''); } catch (error) { setWorkspaceError(error.message); }
    });
  };
  const activeWorkspace = workspaceState?.workspaces.find(w => w.id === workspaceState.active);
  const switchWorkspace = (workspaceId) => { resetQueryCache(); workspaceService().then(({ selectWorkspace }) => selectWorkspace(user.id, workspaceId)); };
  const addRole = (role) => { workspaceService().then(({ addRole: addStoredRole }) => { const workspace = addStoredRole(user.id, role); switchWorkspace(workspace.id); }); };

  const checkUserAuth = useCallback(async (options = {}) => {
    if (options.background && activeCommands.current) return null;
    const version = ++requestVersion.current;
    if (!options.quiet) setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.me({ passive: options.passive === true });
      if (version !== requestVersion.current) return null;
      if (accountId.current !== currentUser.id) { await resetQueryCache(); setWorkspaceState(null); }
      if (version !== requestVersion.current) return null;
      if (accountId.current !== currentUser.id) ++accountEpoch.current;
      accountId.current = currentUser.id;
      if (!options.passive) verifiedAt.current = Date.now();
      setUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      if (version !== requestVersion.current) return null;
      // A background outage is not evidence that the authenticated account ended.
      if (options.passive && error.status !== 401 && accountId.current) return null;
      await resetQueryCache();
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
      const profile = await action();
      if (epoch !== accountEpoch.current || expectedId && profile?.id !== expectedId) throw authFlowError('auth/account-changed');
      if (!profile || typeof profile.id !== 'string' || typeof profile.onboarding_complete !== 'boolean' || appClient.auth.currentProfile() !== profile) throw authFlowError('auth/profile-unavailable');
      // The authenticated mutation response is the authoritative transaction result.
      // Invalidate older reads rather than making a second network request to confirm it.
      ++requestVersion.current;
      if (accountId.current !== profile.id) { await resetQueryCache(); setWorkspaceState(null); }
      if (epoch !== accountEpoch.current) throw authFlowError('auth/account-changed');
      accountId.current = profile.id; verifiedAt.current = Date.now();
      setUser(profile); setAuthError(null); setIsLoadingAuth(false); return profile;
    } finally { --activeCommands.current; }
  }, []);

  useEffect(() => {
    checkUserAuth();
    const sessionChannel = openSessionChannel();
    sessionChannel?.addEventListener('message', event => {
      if (event.data !== 'changed') return;
      ++accountEpoch.current;
      void resetQueryCache();
      void checkUserAuth({ passive: true });
    });
    let observing = false;
    const refresh = async (passive = true) => {
      if (observing || document.hidden) return;
      observing = true;
      try { await checkUserAuth({ quiet: true, background: true, passive }); }
      finally { observing = false; }
    };
    const observe = () => { if (accountId.current || !sessionChannel) refresh(true); };
    const timer = window.setInterval(observe, 30000);
    const activity = event => {
      if (event.isTrusted && accountId.current && !document.hidden && Date.now() - verifiedAt.current >= 5 * 60 * 1000) {
        verifiedAt.current = Date.now(); refresh(false);
      }
    };
    window.addEventListener('focus', observe);
    document.addEventListener('visibilitychange', observe);
    window.addEventListener('pointerdown', activity, { passive: true, capture: true }); window.addEventListener('keydown', activity, { capture: true });
    return () => { ++requestVersion.current; window.clearInterval(timer); sessionChannel?.close(); window.removeEventListener('focus', observe); document.removeEventListener('visibilitychange', observe); window.removeEventListener('pointerdown', activity, true); window.removeEventListener('keydown', activity, true); };
  }, [checkUserAuth]);

  const logout = useCallback(async (options) => {
    ++accountEpoch.current;
    ++requestVersion.current;
    await appClient.auth.logout(options);
    ++requestVersion.current;
    void resetQueryCache();
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
      confirmPhoneSignIn: (confirmation, code) => runAccountCommand(() => appClient.auth.confirmPhoneSignIn(confirmation, code), true),
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
