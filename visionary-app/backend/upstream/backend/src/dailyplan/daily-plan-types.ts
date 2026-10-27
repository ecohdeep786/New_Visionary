// LEARN-04 (KAN-70) — persist permitted goals/daily plans/review scheduling and
// eligible discovery results with understandable reasons; a rebuilding
// projection must not overwrite evidence.
//
// The checkpoint here is server-owned, honest daily planning:
//   - Goals are PERMITTED: a goal may only target a concept whose source
//     revision is released/eligible (validated server-side); wrong users are
//     denied before anything persists.
//   - Daily plans are deterministic rebuilds from permitted goals + review-due
//     state + eligible discovery, and EVERY item carries an understandable
//     human-readable reason (why this item, today).
//   - Review scheduling derives only from real review-due reasons (assessed
//     retry/refresh, self-review follow-up — the LEARN-03 semantics);
//     consumption never schedules a review.
//   - Discovery returns only ELIGIBLE released concepts, each with a reason.
//   - THE INVARIANT: a rebuilding projection (a new plan version) must not
//     overwrite evidence — the evidence ledger is read-only to the planner and
//     stays byte-identical across rebuilds; plan versions append, never rewrite.
//
// Exit: trusted, reproducible daily plans with visible reasons.

/** Server-owned planning authority. */
export interface PlanOwner {
  uid: string;
  workspaceId: string;
}

/** A permitted learning goal targeting a released concept. */
export interface LearningGoal {
  goalId: string;
  owner: PlanOwner;
  conceptId: string;
  target: string;
  createdAt: string;
}

/** One planned item with an understandable reason. */
export interface PlanItem {
  conceptId: string;
  /** Where the item came from: a goal, due review, or eligible discovery. */
  origin: 'goal' | 'review' | 'discovery';
  /** Understandable, human-readable reason (why this item, today). */
  reason: string;
}

/** A versioned daily plan (rebuilds append versions, never rewrite). */
export interface DailyPlan {
  planId: string;
  owner: PlanOwner;
  planDate: string;
  items: readonly PlanItem[];
  /** Plan version — each rebuild appends the next version. */
  version: number;
  builtAt: string;
}

/** A scheduled review with its evidence-derived reason. */
export interface ScheduledReview {
  reviewId: string;
  owner: PlanOwner;
  conceptId: string;
  /** Understandable reason carried from the review-due state. */
  reason: string;
  scheduledAt: string;
}

/** An eligible discovery result with its reason. */
export interface DiscoveryResult {
  conceptId: string;
  /** Understandable reason (which released source backs this result). */
  reason: string;
}

export class DailyPlanError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'concept_not_eligible'
      | 'review_not_due'
      | 'unknown_plan'
  ) {
    super(code);
  }
}
