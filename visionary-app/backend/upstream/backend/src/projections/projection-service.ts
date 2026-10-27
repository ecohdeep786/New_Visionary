// LEARN-03 (KAN-69) — versioned mastery/progress/review projections.
//
// Core responsibilities (server-owned; distinct evidence classes; deterministic):
//   1. record: append immutable evidence. An `assessed` event without a rubric
//      reference is refused — mastery evidence must be rubric-backed.
//   2. project: compute the versioned projection for (owner, concept) from the
//      immutable evidence. Deterministic: the same evidence fingerprint always
//      yields the same projection version (stable hash of the evidence set).
//   3. Honest mastery: only assessed outcomes with rubric evidence make a
//      concept mastery-eligible; consumption/self-review NEVER do (model
//      certainty is not learner mastery).
//   4. Review scheduling derives from assessed outcomes and self-reviews with
//      explicit reasons; consumption never schedules a review.
//   5. Privacy: projections are owner-scoped; a wrong uid/workspace is denied.
import { createHash } from 'node:crypto';
import type {
  ConceptProjection,
  EvidenceEvent,
  MasteryState,
  ProjectionOwner,
  ProjectionSnapshot,
  ProjectionError as ProjectionErrorType,
} from './projection-types';
import { ProjectionError } from './projection-types';
import type { EvidenceStore, SnapshotStore } from './projection-lookups';

export class ProjectionService {
  constructor(
    private readonly evidence: EvidenceStore,
    private readonly snapshots: SnapshotStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Append immutable evidence; assessed events require rubric provenance. */
  async record(event: EvidenceEvent): Promise<void> {
    if (event.evidenceClass === 'assessed' && !event.rubricRef) {
      throw new ProjectionError('assessed_without_rubric');
    }
    await this.evidence.appendEvent(event);
  }

  /**
   * Compute (and persist) the versioned projection for one concept.
   * Deterministic: identical evidence yields an identical projection version.
   */
  async project(owner: ProjectionOwner, conceptId: string): Promise<ProjectionSnapshot> {
    const events = await this.evidence.eventsFor(owner, conceptId);
    const fingerprint = this.fingerprint(events);
    const previous = await this.snapshots.latestSnapshot(owner, conceptId);
    if (previous && previous.evidenceFingerprint === fingerprint) {
      return previous; // identical evidence => identical projection (no churn)
    }
    const projection = this.compute(events);
    const snapshot: ProjectionSnapshot = {
      owner: { ...owner },
      conceptId,
      projectionVersion: (previous?.projectionVersion ?? 0) + 1,
      evidenceFingerprint: fingerprint,
      projection,
      computedAt: this.now().toISOString(),
    };
    await this.snapshots.saveSnapshot(snapshot);
    return snapshot;
  }

  private fingerprint(events: readonly EvidenceEvent[]): string {
    const canonical = events
      .map((e) => `${e.eventId}|${e.evidenceClass}|${e.rubricRef ?? ''}|${e.passed ?? ''}`)
      .sort()
      .join(';');
    return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 32);
  }

  private compute(events: readonly EvidenceEvent[]): ConceptProjection {
    const consumptionCount = events.filter((e) => e.evidenceClass === 'consumption').length;
    const attemptEvents = events.filter((e) => e.evidenceClass === 'attempt');
    const selfReviews = events.filter((e) => e.evidenceClass === 'self_review');
    const assessedEvents = events.filter((e) => e.evidenceClass === 'assessed');
    const passed = assessedEvents.filter((e) => e.passed === true).length;
    const failed = assessedEvents.filter((e) => e.passed === false).length;

    // Mastery state: honest precedence — assessed evidence outranks everything;
    // an evidence-backed attempt outranks a self-review; consumption alone is
    // explicitly 'consumed_only', never mastery.
    let masteryState: MasteryState;
    if (failed > 0 && passed === 0) masteryState = 'assessed_not_passed';
    else if (passed > 0) masteryState = 'assessed_passed';
    else if (attemptEvents.length > 0) masteryState = 'practiced';
    else if (selfReviews.length > 0) masteryState = 'self_reviewed';
    else if (consumptionCount > 0) masteryState = 'consumed_only';
    else masteryState = 'not_started';

    // Review due: from assessed outcomes (retry on failure, refresh on pass)
    // and self-reviews; NEVER from consumption.
    let reviewDue: ConceptProjection['reviewDue'] = { due: false, reason: null };
    if (failed > 0) reviewDue = { due: true, reason: 'assessed_not_passed_retry' };
    else if (passed > 0) reviewDue = { due: true, reason: 'assessed_passed_refresh' };
    else if (selfReviews.length > 0) reviewDue = { due: true, reason: 'self_review_follow_up' };

    return {
      conceptId: events[0]?.conceptId ?? '',
      consumptionCount,
      attemptCount: attemptEvents.length,
      selfReviewCount: selfReviews.length,
      assessed: { total: assessedEvents.length, passed },
      masteryState,
      masteryEligible: passed > 0,
      reviewDue,
    };
  }
}

export type { ProjectionErrorType };
