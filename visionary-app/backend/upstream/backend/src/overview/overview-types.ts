// DATA-07 — owner-scoped repositories/DTOs and paginated UID account/domain
// overview projections. Private security fields are redacted from every DTO the
// caller can read, and no single history collection is returned unbounded: each
// projection is a bounded, cursor-paginated page. These shapes mirror the
// DATA-01 SQL rows (persons, workspaces, memberships, consent_grants, command
// results, audit events) plus the Firestore account tree so the enabler maps
// onto both stores at integration.

export interface PageCursor {
  /** Opaque, stable cursor; the caller passes it back verbatim as `after`. */
  value: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: PageCursor | null; // null when there is no further page
  hasMore: boolean;
}

export type ProjectionRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

/** Identity/account overview — redacted: no tokens, no raw security fields. */
export interface AccountOverviewDto {
  uid: string;
  asOf: string;
  profile: { displayName: string | null; emailHint: string | null } | null;
  billing: { plan: string | null; currency: string | null; status: string | null } | null;
  // Private security fields NEVER appear: no refresh token, no sessionId, no
  // ip, no userAgent, no device ids, no payment identifiers.
  redacted: string[];
}

/** A workspace row in the owner-scoped list. */
export interface WorkspaceProjection {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  role: ProjectionRole;
  source: string;
  sourceVersion: string | null;
  createdByUid: string;
  createdAt: string;
  updatedAt: string;
}

/** A membership row (owner-scoped: only rows where the viewer is the member or owns the workspace). */
export interface MembershipProjection {
  id: string;
  uid: string;
  workspaceId: string;
  role: ProjectionRole;
  sourceVersion: string | null;
  purpose: string | null;
  consentVersion: string | null;
  joinedAt: string;
}

/** A consent grant row — private purpose grant, no raw policy text beyond version. */
export interface ConsentProjection {
  id: string;
  purpose: string;
  resourceId: string | null;
  consentVersion: string;
  state: 'active' | 'expired' | 'revoked';
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

/** A command result row — bounded, never an unbounded user-history document. */
export interface CommandHistoryRow {
  id: string;
  commandId: string;
  kind: string;
  workspaceId: string | null;
  status: string;
  revision: number;
  attemptedAt: string;
  committedAt: string | null;
  error: string | null;
  // resultJson is intentionally omitted from the bounded projection list;
  // a caller that needs the result fetches a single row by id.
  hasResult: boolean;
}

/** An audit event row — redacted: no ip/userAgent in the DTO. */
export interface AuditEventProjection {
  id: string;
  operation: string;
  outcome: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
}

/** Page size bounds enforced by the repository. */
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;
