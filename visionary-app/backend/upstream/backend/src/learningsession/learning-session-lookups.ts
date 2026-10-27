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
