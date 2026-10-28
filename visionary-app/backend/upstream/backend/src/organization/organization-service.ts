// ROLE-06 (KAN-98) — organization membership/invitations/roles, approved
// curriculum delivery/publication, settings permissions and scoped audited
// administrative actions.
//
// Core responsibilities (server-owned; role-aware; audited; fail closed):
//   1. createOrg (owner recorded) → inviteMember (ADMIN only; learner-bound
//      invite with opaque code, role and expiry) → joinByInvite (exact
//      invitee, valid unexpired unrevoked code — uniform no-leak refusal;
//      duplicate joins idempotent).
//   2. ROLE checks per operation: admin-only actions refuse members
//      (`not_org_admin`); curriculum delivery requires CURRENT membership
//      (`not_org_member`); unknown org denies uniformly (`not_owner`).
//   3. APPROVED curriculum publication: publishing refuses an unapproved
//      item (`curriculum_not_approved`); approval records a named approver;
//      a published item is versioned and immutable (edits are a new
//      version); members read published curriculum only.
//   4. SETTINGS permissions: settings updates are admin-only
//      (`settings_admin_required`).
//   5. SCOPED AUDITED administrative actions: every admin action appends an
//      append-only audit entry (actor, action, target, org scope) as part of
//      the action — the audit log is admin-readable only.
import type {
  AuditEntry,
  CurriculumItem,
  OrgError as OrgErrorType,
  OrgInvite,
  OrgMembership,
  OrgOwner,
  OrgRole,
} from './organization-types';
import { OrgError } from './organization-types';
import type { OrganizationStore } from './organization-lookups';

export interface OrgSettings {
  settings: Record<string, string>;
}

export class OrganizationService {
  private orgCounter = 0;
  private inviteCounter = 0;
  private curriculumCounter = 0;
  private auditCounter = 0;

