// ROLE-06 (KAN-98) — organization membership/invitations/roles, approved
// curriculum delivery/publication, settings permissions and scoped audited
// administrative actions.
export interface OrgOwner { uid: string; workspaceId: string }

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgMembership {
  orgId: string;
  uid: string;
  role: OrgRole;
  joinedAt: string;
}

export interface OrgInvite {
  inviteId: string;
  orgId: string;
  inviteeUid: string;
  role: OrgRole;
  code: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export interface CurriculumItem {
  curriculumId: string;
  orgId: string;
  version: number;
  title: string;
  contentRef: string;
  approved: boolean;
  approvedBy: string | null;
  published: boolean;
}

export interface AuditEntry {
  auditId: string;
  orgId: string;
  actorUid: string;
  action: string;
  target: string;
  at: string;
}

export class OrgError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'not_org_admin'
      | 'not_org_member'
      | 'invite_invalid'
      | 'invite_expired'
      | 'invite_revoked'
      | 'org_definition_invalid'
      | 'curriculum_not_approved'
      | 'settings_admin_required'
  ) {
    super(code);
  }
}
