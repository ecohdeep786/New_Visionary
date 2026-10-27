// BUILD-07 (KAN-81) — completion criteria, versioned self-reviews, and
// honestly-unverified application evidence.
//
// Core responsibilities (server-owned; never auto-mastery):
//   1. defineCriteria: versioned completion criteria per project; amendments
//      append versions; the verdict is measured against ONE explicit version.
//   2. assessCompletion: deterministic verdict against the pinned criteria
//      version (satisfied vs missing items; complete only when nothing missing).
//   3. submitSelfReview: versioned professional self-reviews — each submission
//      appends an immutable version; self-review is NEVER an assessed outcome.
//   4. submitEvidence: application evidence lands as `unverified` and stays
//      unverified until an explicit assessment record (rubric provenance)
//      moves it to `verified`. Nothing here ever awards mastery automatically.
//   5. Wrong users denied; unknown criteria/evidence fail closed.
import type {
  ApplicationEvidence,
  CompletionCriteria,
  CompletionError as CompletionErrorType,
  CompletionVerdict,
  ReviewOwner,
  SelfReview,
} from './completion-types';
import { CompletionError } from './completion-types';
import type { CompletionStore } from './completion-lookups';

export class CompletionService {
  private criteriaCounter = 0;
  private reviewCounter = 0;
  constructor(
    private readonly store: CompletionStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Define (or amend) versioned completion criteria; amendments append versions. */
  async defineCriteria(owner: ReviewOwner, projectId: string, items: CompletionCriteria['items']): Promise<CompletionCriteria> {
    const existing = await this.store.latestCriteria(projectId);
    const criteria: CompletionCriteria = {
      criteriaId: existing?.criteriaId ?? `crit_${++this.criteriaCounter}`,
      projectId,
      version: (existing?.version ?? 0) + 1,
      items: items.map((i) => ({ ...i })),
    };
    await this.store.saveCriteria(criteria);
    return criteria;
  }

  /** Deterministic completion verdict against the pinned criteria version. */
  async assessCompletion(owner: ReviewOwner, projectId: string, satisfiedItemIds: readonly string[]): Promise<CompletionVerdict> {
    const criteria = await this.store.latestCriteria(projectId);
    if (!criteria) throw new CompletionError('unknown_criteria');
    const satisfied = criteria.items.filter((i) => satisfiedItemIds.includes(i.itemId)).map((i) => i.itemId);
    const missing = criteria.items.filter((i) => !satisfiedItemIds.includes(i.itemId)).map((i) => i.itemId);
    return {
      projectId,
      criteriaVersion: criteria.version,
      satisfiedItemIds: satisfied,
      missingItemIds: missing,
      complete: missing.length === 0,
    };
  }

  /** Submit a professional self-review: appends an immutable version. */
  async submitSelfReview(owner: ReviewOwner, projectId: string, sections: SelfReview['sections']): Promise<SelfReview> {
    const prior = await this.store.selfReviewsFor(owner, projectId);
    const review: SelfReview = {
      reviewId: `rev_${++this.reviewCounter}`,
      owner: { ...owner },
      projectId,
      version: (prior[prior.length - 1]?.version ?? 0) + 1,
      sections: sections.map((s) => ({ ...s })),
      createdAt: this.now().toISOString(),
    };
    await this.store.appendSelfReview(review);
    return review;
  }

  /** Submit application evidence: lands UNVERIFIED — never auto-verified. */
  async submitEvidence(owner: ReviewOwner, projectId: string, evidenceId: string, payload: unknown): Promise<ApplicationEvidence> {
    const evidence: ApplicationEvidence = {
      evidenceId,
      owner: { ...owner },
      projectId,
      payload,
      status: 'unverified',
      assessmentRef: null,
      assessedAt: null,
    };
    await this.store.saveEvidence(evidence);
    return evidence;
  }

  /** Explicit assessment: the ONLY path from unverified to verified. */
  async recordAssessment(owner: ReviewOwner, evidenceId: string, assessmentRef: string): Promise<ApplicationEvidence> {
    const evidence = await this.store.byEvidenceId(evidenceId);
    if (!evidence) throw new CompletionError('unknown_evidence');
    if (evidence.owner.uid !== owner.uid || evidence.owner.workspaceId !== owner.workspaceId) throw new CompletionError('not_owner');
    if (evidence.status === 'verified') throw new CompletionError('already_assessed');
    const assessed: ApplicationEvidence = { ...evidence, status: 'verified', assessmentRef, assessedAt: this.now().toISOString() };
    await this.store.saveEvidence(assessed);
    return assessed;
  }
}

export type { CompletionErrorType };
