import type { AccountOverviewDto, WorkspaceProjection, MembershipProjection, ConsentProjection, CommandHistoryRow, AuditEventProjection } from './overview-types';

function scalarFields<T extends object>(row: T): T {
  if (Object.values(row).some(value => value !== null &&
      !['string', 'boolean', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error('invalid_projection');
  }
  return row;
}

// Runtime allowlists, not TypeScript annotations: owning stores can return extra
// columns after a schema change. Never forward those columns to a browser.
export const accountProjection = (row: Omit<AccountOverviewDto, 'uid' | 'asOf'>) => ({
  profile: row.profile ? scalarFields({ displayName: row.profile.displayName, emailHint: row.profile.emailHint }) : null,
  billing: row.billing ? scalarFields({ plan: row.billing.plan, currency: row.billing.currency, status: row.billing.status }) : null,
  redacted: ['refresh_token', 'session_id', 'aadhaar', 'networkMetadata', 'paymentIdentifiers'],
});
export const workspaceProjection = (r: WorkspaceProjection): WorkspaceProjection => scalarFields({
  id: r.id, name: r.name, slug: r.slug, isPersonal: r.isPersonal, role: r.role,
  source: r.source, sourceVersion: r.sourceVersion, createdByUid: r.createdByUid,
  createdAt: r.createdAt, updatedAt: r.updatedAt,
});
export const membershipProjection = (r: MembershipProjection): MembershipProjection => scalarFields({
  id: r.id, uid: r.uid, workspaceId: r.workspaceId, role: r.role,
  sourceVersion: r.sourceVersion, purpose: r.purpose, consentVersion: r.consentVersion, joinedAt: r.joinedAt,
});
export const consentProjection = (r: ConsentProjection): ConsentProjection => scalarFields({
  id: r.id, purpose: r.purpose, resourceId: r.resourceId, consentVersion: r.consentVersion,
  state: r.state, grantedAt: r.grantedAt, expiresAt: r.expiresAt, revokedAt: r.revokedAt,
});
export const commandProjection = (r: CommandHistoryRow): CommandHistoryRow => scalarFields({
  id: r.id, commandId: r.commandId, kind: r.kind, workspaceId: r.workspaceId, status: r.status,
  revision: r.revision, attemptedAt: r.attemptedAt, committedAt: r.committedAt,
  // Error details can contain private inputs. Only a bounded machine code is public.
  error: r.error === null ? null : /^[A-Za-z0-9_-]{1,64}$/.test(r.error) ? r.error : 'unavailable', hasResult: r.hasResult,
});
export const auditProjection = (r: AuditEventProjection): AuditEventProjection => scalarFields({
  id: r.id, operation: r.operation, outcome: r.outcome, resourceType: r.resourceType,
  resourceId: r.resourceId, createdAt: r.createdAt,
});
