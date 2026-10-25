// DATA-04 — invitation lifecycle service.
//
// The permission model is explicit and server-enforced. A role picker, plain
// email match, guessed invitation ID, or browser record never establishes a
// membership. A membership is only created server-side from an accepted,
// unexpired, one-time invite token that a verified actor with OWNER/ADMIN
// authority over the workspace issued. Acceptance binds the authenticated
// accept-uid (server-derived), never the delivery email.
import { createHash, randomBytes } from 'node:crypto';
import type { Invitation, InvitationEvent, InvitationDraft, IssueResult, InvitationView, WorkspaceRole } from './invitation-types';
import type { InvitationStore } from './invitation-store';

export class InvitationPolicyError extends Error {
  constructor(public readonly code: 'unauthorized' | 'not_found' | 'already_accepted' | 'expired' | 'revoked' | 'invalid_token' | 'invited_role') {
    super(code);
  }
}

const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days, bounded
const MAX_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
const ROLE_RANK: Record<WorkspaceRole, number> = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
const ISSUE_ROLES: WorkspaceRole[] = ['MEMBER', 'ADMIN']; // a guest cannot be issued a privilege; owner only via provisioning

export interface InvitationServiceOptions {
  /** Injectable clock so tests can fix time. */
  now?: () => Date;
  tokenBytes?: number;
}

export class InvitationService {
  private readonly now: () => Date;
  private readonly tokenBytes: number;
  private readonly events: string[] = [];

  constructor(private readonly store: InvitationStore, options: InvitationServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.tokenBytes = options.tokenBytes ?? 32;
  }

  /** History of system events raised, kept for at-a-glance verification. */
  history() { return this.events.slice(); }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private randomToken() { return randomBytes(this.tokenBytes).toString('base64url'); }
  private when() { return this.now().toISOString(); }

  private rgb(role: WorkspaceRole) { return Math.max(0, Math.min(3, ROLE_RANK[role] ?? 0)); }

  private async requireAuthority(workspaceId: string, uid: string, minRole: WorkspaceRole) {
    const ok = await this.store.assertMember(workspaceId, uid, minRole);
    if (!ok) throw new InvitationPolicyError('unauthorized');
  }

  private toView(inv: Invitation): InvitationView {
    return {
      id: inv.id, workspaceId: inv.workspaceId, email: inv.email, role: inv.role,
      status: inv.status, issuedAt: inv.issuedAt, acceptedBy: inv.acceptedBy,
      expiresAt: inv.expiresAt, revokedAt: inv.revokedAt,
    };
  }

  private undoExpired(inv: Invitation): Invitation | null {
    // A still-valid token whose expiry passed is treated as expired on read.
    if (inv.status === 'pending' && new Date(inv.expiresAt).getTime() <= this.now().getTime()) {
      return { ...inv, status: 'expired' };
    }
    return inv;
  }

  /** Issue an invite. Only a verified OWNER/ADMIN of the workspace may do so. */
  async invite(actorUid: string, workspaceId: string, draft: InvitationDraft): Promise<IssueResult> {
    await this.requireAuthority(workspaceId, actorUid, 'ADMIN');
    const email = (draft.email ?? '').trim().toLowerCase();
    if (!email) throw new InvitationPolicyError('invited_role');
    const role = draft.role;
    if (!ISSUE_ROLES.includes(role)) throw new InvitationPolicyError('invited_role');

    const id = `inv_${this.hash([workspaceId, email, this.when()].join('|')).slice(0, 24)}`;
    const raw = this.randomToken();
    const tokenHash = this.hash(raw);
    const expirySeconds = Math.max(60, Math.min(draft.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS, MAX_EXPIRY_SECONDS));
    const at = this.when();
    const expiresAt = new Date(this.now().getTime() + expirySeconds * 1000).toISOString();

    const inv: Invitation = {
      id, workspaceId, actorId: actorUid, email, role, tokenHash,
      status: 'pending', issuedAt: at, acceptedBy: null, expiresAt, revokedAt: null,
    };
    await this.store.createInvitation(inv);
    await this.store.appendEvent({ id: `e_${this.when()}_${id}`, invitationId: id, workspaceId, from: 'pending', to: 'pending', actorId: actorUid, happenedAt: at });
    this.events.push(`issued ${id}`);
    return { invitationId: id, token: raw, expiresAt };
  }

  /** Accept an invite by presenting its one-time token. The authenticated uid is the membership owner. */
  async accept(acceptUid: string, token: string): Promise<InvitationView> {
    const tokenHash = this.hash(token);
    const stored = await this.store.findByTokenHash(tokenHash);
    if (!stored) throw new InvitationPolicyError('invalid_token');
    const inv = this.undoExpired(stored);
    if (inv.status === 'expired') throw new InvitationPolicyError('expired');
    if (inv.status !== 'pending') throw new InvitationPolicyError('already_accepted'); // covers revoked too
    if (inv.revokedAt) throw new InvitationPolicyError('revoked');

    const at = this.when();
    const accepted = { ...inv, status: 'accepted' as const, acceptedBy: acceptUid };
    await this.store.update(inv.id, { status: 'accepted', acceptedBy: acceptUid });
    // Record the verified membership: the accept-uid now holds the invited role.
    await this.store.setMembership(inv.workspaceId, acceptUid, inv.role);
    await this.store.appendEvent({ id: `e_${at}_${inv.id}`, invitationId: inv.id, workspaceId: inv.workspaceId, from: inv.status, to: 'accepted', actorId: acceptUid, happenedAt: at });
    this.events.push(`accepted ${inv.id}`);
    return this.toView(accepted);
  }

  /** Revoke a pending invite. Only a verified OWNER/ADMIN may revoke. */
  async revoke(actorUid: string, invitationId: string): Promise<InvitationView> {
    const stored = await this.store.findById(invitationId);
    if (!stored) throw new InvitationPolicyError('not_found');
    await this.requireAuthority(stored.workspaceId, actorUid, 'ADMIN');
    if (stored.status !== 'pending') throw new InvitationPolicyError('already_accepted');
    const at = this.when();
    const revoked = { ...stored, status: 'revoked' as const, revokedAt: at };
    await this.store.update(stored.id, { status: 'revoked', revokedAt: at });
    await this.store.appendEvent({ id: `e_${at}_${stored.id}`, invitationId: stored.id, workspaceId: stored.workspaceId, from: stored.status, to: 'revoked', actorId: actorUid, happenedAt: at });
    this.events.push(`revoked ${stored.id}`);
    return this.toView(revoked);
  }

  /** List invites for a workspace. Only a verified member may list. */
  async list(actorUid: string, workspaceId: string): Promise<InvitationView[]> {
    await this.requireAuthority(workspaceId, actorUid, 'MEMBER');
    const rows = await this.store.listByWorkspace(workspaceId);
    return rows.map((i) => this.toView(this.undoExpired(i)));
  }

  /** Append-only lifecycle history for an invite. Verified member only. */
  async track(actorUid: string, invitationId: string): Promise<InvitationEvent[]> {
    const stored = await this.store.findById(invitationId);
    if (!stored) throw new InvitationPolicyError('not_found');
    await this.requireAuthority(stored.workspaceId, actorUid, 'MEMBER');
    return this.store.events(invitationId);
  }

  /** Whether the actor currently holds a workspace membership of at least minRole. */
  async role(workspaceId: string, uid: string, minRole: WorkspaceRole): Promise<boolean> {
    return this.store.assertMember(workspaceId, uid, minRole);
  }
}
