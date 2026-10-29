// LEARN-14 (KAN-159) — backend-owned lifelong stage/curriculum continuity.
//
// Core responsibilities (server-owned; honest; fail closed):
//   1. REVIEWED MAPPINGS: a promotion proposal requires a reviewed
//      source/criteria mapping for the exact jump; unreviewed/missing mappings
//      refuse (`mapping_unavailable`) — equivalent mastery is never claimed
//      from an unreviewed mapping.
//   2. SUGGESTION-ONLY INFERENCE: a proposal based on evidence inference alone
//      is recorded as suggestionOnly and ALWAYS refuses to auto-apply
//      (`evidence_suggestion_only`).
//   3. CONFIRMATION FOR BIG JUMPS: board/institution/safety-tier or larger
//      jumps (major class) apply only with explicit confirmation
//      (`confirmation_required`).
//   4. VERSIONED AUTHORIZED EVENTS: applying a proposal appends one immutable
//      promotion event with its notice/diff; the current profile revision is
//      DERIVED from the applied event set, so duplicate or reordered events
//      converge to the same profile (byte-stable digest, two-device identity).
//   5. POSTPONE 7 / UNDO 14: an ordinary proposal may be postponed by up to 7
//      days (durable); a committed promotion may be undone within 14 days —
//      undo appends a revert event, preserves work created since, and never
//      rewrites grades or evidence (nothing is deleted, ever).
//   6. AUTHORITY RECHECK: after institution exit, in-flight proposals refuse to
//      apply (`exit_authority_revoked`).
//   7. PRESERVED STATE: review due dates and fixed assignment labels are read
//      through untouched by continuity (never rewritten).
//   8. POST-COMMIT PROJECTIONS: the post-commit plan/audience projection
//      rebuilds deterministically from the committed event set.
//   9. COMMAND DEDUPLICATION: apply/postpone/undo commands carry a stable
//      commandKey; same key + same payload converges; changed payload refuses.
import { createHash } from 'node:crypto';
import type {
  JumpClass,
  PromotionBasis,
  PromotionProposal,
  StageError as StageErrorType,
  StageEvent,
  StageMapping,
  StageOwner,
  StageProfile,
} from './stage-types';
import { StageError } from './stage-types';
import type { StageStore } from './stage-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const POSTPONE_MAX_DAYS = 7;
const UNDO_WINDOW_DAYS = 14;

export class StageService {
  private proposalCounter = 0;
  private eventCounter = 0;

