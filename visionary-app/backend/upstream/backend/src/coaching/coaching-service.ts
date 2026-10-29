// ROLE-10 (KAN-160) — teachers' private ongoing subject/pedagogy learning and
// evidence-based coaching through explicit personal goals, scoped assessed
// practice, teach-back/Build and reflection checkpoints, understandable
// recommendation reasons and manual correction.
//
// Core responsibilities (server-owned; separation enforced; fail closed):
//   1. EXPLICIT PERSONAL GOALS: a teacher creates a personal teaching goal with
//      an explicitly chosen class summary. Only a summary CURRENTLY PERMITTED
//      for this teacher is accepted (`class_summary_not_permitted` otherwise).
//   2. PRIVATE ongoing learning: goals/checkpoints/suggestions live in the
//      teacher's PERSONAL workspace, strictly separated from class preparation,
//      learner reports and organization employment (`workspace_mismatch` across
//      spaces; uniform `not_owner` for other teachers — no leak).
//   3. SCOPED ASSESSED PRACTICE + TEACH-BACK/BUILD + REFLECTION CHECKPOINTS:
//      every checkpoint binds to one explicit goal and is scoped to the goal's
//      currently-permitted class summary.
//   4. NO RANDOM TIPS AND UNDERSTANDABLE REASONS: a suggestion is either an
//      evidence-based proposal from an ACCEPTED connected coaching adapter
//      (citing the currently-permitted class summary) or, when no accepted
//      adapter/evidence is available, an authored clearly-generic suggestion —
//      a random tip is never produced. Every suggestion carries an
//      understandable reason.
//   5. MANUAL CORRECTION: the teacher can correct a suggestion; corrections are
//      append-only and the corrected suggestion is marked.
//   6. REVOCATION / CHANGED EMPLOYMENT: revoking a goal makes further coaching
//      on it refuse (`goal_revoked`); revoking the class-summary permission
//      makes coaching on the goal refuse (`class_summary_not_permitted`) —
//      the previously used summary is never reused.
//   7. TWO-DEVICE RESUME: the same store state applied to two controllers moves
//      both consistently; `resumeCoach` returns the byte-stable journal so a
//      second device observes the identical history.
//   8. NO INFERRED TEACHING-QUALITY RANKING, CREDENTIAL, OR PRIVATE LEARNER
//      DOUBT DISCLOSURE: a suggestion never ranks/credentials; content carrying
//      a private learner doubt refuses (`private_learner_doubt_forbidden`).
import type {
  CheckpointKind,
  CoachingCheckpoint,
  CoachingCorrection,
  CoachingError as CoachingErrorType,
  CoachingJournalEntry,
  CoachingSuggestion,
  CoachOwner,
  GoalFocus,
  TeachingGoal,
} from './coaching-types';
import { CoachingError } from './coaching-types';
import type { CoachingStore } from './coaching-lookups';

