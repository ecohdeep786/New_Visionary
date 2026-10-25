// DATA-05 — consent/share purpose, expiry/revocation and policy versions.
//
// A consent grant is only created by the server for the authenticated uid, on an
// explicit purpose and policy version. Revocation is effective immediately and
// must block pending jobs, caches and newly requested downloads. Cache is not
// authority; time alone never revives a grant.
export type ConsentState = 'active' | 'expired' | 'revoked';
export type ConsentPurpose = 'learning_sessions' | 'document_sharing' | 'downloads' | 'model_context' | 'telemetry_optional';

export interface ConsentGrant {
  id: string;
  uid: string;               // the consenting data subject (server-derived)
  purpose: ConsentPurpose;
  resourceId: string | null; // null = whole account
  consentVersion: string;    // policy document version, required to grant
  grantedAt: string;
  expiresAt: string | null;  // null = indefinite (always bounded at grant time policy)
  revokedAt: string | null;
  state: ConsentState;
}

export interface ShareGrant {
  id: string;
  uid: string;           // sharing subject (owner of resource)
  resourceType: string;  // 'document' | 'summary' | 'report'
  resourceId: string;
  grantedToUid: string;  // verified recipient uid
  purpose: ConsentPurpose;
  scope: string;         // bounded purpose description
  consentVersion: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  state: ConsentState;
}

export interface ConsentEvent {
  id: string;
  grantId: string;
  uid: string;
  from: ConsentState;
  to: ConsentState;
  purpose: ConsentPurpose;
  resourceId: string | null;
  consentVersion: string;
  actorId: string;
  reason: 'grant' | 'expiry' | 'revocation' | 'admin';
  happenedAt: string;
}

export interface ConsentCommand {
  id: string; // caller-supplied idempotency key
  uid: string;
  purpose: ConsentPurpose;
  resourceId?: string;
  consentVersion: string;
  expiresInSeconds?: number;
}

export type ConsentVersion = string; // semantic policy version

export interface ConsentShareCommand {
  id: string;             // caller-supplied idempotency key
  uid: string;
  resourceType: string;
  resourceId: string;
  grantedToUid: string;   // verified recipient uid
  purpose: ConsentPurpose;
  scope: string;
  consentVersion: string;
  expiresInSeconds?: number;
}

export interface ConsentView {
  id: string;
  purpose: ConsentPurpose;
  resourceId: string | null;
  consentVersion: string;
  state: ConsentState;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface RevocationOutcome {
  grantId: string;
  state: 'revoked';
  blockedPendingJobs: number;
  flushedCaches: number;
  blockedDownloads: number;
}
