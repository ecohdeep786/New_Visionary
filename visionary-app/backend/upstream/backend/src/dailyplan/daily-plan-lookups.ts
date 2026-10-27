// LEARN-04 (KAN-70) — the daily-plan domain's typed state seams. The owning
// stores (goals, plans, reviews; catalog eligibility; projection review-due;
// the immutable evidence ledger) implement these at integration; the in-memory
// implementation is contract-true and fails closed.
import type { DailyPlan, LearningGoal, PlanOwner, ScheduledReview } from './daily-plan-types';

export interface PlanStore {
  saveGoal(goal: LearningGoal): Promise<void>;
  goalsFor(owner: PlanOwner): Promise<LearningGoal[]>;
  savePlan(plan: DailyPlan): Promise<void>;
  plansFor(owner: PlanOwner, planDate: string): Promise<DailyPlan[]>;
  saveReview(review: ScheduledReview): Promise<void>;
  reviewsFor(owner: PlanOwner): Promise<ScheduledReview[]>;
}

/** Released-revision eligibility (CONTENT lane integration). */
export interface PlanEligibilityLookup {
  isReleasedRevision(conceptId: string): Promise<boolean>;
}

/** Review-due facts (LEARN-03 projections): only assessed/self-review reasons. */
export interface ReviewDueLookup {
  dueReviews(owner: PlanOwner): Promise<readonly { conceptId: string; reason: string }[]>;
}

/**
 * The immutable evidence ledger, READ-ONLY to the planner. A rebuilding plan
 * must never write here — the integration adapter exposes reads only.
 */
export interface EvidenceLedgerReader {
  /** Canonical byte-form of the learner's evidence (integrity verification). */
  evidenceDigest(owner: PlanOwner): Promise<string>;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryPlanStore implements PlanStore, EvidenceLedgerReader {
  private goals = new Map<string, LearningGoal>();
  private plans: DailyPlan[] = [];
  private reviews: ScheduledReview[] = [];
  private evidence: string[] = [];

  async saveGoal(goal: LearningGoal): Promise<void> {
    this.goals.set(goal.goalId, { ...goal, owner: { ...goal.owner } });
  }

  async goalsFor(owner: PlanOwner): Promise<LearningGoal[]> {
    return [...this.goals.values()]
      .filter((g) => g.owner.uid === owner.uid && g.owner.workspaceId === owner.workspaceId)
      .map((g) => ({ ...g, owner: { ...g.owner } }));
  }

  async savePlan(plan: DailyPlan): Promise<void> {
    this.plans.push({ ...plan, owner: { ...plan.owner }, items: plan.items.map((i) => ({ ...i })) });
  }

  async plansFor(owner: PlanOwner, planDate: string): Promise<DailyPlan[]> {
    return this.plans
      .filter((p) => p.owner.uid === owner.uid && p.owner.workspaceId === owner.workspaceId && p.planDate === planDate)
      .map((p) => ({ ...p, owner: { ...p.owner }, items: p.items.map((i) => ({ ...i })) }));
  }

  async saveReview(review: ScheduledReview): Promise<void> {
    this.reviews.push({ ...review, owner: { ...review.owner } });
  }

  async reviewsFor(owner: PlanOwner): Promise<ScheduledReview[]> {
    return this.reviews
      .filter((r) => r.owner.uid === owner.uid && r.owner.workspaceId === owner.workspaceId)
      .map((r) => ({ ...r, owner: { ...r.owner } }));
  }

  /** The planner appends evidence entries through this test hook only. */
  appendEvidence(entry: string): void {
    this.evidence = [...this.evidence, entry];
  }

  async evidenceDigest(owner: PlanOwner): Promise<string> {
    return this.evidence.filter((e) => e.startsWith(`${owner.uid}|`)).join(';');
  }

  static eligibility(concepts: readonly string[]): PlanEligibilityLookup {
    const released = new Set(concepts);
    return { async isReleasedRevision(conceptId: string) { return released.has(conceptId); } };
  }

  static reviewDue(entries: readonly { conceptId: string; reason: string }[]): ReviewDueLookup {
    return { async dueReviews() { return entries.map((e) => ({ ...e })); } };
  }
}