/** Reference markers that indicate private learner doubt content. */
const PRIVATE_DOUBT_HINTS = ['doubt', 'private_learner', 'learner_doubt', 'learner_text', 'conversation'];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class CoachingService {
  private goalCounter = 0;
  private checkpointCounter = 0;
  private suggestionCounter = 0;
  private correctionCounter = 0;
  private journalCounter = 0;

  constructor(
    private readonly store: CoachingStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Create an EXPLICIT personal teaching goal from a CURRENTLY-PERMITTED class
   * summary. The summary is chosen explicitly; only a summary the store reports
   * currently permitted for this teacher is accepted.
   */
  async createGoal(
    owner: CoachOwner,
    focus: GoalFocus,
    target: string,
    chosenClassSummary: string,
  ): Promise<TeachingGoal> {
    if (!target || !chosenClassSummary) throw new CoachingError('goal_definition_invalid');
    if (!(await this.store.isClassSummaryCurrentlyPermitted(owner.uid, chosenClassSummary))) {
      throw new CoachingError('class_summary_not_permitted');
    }
    const goal: TeachingGoal = {
      goalId: `goal_${++this.goalCounter}`,
      owner,
      focus,
      target,
      chosenClassSummary,
      status: 'active',
      createdAt: this.now().toISOString(),
    };
    await this.store.saveGoal(goal);
    await this.appendJournal(goal.goalId, 'goal_created', { target, chosenClassSummary });
    return goal;
  }

  /** Record a scoped checkpoint (assessed practice / teach-back-Build / reflection). */
  async addCheckpoint(
    owner: CoachOwner,
    goalId: string,
    kind: CheckpointKind,
    note: string,
    evidenceRef: string | null = null,
  ): Promise<CoachingCheckpoint> {
    const goal = await this.requireGoal(owner, goalId);
    if (goal.status === 'revoked') throw new CoachingError('goal_revoked');
    if (!note) throw new CoachingError('checkpoint_definition_invalid');
    // The checkpoint may only reference the goal's CURRENTLY-PERMITTED summary.
    if (!(await this.store.isClassSummaryCurrentlyPermitted(owner.uid, goal.chosenClassSummary))) {
      throw new CoachingError('class_summary_not_permitted');
    }
    const lowered = `${note} ${evidenceRef ?? ''}`.toLowerCase();
    if (PRIVATE_DOUBT_HINTS.some((h) => lowered.includes(h))) {
      throw new CoachingError('private_learner_doubt_forbidden');
    }
    const checkpoint: CoachingCheckpoint = {
      checkpointId: `chk_${++this.checkpointCounter}`,
      goalId,
      kind,
      evidenceRef,
      note,
      assessedAt: this.now().toISOString(),
    };
    await this.store.saveCheckpoint(checkpoint);
    await this.appendJournal(goal.goalId, 'checkpoint', { kind, checkpointId: checkpoint.checkpointId });
    return checkpoint;
  }

  /**
   * Produce ONE coaching suggestion. If the goal's class summary is CURRENTLY
   * permitted and an ACCEPTED connected adapter is available with evidence, the
   * suggestion is evidence-based and cites that summary. Otherwise (permitted
   * summary but no accepted adapter / no evidence) it is an AUTHORED, clearly-
   * generic suggestion. A random tip is never produced. If the summary is no
   * longer permitted (changed employment / revocation), coaching fails closed
   * (`class_summary_not_permitted`) rather than reusing the revoked summary.
   */
  async suggest(owner: CoachOwner, goalId: string): Promise<CoachingSuggestion> {
    const goal = await this.requireGoal(owner, goalId);
    if (goal.status === 'revoked') throw new CoachingError('goal_revoked');
    const permittedNow = await this.store.isClassSummaryCurrentlyPermitted(owner.uid, goal.chosenClassSummary);
    if (!permittedNow) throw new CoachingError('class_summary_not_permitted');
    const checkpoints = await this.store.checkpoints(goalId);
    const hasEvidence = checkpoints.length > 0;
    const adapterAccepted = this.store.connectedAdapterAccepted();

    let source: CoachingSuggestion['source'];
    let body: string;
    let reason: string;
    if (adapterAccepted && hasEvidence) {
      source = 'connected_adapter';
      const practice = checkpoints.find((c) => c.kind === 'assessed_practice') ?? checkpoints[0];
      body = `Focus one practice block on "${goal.target}" using class summary "${goal.chosenClassSummary}", starting from checkpoint ${practice.checkpointId}.`;
      reason = `Evidence-based: ${checkpoints.length} scoped checkpoint(s) against class summary "${goal.chosenClassSummary}", which is currently permitted for you.`;
    } else if (hasEvidence) {
      // No accepted adapter yet — an authored generic suggestion, never a random tip.
      source = 'generic_authored';
      body = `Continue working on your explicit goal "${goal.target}" with the currently-permitted class summary. No connected coaching adapter is accepted yet, so this is a generic suggestion — not a personalized recommendation.`;
      reason = 'No accepted connected coaching adapter is available; an authored, clearly generic suggestion is returned instead of a random tip.';
    } else {
      source = 'generic_authored';
      body = `Start a scoped practice/reflection checkpoint for your goal "${goal.target}". Current evidence is unavailable, so this is an authored, clearly generic suggestion — not a personalized recommendation.`;
      reason = `No evidence is available yet against class summary "${goal.chosenClassSummary}". An authored, clearly generic suggestion is returned; random-tip behavior is never produced.`;
    }

    const suggestion: CoachingSuggestion = {
      suggestionId: `sug_${++this.suggestionCounter}`,
      goalId,
      body,
      reason,
      source,
      suggestedAt: this.now().toISOString(),
      corrected: false,
    };
    await this.store.saveSuggestion(suggestion);
    await this.appendJournal(goal.goalId, 'suggestion', { source, suggestionId: suggestion.suggestionId });
    return suggestion;
  }

  /** The teacher MANUALLY corrects one suggestion (append-only; marked corrected). */
  async correctSuggestion(
    owner: CoachOwner,
    suggestionId: string,
    correctedBody: string,
  ): Promise<CoachingSuggestion> {
    const suggestion = await this.store.suggestion(suggestionId);
    if (!suggestion) throw new CoachingError('unknown_goal');
    const goal = await this.requireGoal(owner, suggestion.goalId);
    void goal;
    if (!correctedBody) throw new CoachingError('suggestion_definition_invalid');
    const corrected: CoachingSuggestion = { ...suggestion, body: correctedBody, corrected: true };
    await this.store.saveSuggestion(corrected);
    const correction: CoachingCorrection = {
      correctionId: `cor_${++this.correctionCounter}`,
      suggestionId,
      correctedBody,
      correctedAt: this.now().toISOString(),
      byUid: owner.uid,
    };
    await this.store.saveCorrection(correction);
    await this.appendJournal(suggestion.goalId, 'correction', { suggestionId });
    return corrected;
  }

  /** Revoke a goal — further coaching on it refuses (`goal_revoked`). */
  async revokeGoal(owner: CoachOwner, goalId: string): Promise<TeachingGoal> {
    const goal = await this.requireGoal(owner, goalId);
    const revoked: TeachingGoal = { ...goal, status: 'revoked' };
    await this.store.saveGoal(revoked);
    await this.appendJournal(goalId, 'goal_revoked', {});
    return revoked;
  }

  /**
   * Two-device resume: return the byte-stable goal journal (goal, checkpoints,
   * suggestions, corrections). Two controllers over the same store observe the
   * identical history, so a second device resumes the same private coaching.
   */
  async resumeCoach(owner: CoachOwner, goalId: string): Promise<{
    goal: TeachingGoal;
    checkpoints: CoachingCheckpoint[];
    journal: CoachingJournalEntry[];
    digest: string;
  }> {
    const goal = await this.requireGoal(owner, goalId);
    const checkpoints = await this.store.checkpoints(goalId);
    const journal = await this.store.journal(goalId);
    const digest = JSON.stringify([goal, checkpoints, journal]);
    return { goal, checkpoints, journal, digest };
  }

  /** Independent teacher-usefulness/outcome review — read the append-only journal. */
  async reviewJournal(owner: CoachOwner, goalId: string): Promise<CoachingJournalEntry[]> {
    const goal = await this.requireGoal(owner, goalId);
    void goal;
    return this.store.journal(goalId);
  }

  private async requireGoal(owner: CoachOwner, goalId: string): Promise<TeachingGoal> {
    const goal = await this.store.goal(goalId);
    if (!goal) throw new CoachingError('unknown_goal');
    if (goal.owner.uid !== owner.uid) throw new CoachingError('not_owner');
    if (goal.owner.workspaceId !== owner.workspaceId) throw new CoachingError('workspace_mismatch');
    return goal;
  }

  private async appendJournal(
    goalId: string,
    entryType: CoachingJournalEntry['entryType'],
    detail: Record<string, string>,
  ): Promise<void> {
    const entry: CoachingJournalEntry = {
      journalId: `log_${++this.journalCounter}`,
      goalId,
      entryType,
      at: this.now().toISOString(),
      detail,
    };
    await this.store.appendJournalEntry(entry);
  }
}

export type { CoachingErrorType };
