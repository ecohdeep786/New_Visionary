// BUILD-07 (KAN-81) — the completion domain's typed state seams. The owning
// stores (criteria, self-reviews, application evidence) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type {
  ApplicationEvidence,
  CompletionCriteria,
  ReviewOwner,
  SelfReview,
} from './completion-types';

export interface CompletionStore {
  saveCriteria(criteria: CompletionCriteria): Promise<void>;
  latestCriteria(projectId: string): Promise<CompletionCriteria | undefined>;
  appendSelfReview(review: SelfReview): Promise<void>;
  selfReviewsFor(owner: ReviewOwner, projectId: string): Promise<SelfReview[]>;
  saveEvidence(evidence: ApplicationEvidence): Promise<void>;
  byEvidenceId(evidenceId: string): Promise<ApplicationEvidence | undefined>;
}

/** Contract-true in-memory store; self-reviews append-only, evidence stateful. */
export class InMemoryCompletionStore implements CompletionStore {
  private criteria = new Map<string, CompletionCriteria>();
  private reviews: SelfReview[] = [];
  private evidence = new Map<string, ApplicationEvidence>();

  async saveCriteria(c: CompletionCriteria): Promise<void> {
    this.criteria.set(c.projectId, { ...c, items: [...c.items] });
  }

  async latestCriteria(projectId: string): Promise<CompletionCriteria | undefined> {
    const found = this.criteria.get(projectId);
    return found ? { ...found, items: [...found.items] } : undefined;
  }

  async appendSelfReview(review: SelfReview): Promise<void> {
    this.reviews = [...this.reviews, { ...review, owner: { ...review.owner }, sections: review.sections.map((s) => ({ ...s })) }];
  }

  async selfReviewsFor(owner: ReviewOwner, projectId: string): Promise<SelfReview[]> {
    return this.reviews
      .filter((r) => r.owner.uid === owner.uid && r.owner.workspaceId === owner.workspaceId && r.projectId === projectId)
      .map((r) => ({ ...r, owner: { ...r.owner }, sections: r.sections.map((s) => ({ ...s })) }))
      .sort((a, b) => a.version - b.version);
  }

  async saveEvidence(e: ApplicationEvidence): Promise<void> {
    this.evidence.set(e.evidenceId, { ...e, owner: { ...e.owner } });
  }

  async byEvidenceId(evidenceId: string): Promise<ApplicationEvidence | undefined> {
    const found = this.evidence.get(evidenceId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }
}
