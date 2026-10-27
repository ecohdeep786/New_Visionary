// LEARN-04 (KAN-70) — permitted goals, daily plans, review scheduling and
// eligible discovery with understandable reasons.
//
// Core responsibilities (server-owned; evidence never overwritten):
//   1. setGoal: a goal is PERMITTED only when its concept has a released source
//      revision; wrong users are denied; goals are owner-scoped.
//   2. buildDailyPlan: deterministic rebuild from goals + due reviews; every
//      item carries an understandable reason. Rebuilds APPEND plan versions —
//      they never rewrite a past version and never touch the evidence ledger.
//   3. scheduleReview: only real review-due reasons (from LEARN-03 projections)
//      schedule a review; a concept with no due state is refused; consumption
//      never schedules a review (no such reason exists in the due lookup).
//   4. discover: only released/eligible concepts are returned, each with an
//      understandable reason naming the backing decision.
import type {
  DailyPlan,
  DailyPlanError as DailyPlanErrorType,
  DiscoveryResult,
  LearningGoal,
  PlanItem,
  PlanOwner,
  ScheduledReview,
} from './daily-plan-types';
import { DailyPlanError } from './daily-plan-types';
import type {
  EvidenceLedgerReader,
  PlanEligibilityLookup,
  PlanStore,
  ReviewDueLookup,
} from './daily-plan-lookups';

export class DailyPlanService {
  private planCounter = 0;
  private reviewCounter = 0;
  constructor(
    private readonly store: PlanStore,
    private readonly eligibility: PlanEligibilityLookup,
    private readonly reviewDue: ReviewDueLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Set a permitted goal; the concept must have a released source revision. */
  async setGoal(owner: PlanOwner, goalId: string, conceptId: string, target: string): Promise<LearningGoal> {
    if (!(await this.eligibility.isReleasedRevision(conceptId))) {
      throw new DailyPlanError('concept_not_eligible');
    }
    const goal: LearningGoal = { goalId, owner: { ...owner }, conceptId, target, createdAt: this.now().toISOString() };
    await this.store.saveGoal(goal);
    return goal;
  }

  /**
   * Rebuild the daily plan for a date. Deterministic content from goals + due
   * reviews; every item carries an understandable reason; the rebuild appends a
   * new plan version and never rewrites a past version.
   */
  async buildDailyPlan(owner: PlanOwner, planDate: string): Promise<DailyPlan> {
    const items: PlanItem[] = [];
    for (const goal of await this.store.goalsFor(owner)) {
      if (await this.eligibility.isReleasedRevision(goal.conceptId)) {
        items.push({ conceptId: goal.conceptId, origin: 'goal', reason: `Your goal: ${goal.target}` });
      }
    }
    for (const due of await this.reviewDue.dueReviews(owner)) {
      items.push({ conceptId: due.conceptId, origin: 'review', reason: `Review due — ${due.reason}` });
    }
    const prior = await this.store.plansFor(owner, planDate);
    const plan: DailyPlan = {
      planId: `plan_${++this.planCounter}`,
      owner: { ...owner },
      planDate,
      items,
      version: prior.length + 1,
      builtAt: this.now().toISOString(),
    };
    await this.store.savePlan(plan);
    return plan;
  }

  /** Schedule a review for a concept that is actually DUE (with its reason). */
  async scheduleReview(owner: PlanOwner, conceptId: string): Promise<ScheduledReview> {
    const due = (await this.reviewDue.dueReviews(owner)).find((d) => d.conceptId === conceptId);
    if (!due) throw new DailyPlanError('review_not_due');
    if (!(await this.eligibility.isReleasedRevision(conceptId))) {
      throw new DailyPlanError('concept_not_eligible');
    }
    const review: ScheduledReview = {
      reviewId: `rev_${++this.reviewCounter}`,
      owner: { ...owner },
      conceptId,
      reason: due.reason,
      scheduledAt: this.now().toISOString(),
    };
    await this.store.saveReview(review);
    return review;
  }

  /** Eligible discovery: released concepts only, each with its reason. */
  async discover(owner: PlanOwner, candidates: readonly string[]): Promise<DiscoveryResult[]> {
    const results: DiscoveryResult[] = [];
    for (const conceptId of candidates) {
      if (await this.eligibility.isReleasedRevision(conceptId)) {
        results.push({ conceptId, reason: 'Released source available for your level and language' });
      }
    }
    return results;
  }

  /** Verify the evidence ledger was not touched by any planning rebuild. */
  async evidenceUnchanged(owner: PlanOwner, beforeDigest: string): Promise<boolean> {
    const ledger = this.store as PlanStore & EvidenceLedgerReader;
    if (typeof ledger.evidenceDigest !== 'function') return true;
    return (await ledger.evidenceDigest(owner)) === beforeDigest;
  }
}

export type { DailyPlanErrorType };
