import { Timestamp, Firestore } from 'firebase-admin/firestore';

export const ACCOUNT_STORAGE_VERSION = 2;
export const LEGACY_BILLING_ACCOUNTS = 'visionary_billing_test_accounts';
export const BILLING_QUEUE = 'visionary_billing_test_queue';
export const accountPath = (uid: string) => `visionary_accounts/${uid}`;
export const billingPath = (uid: string) => `${accountPath(uid)}/billing/test`;
export const devicePath = (uid: string, id: string) => `${accountPath(uid)}/devices/${id}`;
export const accountDocument = (db: Firestore, uid: string) => db.collection('visionary_accounts').doc(uid);
export const billingDocument = (db: Firestore, uid: string) => db.collection(`${accountPath(uid)}/billing`).doc('test');
export const deviceDocument = (db: Firestore, uid: string, id: string) => db.collection(`${accountPath(uid)}/devices`).doc(id);
export const eventDocument = (db: Firestore, uid: string, id: string) => db.collection(`${accountPath(uid)}/authEvents`).doc(id);

// Device records represent a browser session, never a permanent hardware identity.
// Operational cookie hashes stay in the separate server-only session lookup.
export function deviceRecord(uid: string, id: string, session: any, previous: any = {}) {
  return { uid, deviceSessionId: id, recordVersion: 1, kind: 'browser-session',
    firstSeenAt: session.createdAt || previous.firstSeenAt || Timestamp.fromMillis(session.expires - 8 * 3600000),
    lastSeenAt: Timestamp.fromMillis(session.lastSeen), expiresAt: Timestamp.fromMillis(session.expires),
    revokedAt: session.revokedAt || null, provider: session.provider || previous.provider || 'unknown',
    observedIp: (session.ip || previous.observedIp || '').slice(0, 64), userAgent: (session.userAgent || previous.userAgent || '').slice(0, 512) };
}

export function identitySnapshot(uid: string, identity: any, now: number) {
  const provider = identity.firebase?.sign_in_provider || 'unknown';
  return { uid, email: identity.email || '', emailVerified: identity.email_verified === true,
    displayName: typeof identity.name === 'string' ? identity.name.slice(0, 120) : null,
    phoneNumber: typeof identity.phone_number === 'string' ? identity.phone_number.slice(0, 32) : null,
    photoURL: typeof identity.picture === 'string' ? identity.picture.slice(0, 2048) : null, disabled: false,
    provider, providerIds: [...new Set([...Object.keys(identity.firebase?.identities || {}).filter(key => key !== 'email'), ...(provider !== 'unknown' ? [provider] : [])])].slice(0, 10),
    lastVerifiedAt: Timestamp.fromMillis(now) };
}
