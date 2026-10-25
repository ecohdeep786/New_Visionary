// DATA-04 — invitation store contract + in-memory synthetic implementation.
// The Cloud SQL adapter (see cloud-sql-invitation-store.ts) implements the same
// contract against PostgreSQL so the module runs on GCP without logic changes.
import type { Invitation, InvitationEvent, InvitationStatus, WorkspaceRole } from './invitation-types';

export interface InvitationStore {
  createInvitation(input: {
    id: string; workspaceId: string; actorId: string; email: string; role: WorkspaceRole;
    tokenHash: string; status: InvitationStatus; expiresAt: string;
  }): Promise<Invitation>;
  findById(id: string): Promise<Invitation | null>;
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  listByWorkspace(workspaceId: string): Promise<Invitation[]>;
  update(id: string, update: Partial<Pick<Invitation, 'status' | 'acceptedBy' | 'revokedAt'>>): Promise<Invitation | null>;
  /** Verifies the caller holds at least the given role in the workspace. */
  assertMember(workspaceId: string, uid: string, minRole?: WorkspaceRole): Promise<boolean>;
  /** Records a verified membership created server-side from acceptance. */
  setMembership(workspaceId: string, uid: string, role: WorkspaceRole): Promise<void>;
  appendEvent(event: InvitationEvent): Promise<void>;
  events(invitationId: string): Promise<InvitationEvent[]>;
}

export class InMemoryInvitationStore implements InvitationStore {  readonly invitations = new Map<string, Invitation>();
  readonly history: InvitationEvent[] = [];
  /** uid -> workspaceId -> role (verified memberships only). */
  readonly memberships = new Map<string, Map<string, WorkspaceRole>>();

  async createInvitation(input: Invitation): Promise<Invitation> {
    this.invitations.set(input.id, input);
    return input;
  }
  async findById(id: string) { return this.invitations.get(id) ?? null; }
  async findByTokenHash(hash: string) {
    for (const inv of this.invitations.values()) if (inv.tokenHash === hash) return inv;
    return null;
  }
  async listByWorkspace(workspaceId: string) {
    return [...this.invitations.values()].filter((i) => i.workspaceId === workspaceId);
  }
  async update(id: string, update: Partial<Pick<Invitation, 'status' | 'acceptedBy' | 'revokedAt'>>) {
    const existing = this.invitations.get(id);
    if (!existing) return null;
    const next = { ...existing, ...update };
    this.invitations.set(id, next);
    return next;
  }
  async assertMember(workspaceId: string, uid: string, minRole?: WorkspaceRole) {
    const role = this.memberships.get(uid)?.get(workspaceId);
    if (!role) return false;
    if (!minRole) return true;
    const rank = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 }[role];
    const required = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 }[minRole];
    return rank >= required;
  }
  async setMembership(workspaceId: string, uid: string, role: WorkspaceRole) {
    let byUid = this.memberships.get(uid);
    if (!byUid) { byUid = new Map(); this.memberships.set(uid, byUid); }
    byUid.set(workspaceId, role);
  }
  async appendEvent(event: InvitationEvent) { this.history.push(event); }
  async events(invitationId: string) { return this.history.filter((e) => e.invitationId === invitationId); }
}
