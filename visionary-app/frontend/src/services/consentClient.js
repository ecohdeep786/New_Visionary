import { createAuthTransport } from '../api/firebase/authTransport.js';
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const date = value => typeof value === 'string' && value.length <= 30 && Number.isFinite(Date.parse(value));
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
export function createConsentClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/privacy/consents' }) }) {
  async function call(path, options = {}) {
    const uid = getAccountId();
    const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed.'), { status: 409 }); };
    check(); const result = await request(path, { ...options, accountId: uid, beforeSend: check }); check();
    if (result?.version !== 1 || result.uid !== uid) throw Error('The consent receipt could not be verified.');
    return result;
  }
  return {
    async list(cursor) {
      if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 512)) throw Error('Invalid consent page.');
      const value = await call(cursor ? `?cursor=${encodeURIComponent(cursor)}` : '');
      if (typeof value.available !== 'boolean' || !Array.isArray(value.grants) || value.grants.length > 20 ||
          !(value.nextCursor === null || typeof value.nextCursor === 'string' && value.nextCursor.length <= 512) ||
          !value.available && (value.grants.length || value.nextCursor !== null) ||
          value.grants.some(row => !id(row.id) || !text(row.purpose) || !text(row.consentVersion) ||
            !(row.resourceId === null || text(row.resourceId)) || !['active', 'pending', 'expired', 'revoked'].includes(row.state) ||
            !date(row.grantedAt) || !(row.expiresAt === null || date(row.expiresAt)) || !(row.revokedAt === null || date(row.revokedAt)) ||
            (row.state === 'revoked') !== (row.revokedAt !== null))) throw Error('The consent page could not be verified.');
      return value;
    },
    async revoke(grantId) {
      if (!id(grantId)) throw Error('Invalid consent reference.');
      const value = await call('/revoke', { method: 'POST', body: { grantId } });
      if (value.id !== grantId || !date(value.revokedAt)) throw Error('The revocation receipt could not be verified.');
      return value;
    },
  };
}
