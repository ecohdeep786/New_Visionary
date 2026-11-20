import { createAuthTransport } from '../api/firebase/authTransport.js';

const workspaceId = /^[A-Za-z0-9_-]{1,128}$/;
const request = createAuthTransport({ basePath: '/api' });
const roles = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];
const readbackPages = 5;

export function createConnectedWorkspaces(getAccountId, transport = request) {
  async function call(accountId, path, options) {
    const check = () => {
      if (!accountId || getAccountId() !== accountId) {
        throw Object.assign(new Error('Your signed-in account changed.'), { status: 401 });
      }
    };
    check();
    const response = await transport(path, { ...options, accountId, beforeSend: check });
    check();
    return response;
  }

  async function list(accountId, after) {
    const params = new URLSearchParams({ limit: '20' });
    if (after) params.set('after', after);
    const page = await call(accountId, '/overview/workspaces?' + params);
    const next = page?.nextCursor?.value;
    if (!Array.isArray(page?.items) || page.items.length > 20 ||
      typeof page.hasMore !== 'boolean' || (page.hasMore
        ? typeof next !== 'string' || !workspaceId.test(next) || next === after
        : page.nextCursor !== null) ||
      page.items.some(row => typeof row?.id !== 'string' || !workspaceId.test(row.id) ||
        typeof row.name !== 'string' || !row.name.trim() || typeof row.isPersonal !== 'boolean' || !roles.includes(row.role)) ||
      new Set(page.items.map(row => row.id)).size !== page.items.length) {
      throw new Error('Workspace records could not be confirmed.');
    }
    return {
      next: page.hasMore ? next : null,
      items: page.items.map(({ id, name, isPersonal, role }) => ({ id, name, isPersonal, role })),
    };
  }

  async function find(accountId, id, { personal = false } = {}) {
    let cursor = null;
    for (let count = 0; count < readbackPages; count += 1) {
      const page = await list(accountId, cursor);
      const match = page.items.find(row => row.id === id && (!personal || row.isPersonal && row.role === 'OWNER'));
      if (match) return match;
      if (!page.next) break;
      cursor = page.next;
    }
    return null;
  }

  return {
    list,
    find,

    async acceptInvitation(accountId, token) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Enter a valid invitation code.');
      const result = await call(accountId, '/account/invitations/accept', {
        method: 'POST', body: { token },
      });
      if (typeof result?.workspaceId !== 'string' || !workspaceId.test(result.workspaceId) ||
        typeof result.invitationId !== 'string' || !workspaceId.test(result.invitationId) ||
        typeof result.replay !== 'boolean' || !roles.includes(result.role)) {
        throw new Error('The invitation outcome could not be confirmed.');
      }
      return result.workspaceId;
    },

    async provision(accountId, commandId) {
      const receipt = await call(accountId, '/account/workspace/provision', {
        method: 'POST',
        body: { commandId, payload: { source: 'manual' } },
      });
      if (typeof receipt?.personalWorkspaceId !== 'string' || !workspaceId.test(receipt.personalWorkspaceId)) {
        throw new Error('Workspace setup could not be confirmed.');
      }
      return receipt.personalWorkspaceId;
    },
  };
}
