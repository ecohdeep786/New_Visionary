import { assertId, assertUid, InvitationPolicyError } from './invitation-types';

export const INSTITUTION_INVITATION_POLICY = 'institution-invitations-v1';
const MAX_APPROVAL_AGE_MS = 90 * 86400_000;

export interface InstitutionApproval {
  readonly policy: typeof INSTITUTION_INVITATION_POLICY;
  readonly workspaceId: string;
  readonly administratorUid: string;
  readonly reviewerUid: string;
  readonly evidenceRef: string;
  readonly approvedAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

function denied(): never {
  throw new InvitationPolicyError('unauthorized');
}

export function assertInstitutionReviewer(reviewerUid: string, configuredReviewers: ReadonlySet<string>) {
  assertUid(reviewerUid);
  if (!configuredReviewers.has(reviewerUid)) denied();
}

/** The caller supplies the canonical owner and database clock under the workspace lock. */
export function createInstitutionApproval(input: {
  workspaceId: string;
  administratorUid: string;
  reviewerUid: string;
  evidenceRef: string;
  expiresAt: Date;
}, canonicalOwnerUid: string, now: Date, configuredReviewers: ReadonlySet<string>): InstitutionApproval {
  assertId(input.workspaceId);
  assertUid(input.administratorUid);
  assertInstitutionReviewer(input.reviewerUid, configuredReviewers);
  const duration = input.expiresAt.getTime() - now.getTime();
  if (input.administratorUid !== canonicalOwnerUid || input.reviewerUid === canonicalOwnerUid ||
      !/^proof_[A-Za-z0-9_-]{16,100}$/.test(input.evidenceRef) ||
      !Number.isFinite(duration) || duration <= 0 || duration > MAX_APPROVAL_AGE_MS) denied();
  return { ...input, policy: INSTITUTION_INVITATION_POLICY, approvedAt: new Date(now), expiresAt: new Date(input.expiresAt), revokedAt: null };
}

/** Use on the locked approval row. A restored owner does not revive a revoked approval. */
export function assertActiveInstitutionApproval(
  approval: InstitutionApproval | null,
  workspaceId: string,
  canonicalOwnerUid: string,
  now: Date,
) {
  const time = now.getTime();
  if (!approval || approval.policy !== INSTITUTION_INVITATION_POLICY ||
      approval.workspaceId !== workspaceId || approval.administratorUid !== canonicalOwnerUid ||
      approval.revokedAt !== null || !Number.isFinite(time) ||
      !(approval.approvedAt.getTime() <= time && time < approval.expiresAt.getTime())) denied();
}
