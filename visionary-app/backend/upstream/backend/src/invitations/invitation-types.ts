// DATA-04 — invitations / acceptance / verified roles / lifecycle types.
//
// A role picker, email match, guessed ID or browser record never establishes
// permission. Membership is only created server-side from an accepted,
// unexpired, unique invite token produced by a verified actor with authority
// over the workspace.
export type InvitationStatus = 'pending' | 'issued' | 'accepted' | 'revoked' | 'expired';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface Invitation {
  id: string;
  workspaceId: string;
  actorId: string;      // verified uid that issued the invite
  email: string;        // delivery hint only — never the permission bound
  role: WorkspaceRole;
  tokenHash: string;    // server-verified one-time proof; not returned to caller
  status: InvitationStatus;
  issuedAt: string | null;
  acceptedBy: string | null;
  expiresAt: string;
  revokedAt: string | null;
}

/** Append-only lifecycle history. */
export interface InvitationEvent {
  id: string;
  invitationId: string;
  workspaceId: string;
  from: InvitationStatus;
  to: InvitationStatus;
  actorId: string;
  happenedAt: string;
}

export interface InvitationDraft {
  email: string;
  role: WorkspaceRole;
  expiresInSeconds?: number; // bounded default 7 days
}

export interface IssueResult {
  invitationId: string;
  token: string; // one-time use; only shown once at issue
  expiresAt: string;
}

export interface InvitationView {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  issuedAt: string | null;
  acceptedBy: string | null;
  expiresAt: string;
  revokedAt: string | null;
}
