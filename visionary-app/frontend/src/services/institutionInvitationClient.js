import { createAuthTransport } from '../api/firebase/authTransport.js';

export function createInstitutionInvitationClient({
  getAccountId,
  request = createAuthTransport({ basePath: '/api/account/invitations' }),
}) {
  return {
    async accept(token) {
      const accountId = getAccountId();
      const checkAccount = () => {
        if (!accountId || getAccountId() !== accountId) {
          throw Object.assign(new Error('The signed-in account changed.'), { status: 409 });
        }
      };
      checkAccount();
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        throw Object.assign(new Error('Enter a valid invitation code.'), { status: 400 });
      }
      const result = await request('/accept', { method: 'POST', accountId, beforeSend: checkAccount, body: { token } });
      checkAccount();
      if (typeof result?.workspaceId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(result.workspaceId) ||
          !['ADMIN', 'MEMBER', 'GUEST'].includes(result.role) || typeof result.replay !== 'boolean') {
        throw Object.assign(new Error('The invitation receipt could not be verified.'), { status: 503 });
      }
      return { workspaceId: result.workspaceId, role: result.role, replay: result.replay };
    },
  };
}
