import { createConnectedWorkspaces } from './connectedWorkspaces.js';

const readbackPages = 5;

/**
 * Production workspace-context orchestration (FHE-05/FHE-06).
 *
 * The connected workspace context is derived only from server-owned records:
 * the owner-scoped overview list, the idempotent personal-workspace provision
 * and the same readback confirmation the Workspaces page already uses. No
 * browser-local store participates; membership, role and identity come back
 * from the server on every load, so a stale or revoked membership can never
 * be reconstructed locally.
 *
 * The selection returned here is an ephemeral client preference (which server
 * workspace the shell hosts). Authority always stays with the list: a
 * selected id that is no longer in the account's server list falls back to
 * the personal workspace instead of being trusted.
 */
export function createConnectedWorkspaceContext({ getAccountId, workspaces = createConnectedWorkspaces(getAccountId) } = {}) {
	// The provision command ID is held across retries of the same uncertain
	// write and cleared once the server has confirmed the workspace in a
	// readback — the same replay-safe pattern the Workspaces page uses.
	let provisioningCommand = null;

	async function collectPages(accountId, check) {
		const items = [];
		let cursor = null;
		for (let count = 0; count < readbackPages; count += 1) {
			const page = await workspaces.list(accountId, cursor);
			check();
			items.push(...page.items);
			if (!page.next) return items;
			cursor = page.next;
		}
		return items;
	}

	async function load() {
		const accountId = getAccountId();
		if (!accountId) throw Object.assign(new Error('Your session has ended. Sign in again.'), { status: 401 });
		const check = () => {
			if (!accountId || getAccountId() !== accountId) {
				throw Object.assign(new Error('Your signed-in account changed.'), { status: 401 });
			}
		};
		check();
		let items;
		try {
			items = await collectPages(accountId, check);
		} catch (error) {
			// A brand-new account may be refused by the overview until provisioning
			// creates its person row; only the provisioning endpoint decides whether
			// this account may be set up (same law as the Workspaces page).
			if (error?.status !== 403) throw error;
			items = null;
		}
		let personal = items ? items.find(row => row.isPersonal && row.role === 'OWNER') || null : null;
		if (!personal) {
			provisioningCommand ??= crypto.randomUUID();
			const workspaceId = await workspaces.provision(accountId, provisioningCommand);
			check();
			const confirmed = await workspaces.find(accountId, workspaceId, { personal: true });
			check();
			if (!confirmed) throw Object.assign(new Error('Your workspace is being prepared. Refresh in a moment.'), { status: 503 });
			personal = confirmed;
			provisioningCommand = null;
			items = await collectPages(accountId, check);
		}
		return { workspaces: items, personal };
	}

	function select(id, context) {
		if (!context?.workspaces?.some(row => row.id === id)) {
			throw new Error('That workspace is not currently part of your account.');
		}
		return id;
	}

	function reset() { provisioningCommand = null; }

	return { load, select, reset };
}
