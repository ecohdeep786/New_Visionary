// LEARN-02 (KAN-68) — server-owned attempt persistence.
//
// Core responsibilities (server-owned; private; deduplicated):
//   1. Server-side eligibility BEFORE recording: the learner must own the
//      session, the pinned (concept, source revision) must be released/eligible
//      and the check must exist on that revision. A denial records NOTHING and
//      consumes NO attempt number.
//   2. Deduplication by client submission id: a repeat submission converges to
//      the same committed attempt — no duplicate rows, no attempt inflation.
//   3. Privacy: attempts belong to the learner's workspace; wrong uid/workspace
//      is refused before anything persists.
//   4. Evidence-backed attempts: rubric/evidence references are preserved
//      verbatim; answers are stored and read back exactly.
//   5. Immutable revision history: each accepted submission appends exactly one
//      append-only entry; earlier entries are never rewritten.
import type {
  Attempt,
  AttemptDenial,
  AttemptHistoryEntry,
  AttemptOwner,
  CheckRef,
  EvidenceRefs,
  SubmitResult,
} from './attempt-types';
import type { AttemptEligibilityLookup, AttemptStore } from './attempt-lookups';

export class AttemptService {
  constructor(
    private readonly store: AttemptStore,
    private readonly eligibility: AttemptEligibilityLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Submit an answer for a check. Eligibility is validated server-side;
   * repeat submissions deduplicate; denials record nothing.
   */
  async submit(input: {
    submissionId: string;
    owner: AttemptOwner;
    sessionId: string;
    check: CheckRef;
    answer: unknown;
    evidence: EvidenceRefs;
  }): Promise<SubmitResult | AttemptDenial> {
    // Idempotent replay first: a retried submission never creates a second row.
    const existing = await this.store.bySubmissionId(input.submissionId);
    if (existing) {
      return { outcome: 'duplicate', submissionId: input.submissionId, attemptNo: existing.attemptNo };
    }

    // Server-side eligibility (wrong user/workspace/source/check denied here).
    const sessionOwner = await this.eligibility.sessionOwner(input.sessionId);
    if (!sessionOwner) return { ok: false, reason: 'unknown_session' };
    if (sessionOwner.uid !== input.owner.uid || sessionOwner.workspaceId !== input.owner.workspaceId) {
      return { ok: false, reason: 'not_owner' };
    }
    if (!(await this.eligibility.isReleasedRevision(input.check.conceptId, input.check.sourceVersion))) {
      return { ok: false, reason: 'source_revision_unknown' };
    }
    if (!(await this.eligibility.checkExists(input.check))) return { ok: false, reason: 'check_unknown' };

    // The attempt number is allocated ATOMICALLY from the current accepted
    // count: two concurrent different submissions can never share an
    // attemptNo, and an already-committed submissionId is a duplicate.
    const committed = await this.store.recordAttempt({
      submissionId: input.submissionId,
      owner: input.owner,
      sessionId: input.sessionId,
      check: input.check,
      answer: input.answer,
      evidence: input.evidence,
      submittedAt: this.now().toISOString(),
    });
    if (!committed.ok) return { outcome: 'duplicate', submissionId: input.submissionId, attemptNo: (await this.store.bySubmissionId(input.submissionId))!.attemptNo };
    return { outcome: 'committed', submissionId: input.submissionId, attemptNo: committed.attemptNo };
  }

  /** The learner's private attempts for one check (owner-scoped read). */
  async attemptsFor(owner: AttemptOwner, check: CheckRef): Promise<Attempt[]> {
    return this.store.attemptsFor(owner, check);
  }

  /** The immutable revision history for one check (owner-scoped read). */
  async historyFor(owner: AttemptOwner, check: CheckRef): Promise<AttemptHistoryEntry[]> {
    return this.store.historyFor(owner, check);
  }
}
