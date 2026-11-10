// LEARN-01 (KAN-67) — the session domain's typed state seams. The owning store
// (owned sessions/checkpoints/source revisions, per the delivery trace) implements
// these at integration; the in-memory implementation is contract-true and fails
// closed: unknown sessions/revisions prove nothing.
import type { Checkpoint, LearningSession } from './learning-session-types';

/** Source-revision facts the session domain may pin to (CONTENT lane integration). */
export interface SourceRevisionLookup {
  /** True only when this concept+version is a known, released source revision. */
  isReleasedRevision(conceptId: string, sourceVersion: string): Promise<boolean>;
}

export interface LearningSessionStore {
  insertSession(session: LearningSession): Promise<void>;
  bySessionId(sessionId: string): Promise<LearningSession | undefined>;
  updateSession(session: LearningSession): Promise<void>;
  insertCheckpoint(checkpoint: Checkpoint): Promise<void>;
  byCommandId(sessionId: string, commandId: string): Promise<Checkpoint | undefined>;
  checkpoints(sessionId: string): Promise<Checkpoint[]>;
  /** Atomic revision-fenced checkpoint commit: applies ONLY when the session's
   * current committed revision still equals expectedRevision AND the commandId
   * is unseen (idempotent). Two concurrent checkpoints with the same
   * expectedRevision can never both advance — the loser receives the current
   * revision for a preserved-local retry. (SQL adapter: one conditional
   * UPDATE ... WHERE revision = expectedRevision inside the checkpoint insert
   * transaction.) */
  commitCheckpoint(input: { sessionId: string; owner: { uid: string; workspaceId: string | null }; commandId: string; expectedRevision: number; deviceId: string; payload: unknown; committedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_session' | 'revision_conflict' | 'duplicate' }>;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryLearningSessionStore implements LearningSessionStore {
  private sessions = new Map<string, LearningSession>();
  private rows = new Map<string, Checkpoint>();

  async insertSession(session: LearningSession): Promise<void> {
    this.sessions.set(session.sessionId, { ...session, owner: { ...session.owner }, pin: { ...session.pin } });
  }

  async bySessionId(sessionId: string): Promise<LearningSession | undefined> {
    const found = this.sessions.get(sessionId);
    return found ? { ...found, owner: { ...found.owner }, pin: { ...found.pin } } : undefined;
  }

  async updateSession(session: LearningSession): Promise<void> {
    this.sessions.set(session.sessionId, { ...session, owner: { ...session.owner }, pin: { ...session.pin } });
  }

  async commitCheckpoint(input: { sessionId: string; owner: { uid: string; workspaceId: string | null }; commandId: string; expectedRevision: number; deviceId: string; payload: unknown; committedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_session' | 'revision_conflict' | 'duplicate' }> {
    const session = this.sessions.get(input.sessionId);
    if (!session) return { ok: false, reason: 'unknown_session' };
    if (this.rows.has(`${input.sessionId}|${input.commandId}`)) return { ok: false, reason: 'duplicate' };
    if (session.revision !== input.expectedRevision) return { ok: false, reason: 'revision_conflict' };
    const revision = session.revision + 1;
    const checkpoint: Checkpoint = {
      commandId: input.commandId,
      sessionId: input.sessionId,
      committedBy: { ...input.owner },
      deviceId: input.deviceId,
      payload: input.payload,
      revision,
      committedAt: input.committedAt,
    };
    this.rows.set(`${input.sessionId}|${input.commandId}`, checkpoint);
    this.sessions.set(input.sessionId, { ...session, revision, updatedAt: input.committedAt });
    return { ok: true, revision };
  }
  async insertCheckpoint(checkpoint: Checkpoint): Promise<void> {
    this.rows.set(`${checkpoint.sessionId}|${checkpoint.commandId}`, { ...checkpoint, committedBy: { ...checkpoint.committedBy } });
  }

  async byCommandId(sessionId: string, commandId: string): Promise<Checkpoint | undefined> {
    const found = this.rows.get(`${sessionId}|${commandId}`);
    return found ? { ...found, committedBy: { ...found.committedBy } } : undefined;
  }

  async checkpoints(sessionId: string): Promise<Checkpoint[]> {
    return [...this.rows.values()]
      .filter((c) => c.sessionId === sessionId)
      .map((c) => ({ ...c, committedBy: { ...c.committedBy } }))
      .sort((a, b) => a.revision - b.revision);
  }

  static releasedRevisions(pins: readonly { conceptId: string; sourceVersion: string }[]): SourceRevisionLookup {
    const known = new Set(pins.map((p) => `${p.conceptId}@${p.sourceVersion}`));
    return {
      async isReleasedRevision(conceptId: string, sourceVersion: string): Promise<boolean> {
        return known.has(`${conceptId}@${sourceVersion}`);
      },
    };
  }
}
