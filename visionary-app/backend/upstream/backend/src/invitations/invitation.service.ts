import { randomBytes, randomUUID } from 'node:crypto';
import { assertId, assertUid, InvitationPolicyError, InvitationStore, tokenDigest } from './invitation-types';
export { InvitationPolicyError } from './invitation-types';
/** The caller supplies a server-authenticated UID. This service never provisions
 * identities, activates children or establishes institution/guardian proof. */
export class InvitationService {
  constructor(private readonly store: InvitationStore, private readonly now: () => Date = () => new Date()) {}
  async invite(actorUid: string, workspaceId: string, input: unknown) {
    assertUid(actorUid); assertId(workspaceId);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InvitationPolicyError('invalid_command');
    const d = input as Record<string, unknown>;
    if (Object.keys(d).some(k => !['email', 'role', 'expiresInSeconds'].includes(k)) ||
        typeof d.email !== 'string' || d.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ||
        !['MEMBER', 'ADMIN'].includes(d.role as string)) throw new InvitationPolicyError('invalid_command');
    const seconds = d.expiresInSeconds ?? 7 * 86400;
    if (typeof seconds !== 'number' || !Number.isInteger(seconds) || seconds < 60 || seconds > 30 * 86400) throw new InvitationPolicyError('invalid_command');
    const token = randomBytes(32).toString('base64url'), at = this.now();
    const view = await this.store.issue({ id: 'inv_' + randomUUID().replaceAll('-', ''), actorUid, workspaceId,
      email: d.email.trim().toLowerCase(), role: d.role as 'MEMBER' | 'ADMIN', tokenHash: tokenDigest(token), at, expiresAt: new Date(at.getTime() + seconds * 1000) });
    // Only this initial response contains the bearer token; no receipt/history stores it.
    return { invitationId: view.id, token, expiresAt: view.expiresAt };
  }
  async accept(uid: string, token: unknown) {
    assertUid(uid);
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new InvitationPolicyError('invalid_token');
    return this.store.accept(uid, tokenDigest(token), this.now());
  }
  async revoke(uid: string, id: string) { assertUid(uid); assertId(id); return this.store.revoke(uid, id, this.now()); }
  async list(uid: string, workspaceId: string) { assertUid(uid); assertId(workspaceId); return this.store.list(uid, workspaceId); }
  async track(uid: string, workspaceId: string, id: string) { assertUid(uid); assertId(workspaceId); assertId(id); return this.store.track(uid, workspaceId, id); }
}