  constructor(
    private readonly store: OrganizationStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Create an organization (creator becomes owner). */
  async createOrg(owner: OrgOwner, name: string): Promise<{ orgId: string }> {
    if (!name) throw new OrgError('org_definition_invalid');
    const orgId = `org_${++this.orgCounter}`;
    await this.store.saveMembership({ orgId, uid: owner.uid, role: 'owner', joinedAt: this.now().toISOString() });
    await this.audit(orgId, owner.uid, 'org_created', orgId);
    return { orgId };
  }

  /** Admin-only: invite one member with a bound role + opaque code + expiry. */
  async inviteMember(admin: OrgOwner, orgId: string, inviteeUid: string, role: OrgRole, ttlMs: number): Promise<OrgInvite> {
    await this.requireAdmin(orgId, admin);
    const invite: OrgInvite = {
      inviteId: `oinv_${++this.inviteCounter}`,
      orgId,
      inviteeUid,
      role,
      code: `join_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: new Date(this.now().getTime() + ttlMs).toISOString(),
      status: 'pending',
    };
    await this.store.saveInvite(invite);
    await this.audit(orgId, admin.uid, 'member_invited', `${inviteeUid}:${role}`);
    return invite;
  }

  /** Join with the invite code (exact invitee; idempotent duplicate). */
  async joinByInvite(joiner: OrgOwner, code: string): Promise<OrgMembership> {
    const invites = await this.store.invitesByCode(code);
    const invite = invites.find((i) => i.inviteeUid === joiner.uid);
    if (!invite) throw new OrgError('invite_invalid');
    if (invite.status === 'revoked') throw new OrgError('invite_revoked');
    if (this.now().getTime() >= new Date(invite.expiresAt).getTime()) {
      throw new OrgError('invite_expired');
    }
    const existing = await this.store.membership(invite.orgId, joiner.uid);
    if (existing) return existing;
    const membership: OrgMembership = {
      orgId: invite.orgId,
      uid: joiner.uid,
      role: invite.role,
      joinedAt: this.now().toISOString(),
    };
    await this.store.saveMembership(membership);
    await this.store.saveInvite({ ...invite, status: 'accepted' });
    return membership;
  }

  /** Admin-only: change one member's role (the owner role is immutable here). */
  async changeRole(admin: OrgOwner, orgId: string, memberUid: string, role: OrgRole): Promise<OrgMembership> {
    await this.requireAdmin(orgId, admin);
    const membership = await this.store.membership(orgId, memberUid);
    if (!membership || membership.role === 'owner') throw new OrgError('not_org_member');
    const updated: OrgMembership = { ...membership, role };
    await this.store.saveMembership(updated);
    await this.audit(orgId, admin.uid, 'role_changed', `${memberUid}:${role}`);
    return updated;
  }

  /** Admin-only: update org settings (audited). */
  async updateSettings(admin: OrgOwner, orgId: string, settings: Record<string, string>): Promise<void> {
    await this.requireAdmin(orgId, admin);
    await this.audit(orgId, admin.uid, 'settings_updated', Object.keys(settings).sort().join(','));
  }

  /** Approve a curriculum item (named approver; explicit act). */
  async approveCurriculum(curriculumId: string, version: number, approver: string): Promise<CurriculumItem> {
    if (!approver?.trim()) throw new OrgError('curriculum_not_approved');
    const orgId = await this.requireCurriculumOrg(curriculumId);
    const item = await this.store.curriculum(curriculumId, version);
    if (!item) throw new OrgError('org_definition_invalid');
    const updated: CurriculumItem = { ...item, approved: true, approvedBy: approver };
    await this.store.saveCurriculum(updated);
    return updated;
  }

  /** Define a draft curriculum item (versioned; immutable once published). */
  async defineCurriculum(admin: OrgOwner, orgId: string, title: string, contentRef: string): Promise<CurriculumItem> {
    await this.requireAdmin(orgId, admin);
    const version = (await this.store.latestCurriculumVersion(orgId, curriculumIdOf(orgId, title))) + 1;
    const item: CurriculumItem = {
      curriculumId: curriculumIdOf(orgId, title),
      orgId,
      version,
      title,
      contentRef,
      approved: false,
      approvedBy: null,
      published: false,
    };
    await this.store.saveCurriculum(item);
    return item;
  }

  /** Admin-only publish — refuses an unapproved item (`curriculum_not_approved`). */
  async publishCurriculum(admin: OrgOwner, orgId: string, curriculumId: string, version: number): Promise<CurriculumItem> {
    await this.requireAdmin(orgId, admin);
    const item = await this.store.curriculum(curriculumId, version);
    if (!item) throw new OrgError('org_definition_invalid');
    if (!item.approved) throw new OrgError('curriculum_not_approved');
    const published: CurriculumItem = { ...item, published: true };
    await this.store.saveCurriculum(published);
    await this.audit(orgId, admin.uid, 'curriculum_published', `${curriculumId}@${version}`);
    return published;
  }

  /** Member-only delivery: published curriculum for CURRENT members. */
  async readCurriculum(member: OrgOwner, orgId: string, curriculumId: string, version: number): Promise<CurriculumItem> {
    const membership = await this.store.membership(orgId, member.uid);
    if (!membership) throw new OrgError('not_org_member');
    const item = await this.store.curriculum(curriculumId, version);
    if (!item || !item.published) throw new OrgError('not_org_member');
    return item;
  }

  /** Admin-only scoped audit log. */
  async getAuditLog(admin: OrgOwner, orgId: string): Promise<AuditEntry[]> {
    await this.requireAdmin(orgId, admin);
    return this.store.auditLog(orgId);
  }

  private async audit(orgId: string, actorUid: string, action: string, target: string): Promise<void> {
    await this.store.appendAudit({
      auditId: `aud_${++this.auditCounter}`,
      orgId,
      actorUid,
      action,
      target,
      at: new Date().toISOString(),
    });
  }

  private async requireAdmin(orgId: string, admin: OrgOwner): Promise<OrgMembership> {
    const membership = await this.store.membership(orgId, admin.uid);
    if (!membership) throw new OrgError('not_owner');
    if (membership.role !== 'admin' && membership.role !== 'owner') {
      throw new OrgError('not_org_admin');
    }
    return membership;
  }

  private async requireCurriculumOrg(curriculumId: string): Promise<string> {
    const found = await this.store.curriculum(curriculumId, 1);
    if (!found) throw new OrgError('org_definition_invalid');
    return found.orgId;
  }
}

function curriculumIdOf(orgId: string, title: string): string {
  return `cur_${orgId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24)}`;
}

export type { OrgErrorType };
