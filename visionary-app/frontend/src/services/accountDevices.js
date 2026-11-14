import { createAuthTransport } from '../api/firebase/authTransport.js';

const requestDevices = createAuthTransport({ basePath: '/api/account' });
const deviceId = /^[A-Za-z0-9_-]{1,128}$/;
const statuses = ['active', 'expired', 'revoked', 'unknown'];

export async function listAccountDevices(accountId, after, request = requestDevices) {
  if (!accountId || (after && !deviceId.test(after))) throw new Error('Invalid account session request.');
  const params = new URLSearchParams({ limit: '20' });
  if (after) params.set('after', after);
  const page = await request('/devices?' + params, { accountId });
  if (page?.uid !== accountId || !Array.isArray(page.items) || page.items.length > 20 ||
    page.items.some(item => !item || typeof item.id !== 'string' || !deviceId.test(item.id) ||
      typeof item.current !== 'boolean' || !statuses.includes(item.status)) ||
    new Set(page.items.map(item => item.id)).size !== page.items.length ||
    (page.nextCursor !== null && (page.nextCursor === after || page.nextCursor !== page.items.at(-1)?.id ||
      typeof page.nextCursor !== 'string' || !deviceId.test(page.nextCursor)))) {
    throw new Error('The server returned an invalid account session list.');
  }
  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ id, current, status, lastSeenAt }) => ({
      id, current, status, lastSeenAt: typeof lastSeenAt === 'string' && Number.isFinite(Date.parse(lastSeenAt)) ? lastSeenAt : null,
    })),
  };
}
