// ROLE-10 (KAN-160) — teachers' private ongoing subject/pedagogy learning and
// evidence-based coaching through explicit personal goals, scoped assessed
// practice, teach-back/Build and reflection checkpoints, understandable
// recommendation reasons and manual correction.
//
// Personal learning/memory is SEPARATE from class preparation, learner
// reports and organization employment. Coaching input uses only CURRENTLY
// PERMITTED class summaries for an EXPLICITLY CHOSEN teaching goal. Random-tip
// behavior is never produced; an evaluated connected adapter is used only when
// accepted, and unavailable evidence yields an authored, clearly generic
// suggestion. No inferred teaching-quality ranking, credential or disclosure
// of private learner doubts.
export interface CoachOwner {
  uid: string;
  /** The teacher's PERSONAL workspace — class prep/organization scopes are separate. */
  workspaceId: string;
}

/** The subject/pedagogy focus of one explicit teaching goal. */
export type GoalFocus = 'subject' | 'pedagogy';

/** Kinds of scoped evidence checkpoint a teacher records against a goal. */
export type CheckpointKind = 'assessed_practice' | 'teachback_build' | 'reflection';

/**
 * An EXPLICIT personal teaching goal. It names the class summary the teacher
 * explicitly chose to learn from; that summary must be CURRENTLY permitted for
 * this teacher (employment/class changes can revoke the permission).
 */
export interface TeachingGoal {
  goalId: string;
  owner: CoachOwner;
  /** Explicitly chosen teaching objective (subject or pedagogy focus). */
  focus: GoalFocus;
  target: string;
  /** The class summary the teacher chose for this goal (currently-permitted only). */
  chosenClassSummary: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

/** A scoped, assessed practice / teach-back-Build / reflection checkpoint. */
export interface CoachingCheckpoint {
  checkpointId: string;
  goalId: string;
  kind: CheckpointKind;
  /** Optional evidence reference scoped to the currently-permitted class summary. */
  evidenceRef: string | null;
  note: string;
  assessedAt: string;
}

/**
 * One coaching suggestion. It is EITHER an evidence-based suggestion from an
 * ACCEPTED connected adapter citing a currently-permitted class summary, OR an
 * authored, clearly-generic suggestion — NEVER a random tip. It carries an
 * understandable reason and never ranks teaching quality or confers a credential.
 */
export interface CoachingSuggestion {
  suggestionId: string;
  goalId: string;
  body: string;
  /** Understandable, human-readable reason (why this suggestion). */
  reason: string;
  /** Where the suggestion came from. */
  source: 'connected_adapter' | 'generic_authored';
  suggestedAt: string;
  corrected: boolean;
}

/** A teacher's MANUAL correction of a suggestion (append-only journal). */
export interface CoachingCorrection {
  correctionId: string;
  suggestionId: string;
  correctedBody: string;
  correctedAt: string;
  byUid: string;
}

/** Append-only journal entry for independent teacher-usefulness/outcome review. */
export interface CoachingJournalEntry {
  journalId: string;
  goalId: string;
  entryType: 'goal_created' | 'goal_revoked' | 'checkpoint' | 'suggestion' | 'correction';
  at: string;
  detail: Record<string, string>;
}

export class CoachingError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'goal_revoked'
    | 'goal_definition_invalid'
    | 'class_summary_not_permitted'
    | 'checkpoint_definition_invalid'
    | 'private_learner_doubt_forbidden'
    | 'suggestion_definition_invalid'
    | 'unknown_goal';
  constructor(code: CoachingError['code']) {
    super(code);
    this.code = code;
  }
}