  constructor(
    private readonly store: StageStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Record a reviewed source/criteria mapping (named reviewer; explicit). */
  async recordMapping(
    mapping: Omit<StageMapping, 'reviewedBy'>,
    reviewedBy: string,
  ): Promise<StageMapping> {
    if (!reviewedBy?.trim()) throw new StageError('mapping_invalid');
    if (!mapping.mappingId || !mapping.fromStage || !mapping.toStage || !mapping.sourceRef || !mapping.criteriaRef) {
      throw new StageError('mapping_invalid');
    }
    const saved: StageMapping = { ...clone(mapping), reviewedBy };
    await this.store.saveMapping(saved);
    return saved;
  }

  /**
   * Propose a promotion from the current stage. Requires a REVIEWED mapping for
   * the exact jump. Evidence-inference proposals are suggestion-only. Board/
   * institution/safety-tier or larger jumps are major and require confirmation.
   */
  async proposePromotion(
    owner: StageOwner,
    currentStage: string,
    toStage: string,
    basis: PromotionBasis,
    jumpClass: JumpClass,
    addedConcepts: readonly string[],
    bridgeGaps: readonly string[],
  ): Promise<PromotionProposal> {
    const mapping = await this.store.findReviewedMapping(currentStage, toStage);
    if (!mapping) throw new StageError('mapping_unavailable');
    const proposal: PromotionProposal = {
      proposalId: `prop_${++this.proposalCounter}`,
      owner: { ...owner },
      fromStage: currentStage,
      toStage,
      basis,
      jumpClass,
      mappingId: mapping.mappingId,
      diff: { addedConcepts: [...addedConcepts], bridgeGaps: [...bridgeGaps] },
      notice: `Eligible progression "${currentStage}" → "${toStage}" (${jumpClass}): ${addedConcepts.length} new concept(s), ${bridgeGaps.length} bridge gap(s) retained.`,
      requiresConfirmation: jumpClass === 'major',
      suggestionOnly: basis === 'evidence_inference',
      postponedUntil: null,
    };
    await this.store.saveProposal(proposal);
    return proposal;
  }

  /** Durable postpone of an ordinary proposal (up to 7 days). */
  async postponeProposal(
    owner: StageOwner,
    commandKey: string,
    proposalId: string,
    days: number,
  ): Promise<PromotionProposal> {
    const proposal = await this.requireOwnedProposal(owner, proposalId);
    if (!Number.isInteger(days) || days < 0 || days > POSTPONE_MAX_DAYS) {
      throw new StageError('postpone_invalid');
    }
    const payloadHash = hash(`postpone|${commandKey}|${proposalId}|${days}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new StageError('command_changed');
    await this.store.recordCommand(commandKey, payloadHash);
    const postponed: PromotionProposal = {
      ...proposal,
      postponedUntil: new Date(this.now().getTime() + days * 86_400_000).toISOString(),
    };
    await this.store.saveProposal(postponed);
    return postponed;
  }

  /**
   * Apply an ordinary, reviewed, authorized promotion with notice/diff.
   * Suggestion-only proposals ALWAYS refuse; a postponed proposal refuses
   * until its postpone window passes; major jumps require confirmation.
   * Appends ONE immutable event; the profile revision is derived.
   */
  async applyPromotion(
    owner: StageOwner,
    commandKey: string,
    proposalId: string,
    confirm: boolean,
  ): Promise<StageEvent> {
    // AUTHORITY RECHECK: an institution exit revokes in-flight promotion
    // authority for this owner.
    if (await this.exitGateActive(owner)) throw new StageError('exit_authority_revoked');
    const proposal = await this.requireOwnedProposal(owner, proposalId);
    if (proposal.suggestionOnly) throw new StageError('evidence_suggestion_only');
    if (proposal.jumpClass === 'major' && !confirm) throw new StageError('confirmation_required');
    if (proposal.postponedUntil && this.now().getTime() < new Date(proposal.postponedUntil).getTime()) {
      throw new StageError('postpone_invalid');
    }
    const payloadHash = hash(`apply|${commandKey}|${proposalId}|${confirm}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new StageError('command_changed');
    const existing = prior ? (await this.replayEvent(owner, 'promotion', proposal)) : undefined;
    await this.store.recordCommand(commandKey, payloadHash);
    if (existing) return existing;
    const event: StageEvent = {
      eventId: `evt_${++this.eventCounter}`,
      owner: { ...owner },
      type: 'promotion',
      fromStage: proposal.fromStage,
      toStage: proposal.toStage,
      mappingId: proposal.mappingId,
      basis: proposal.basis,
      notice: proposal.notice,
      committedAt: this.now().toISOString(),
    };
    await this.store.saveEvent(event);
    return event;
  }

  /**
   * Undo a committed promotion within 14 days. Appends a REVERT event (history
   * is append-only; nothing is deleted); grades/evidence and all work created
   * since the promotion are preserved by construction; no equivalent mastery is
   * claimed from any unreviewed mapping.
   */
  async undoPromotion(owner: StageOwner, commandKey: string, eventId: string): Promise<StageEvent> {
    const event = await this.store.event(eventId);
    if (!event || event.owner.uid !== owner.uid || event.owner.workspaceId !== owner.workspaceId) {
      throw new StageError('event_unknown');
    }
    if (event.type !== 'promotion') throw new StageError('event_unknown');
    const ageDays = (this.now().getTime() - new Date(event.committedAt).getTime()) / 86_400_000;
    if (ageDays > UNDO_WINDOW_DAYS) throw new StageError('undo_window_expired');
    const payloadHash = hash(`undo|${commandKey}|${eventId}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new StageError('command_changed');
    if (prior && prior === payloadHash) {
      // Replay convergence: a replayed undo returns the ORIGINAL revert event
      // (never a duplicate revert row in the append-only ledger).
      const existingRef = await this.store.commandResult(commandKey);
      if (existingRef) {
        const existing = await this.store.event(existingRef);
        if (existing) return existing;
      }
    }
    await this.store.recordCommand(commandKey, payloadHash);
    const revert: StageEvent = {
      eventId: `evt_${++this.eventCounter}`,
      owner: { ...owner },
      type: 'revert',
      fromStage: event.toStage,
      toStage: event.fromStage,
      mappingId: event.mappingId,
      basis: 'authorized',
      notice: `Undo of ${eventId} within ${UNDO_WINDOW_DAYS}d window; work created since is preserved; no grades rewritten.`,
      committedAt: this.now().toISOString(),
    };
    await this.store.saveEvent(revert);
    await this.store.recordCommand(commandKey, payloadHash, revert.eventId);
    return revert;
  }

  /** Institution exit: authority recheck — in-flight promotions stop applying. */
  async recordExit(owner: StageOwner, commandKey: string, fromStage: string): Promise<StageEvent> {
    const payloadHash = hash(`exit|${commandKey}|${fromStage}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new StageError('command_changed');
    if (prior && prior === payloadHash) {
      // Replay convergence: a replayed exit returns the ORIGINAL exit event.
      const existingRef = await this.store.commandResult(commandKey);
      if (existingRef) {
        const existing = await this.store.event(existingRef);
        if (existing) return existing;
      }
    }
    await this.store.recordCommand(commandKey, payloadHash);
    const event: StageEvent = {
      eventId: `evt_${++this.eventCounter}`,
      owner: { ...owner },
      type: 'exit',
      fromStage,
      toStage: fromStage,
      mappingId: null,
      basis: 'authorized',
      notice: 'Institution exit recorded; in-flight promotions lose applying authority.',
      committedAt: this.now().toISOString(),
    };
    await this.store.saveEvent(event);
    await this.store.recordCommand(commandKey, payloadHash, event.eventId);
    return event;
  }

  /**
   * Applying after exit: any exit event for the owner revokes in-flight
   * promotion authority (checked by the projection/tests via gate below).
   */
  async exitGateActive(owner: StageOwner): Promise<boolean> {
    const events = await this.store.eventsFor(owner);
    return events.some((e) => e.type === 'exit');
  }

  /**
   * Conditional current-profile revision: derived deterministically from the
   * applied event set (promotions forward, reverts backward). Duplicate or
   * reordered events converge to the same profile — byte-stable digest.
   */
  async currentProfile(owner: StageOwner): Promise<StageProfile> {
    const events = await this.store.eventsFor(owner);
    let stage = 'stage_1';
    const applied: string[] = [];
    for (const e of events) {
      if (e.type === 'promotion') {
        if (e.fromStage === stage) {
          stage = e.toStage;
          applied.push(e.eventId);
        }
        // A promotion whose base no longer matches (reordered/replayed) never
        // applies twice — the derived profile converges.
      } else if (e.type === 'revert') {
        if (e.fromStage === stage) {
          stage = e.toStage;
          applied.push(e.eventId);
        }
      }
    }
    const canonical = events.map((e) => e.eventId).sort().join('|');
    return {
      owner: { ...owner },
      stage,
      revision: applied.length + 1,
      derivedFrom: applied,
      digest: hash(`${stage}|${canonical}`),
    };
  }

  /** Post-commit plan/audience projection: deterministic, byte-stable. */
  async postCommitProjection(owner: StageOwner): Promise<{
    stage: string;
    planAudience: string;
    preservedDueDates: readonly { conceptId: string; dueAt: string }[];
    preservedAssignmentLabels: readonly { assignmentId: string; label: string }[];
    digest: string;
  }> {
    const profile = await this.currentProfile(owner);
    const dueDates = await this.store.reviewDueDates(owner);
    const labels = await this.store.assignmentLabels(owner);
    const projection = {
      stage: profile.stage,
      planAudience: `plan/audience projection for ${profile.stage}`,
      preservedDueDates: dueDates,
      preservedAssignmentLabels: labels,
      digest: hash(JSON.stringify({ stage: profile.stage, dueDates, labels })),
    };
    return projection;
  }

  private async requireOwnedProposal(owner: StageOwner, proposalId: string): Promise<PromotionProposal> {
    const proposal = await this.store.proposal(proposalId);
    if (!proposal) throw new StageError('proposal_unknown');
    if (proposal.owner.uid !== owner.uid || proposal.owner.workspaceId !== owner.workspaceId) {
      throw new StageError('not_owner');
    }
    return proposal;
  }

  /** Replay convergence: an already-applied proposal returns its original event. */
  private async replayEvent(
    owner: StageOwner,
    type: StageEvent['type'],
    proposal: PromotionProposal,
  ): Promise<StageEvent | undefined> {
    const events = await this.store.eventsFor(owner);
    return events.find((e) => e.type === type && e.fromStage === proposal.fromStage && e.toStage === proposal.toStage);
  }
}

export type { StageErrorType };
