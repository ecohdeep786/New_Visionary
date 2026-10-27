// LEARN-01 (KAN-67) — owned learning sessions, checkpoints and resume cursors.
//
// Core responsibilities (server-owned; wrong user/workspace/revision denied):
//   1. startSession: pin an exact RELEASED source revision; unknown/unreleased
//      revisions are refused. Sessions are owner-scoped and distinct journeys.
//   2. checkpoint: owner-only, revision-fenced, idempotent by client command id
//      (a retried command converges to the same committed outcome and never
//      double-advances the revision).
//   3. Refusals preserve the learner's local work visibly: callers receive a
//      PreservedLocalRefusal with the honest reason (and the current committed
//      revision on conflict) so the local draft is never silently dropped.
//   4. resume: returns the COMMITTED cursor (pin + latest checkpoint + revision
//      + committing device) — the exact state a second device resumes.
//   5. complete/cancel are owner-only and idempotent; a cancelled session
//      refuses further checkpoints but its committed cursor stays resumable.
import type {
  Checkpoint,
  CheckpointResult,
  LearningSession,
  LearningSessionError as LearningSessionErrorType,
  PreservedLocalRefusal,
  ResumeCursor,
  SessionOwner,
  SessionStatus,
  SourcePin,
} from './learning-session-types';
import { LearningSessionError } from './learning-session-types';
import type { LearningSessionStore, SourceRevisionLookup } from './learning-session-lookups';

/** Idempotent settle success (complete/cancel). */
type SettleSuccess = { ok: true; status: SessionStatus; revision: number };

export class LearningSessionService {
  private sessionCounter = 0;
  constructor(
    private readonly store: LearningSessionStore,
    private readonly revisions: SourceRevisionLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Start an owned session pinned to an exact released source revision. */
  async startSession(owner: SessionOwner, pin: SourcePin): Promise<LearningSession> {
    if (!(await this.revisions.isReleasedRevision(pin.conceptId, pin.sourceVersion))) {
      throw new LearningSessionError('source_revision_unknown');
    }
    const session: LearningSession = {
      sessionId: `ls_${++this.sessionCounter}`,
      owner: { ...owner },
      pin: { ...pin },
      status: 'active',
      revision: 1,
      createdAt: this.now().toISOString(),
      updatedAt: this.now().toISOString(),
    };
    await this.store.insertSession(session);
    return session;
  }

  /** Commit a checkpoint: owner-only, revision-fenced, idempotent by commandId. */
  async checkpoint(input: {
    sessionId: string;
    owner: SessionOwner;
    commandId: string;
    expectedRevision: number;
    deviceId: string;
    payload: unknown;
  }): Promise<CheckpointResult | PreservedLocalRefusal> {
    const session = await this.store.bySessionId(input.sessionId);
    if (!session) return this.refusal('unknown_session');
    if (session.owner.uid !== input.owner.uid || session.owner.workspaceId !== input.owner.workspaceId) {
      return this.refusal('not_owner');
    }
    // Idempotent replay: the same command converges to the same committed row.
    const existing = await this.store.byCommandId(input.sessionId, input.commandId);
    if (existing) return { outcome: 'duplicate', sessionId: input.sessionId, revision: existing.revision, commandId: input.commandId };
    if (session.status === 'cancelled') return this.refusal('session_cancelled');
    if (session.status === 'completed') return this.refusal('session_completed');
    if (session.revision !== input.expectedRevision) {
      return { ok: false as const, reason: 'revision_conflict', preservedLocal: true as const, currentRevision: session.revision };
    }

    const revision = session.revision + 1;
    const checkpoint: Checkpoint = {
      commandId: input.commandId,
      sessionId: input.sessionId,
      committedBy: { ...input.owner },
      deviceId: input.deviceId,
      payload: input.payload,
      revision,
      committedAt: this.now().toISOString(),
    };
    await this.store.insertCheckpoint(checkpoint);
    await this.store.updateSession({ ...session, revision, updatedAt: checkpoint.committedAt });
    return { outcome: 'committed', sessionId: input.sessionId, revision, commandId: input.commandId };
  }

  /** Complete an owned session (idempotent; wrong owner refused). */
  async completeSession(sessionId: string, owner: SessionOwner, expectedRevision: number): Promise<SettleSuccess | PreservedLocalRefusal> {
    return this.settle(sessionId, owner, expectedRevision, 'completed');
  }

  /** Cancel an owned session (idempotent; committed cursor stays resumable). */
  async cancelSession(sessionId: string, owner: SessionOwner, expectedRevision: number): Promise<SettleSuccess | PreservedLocalRefusal> {
    return this.settle(sessionId, owner, expectedRevision, 'cancelled');
  }

  private async settle(
    sessionId: string,
    owner: SessionOwner,
    expectedRevision: number,
    status: SessionStatus,
  ): Promise<SettleSuccess | PreservedLocalRefusal> {
    const session = await this.store.bySessionId(sessionId);
    if (!session) return this.refusal('unknown_session');
    if (session.owner.uid !== owner.uid || session.owner.workspaceId !== owner.workspaceId) return this.refusal('not_owner');
    if (session.status === status) return { ok: true, status, revision: session.revision };
    if (session.status !== 'active') return this.refusal(status === 'completed' ? 'session_cancelled' : 'session_completed');
    if (session.revision !== expectedRevision) {
      return { ok: false, reason: 'revision_conflict', preservedLocal: true, currentRevision: session.revision };
    }
    const revision = session.revision + 1;
    await this.store.updateSession({ ...session, status, revision, updatedAt: this.now().toISOString() });
    return { ok: true, status, revision };
  }

  /** The committed journey state — what another device resumes (owner-only). */
  async resume(sessionId: string, owner: SessionOwner): Promise<ResumeCursor | PreservedLocalRefusal> {
    const session = await this.store.bySessionId(sessionId);
    if (!session) return this.refusal('unknown_session');
    if (session.owner.uid !== owner.uid || session.owner.workspaceId !== owner.workspaceId) return this.refusal('not_owner');
    const rows = await this.store.checkpoints(sessionId);
    const latest = rows[rows.length - 1];
    return {
      sessionId,
      pin: { ...session.pin },
      status: session.status,
      revision: session.revision,
      latestPayload: latest ? latest.payload : null,
      latestCommandId: latest ? latest.commandId : null,
      latestDeviceId: latest ? latest.deviceId : null,
      committedAt: latest ? latest.committedAt : null,
    };
  }

  private refusal(reason: PreservedLocalRefusal['reason']): PreservedLocalRefusal {
    return { ok: false, reason, preservedLocal: true };
  }
}

export type { LearningSessionErrorType };
