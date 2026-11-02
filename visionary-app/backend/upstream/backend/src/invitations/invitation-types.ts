import { createHash } from 'node:crypto';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export class InvitationPolicyError extends Error {
  constructor(readonly code: 'invalid_command' | 'unauthorized' | 'invalid_token' | 'not_found' | 'expired' | 'revoked' | 'already_accepted' | 'conflict' | 'unavailable') { super(code); }
}
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');
export const rank = (role: string) => ({ GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 }[role] ?? -1);
export function assertUid(uid: unknown): asserts uid is string {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid)) throw new InvitationPolicyError('unauthorized');
}
export function assertId(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new InvitationPolicyError('invalid_command');
}
export interface InvitationView {
  id: string; workspaceId: string; email: string; role: WorkspaceRole;
  status: string; issuedAt: string; expiresAt: string; acceptedBy: string | null;
  revokedAt: string | null; replay: boolean; membershipRole?: WorkspaceRole;
}
export interface InvitationIssue {
  id: string; workspaceId: string; actorUid: string; email: string;
  role: 'MEMBER' | 'ADMIN'; tokenHash: string; at: Date; expiresAt: Date;
}
/** Owning-store operations, never separate consume/grant/history mutations. */
export interface InvitationStore {
  issue(input: InvitationIssue): Promise<InvitationView>;
  accept(uid: string, tokenHash: string, at: Date): Promise<InvitationView>;
  revoke(uid: string, id: string, at: Date): Promise<InvitationView>;
  list(uid: string, workspaceId: string): Promise<InvitationView[]>;
  track(uid: string, workspaceId: string, id: string): Promise<unknown[]>;
}
