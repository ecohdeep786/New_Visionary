import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { createConnectedWorkspaceContext } from '@/services/connectedWorkspaceContext';

/**
 * Production workspace context (FHE-05). Mounted by the connected composition
 * root inside the dashboard shell. All state is derived from server-owned
 * records through connectedWorkspaceContext; nothing is read from or written
 * to a browser-local store. The active workspace is an ephemeral client
 * preference validated against the server list on every load.
 */
const ConnectedWorkspaceContext = createContext(null);

const languageCodes = { English: 'en', Hindi: 'hi', Bengali: 'bn', বাংলা: 'bn' };

function accountLocale(account) {
	return languageCodes[account?.preferred_language] || 'en';
}

const initial = { status: 'loading', workspaces: [], activeId: null, error: '' };

function errorCopy(error) {
	if (error?.status === 401) return 'Your session has ended. Sign in again to continue.';
	if (error?.status === 403) return 'Your workspaces could not be opened with this account. Sign out and back in, then retry.';
	if (error?.status === 503 || error?.status === 504 || error?.status === 404) return 'Workspace setup is unavailable right now. Your saved records are kept; try again shortly.';
	return 'Your workspaces could not be loaded. Check your connection and retry.';
}

export function ConnectedWorkspaceProvider({ children }) {
	const { account, isAuthenticated } = useAuth();
	const accountId = isAuthenticated && account?.id ? account.id : null;
	const [state, setState] = useState(initial);
	const mounted = useRef(true);
	const context = useMemo(() => accountId
		? createConnectedWorkspaceContext({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null })
		: null, [accountId]);
	useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
	const load = useCallback(async () => {
		if (!context) return;
		setState(initial);
		try {
			const { workspaces, personal } = await context.load();
			if (!mounted.current) return;
			setState({ status: 'ready', workspaces, activeId: personal.id, error: '' });
		} catch (error) {
			if (!mounted.current) return;
			setState({ status: 'unavailable', workspaces: [], activeId: null, error: errorCopy(error) });
		}
	}, [context]);
	useEffect(() => {
		if (context) load();
		else setState(initial);
		return () => context?.reset();
	}, [context, load]);
	const active = useMemo(() => state.workspaces.find(row => row.id === state.activeId) || null, [state.workspaces, state.activeId]);
	const locale = accountLocale(account);
	const selectWorkspace = useCallback(id => {
		setState(current => {
			const next = current.workspaces.some(row => row.id === id) ? id : current.activeId;
			return next === current.activeId ? current : { ...current, activeId: next };
		});
	}, []);
	const value = useMemo(() => {
		const ctx = state.status === 'ready' && active && accountId
			? { personId: accountId, workspaceId: active.id, role: account?.identity, locale }
			: null;
		return {
			// Composition-root API
			status: state.status,
			workspaces: state.workspaces,
			active,
			selectWorkspace,
			retry: load,
			error: state.error,
			// useWorkspace projection (same shape as the development preview)
			ctx,
			data: { preferences: { interfaceLocale: locale, locale } },
			person: null,
			workspace: active,
		};
	}, [state, active, accountId, account?.identity, locale, selectWorkspace, load]);
	return <ConnectedWorkspaceContext.Provider value={value}>{children}</ConnectedWorkspaceContext.Provider>;
}

/** The connected projection, or the preview's no-workspace shape when no provider is mounted. */
export function useConnectedWorkspace() {
	const value = useContext(ConnectedWorkspaceContext);
	if (!value) return { data: null, error: '', ctx: null, revision: 0, refresh: () => {}, person: null, workspace: null };
	return value;
}
