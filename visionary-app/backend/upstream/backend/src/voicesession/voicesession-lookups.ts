// AI-17 (KAN-155) — the voice-session store's typed seams: mic consent/status,
// the qualification-coverage seam (composes the AI-18 matrix at integration),
// safe-action allowlist, bounded session state, and the privacy policy.
// The in-memory implementation is contract-true and fails closed.
import type { VoiceOwner, VoiceTurn, VoiceSession, MicConsent, MicState, SafeActionName } from './voicesession-types';

export interface VoiceStore {
  consentFor(owner: VoiceOwner): Promise<MicConsent | undefined>;
  recordConsent(owner: VoiceOwner, consented: boolean, status: MicState): Promise<void>;
  /** True when the AI-18 qualification matrix has covered this locale/route. */
  localeCovered(locale: string): Promise<boolean>;
  allowedActions(): Promise<ReadonlySet<SafeActionName>>;
  maxTurnsPerSession(): Promise<number>;
  maxAudioTokensPerSession(): Promise<number>;
  maxConcurrentSessions(): Promise<number>;
  openSessions(owner: VoiceOwner): Promise<number>;
  saveSession(session: VoiceSession): Promise<void>;
  bySessionId(sessionId: string): Promise<VoiceSession | undefined>;
  saveTurn(turn: VoiceTurn): Promise<void>;
  turns(sessionId: string): Promise<VoiceTurn[]>;
  recordInterruption(ack: { ackId: string; sessionId: string; cancelledTurnSeq: number; acknowledgedAt: string }): Promise<void>;
  /** Exact current revision for a project (Build accept/share/export confirm). */
  currentRevision(projectId: string): Promise<number | undefined>;
  revoked(owner: VoiceOwner): Promise<boolean>;
}

/** Contract-true in-memory voice store; fail-closed, bounds enforced. */
export class InMemoryVoiceStore implements VoiceStore {
  private consents = new Map<string, MicConsent>();
  private qualifiedLocales = new Set<string>();
  private sessions = new Map<string, VoiceSession>();
  private sessionList: VoiceSession[] = [];
  private turnsBySession = new Map<string, VoiceTurn[]>();
  private turnCounter = 0;
  private interruptions: { ackId: string; sessionId: string; cancelledTurnSeq: number; acknowledgedAt: string }[] = [];
  private projectRevisions = new Map<string, number>();
  private revokedOwners = new Set<string>();
  private maxTurns = 10;
  private maxTokens = 2000;
  private maxConcurrent = 2;
  private actions: Set<SafeActionName> = new Set(['reveal-step-hint', 'advance-question', 're-read-source', 'build-accept', 'share', 'export']);

  setQualifiedLocales(list: string[]): void {
    for (const l of list) this.qualifiedLocales.add(l);
  }

  setProjectRevision(projectId: string, revisionNo: number): void {
    this.projectRevisions.set(projectId, revisionNo);
  }

  setRevoked(owner: VoiceOwner, revoked: boolean): void {
    const k = `${owner.uid}|${owner.workspaceId}`;
    if (revoked) this.revokedOwners.add(k);
    else this.revokedOwners.delete(k);
  }

  async consentFor(owner: VoiceOwner): Promise<MicConsent | undefined> {
    return this.consents.get(`${owner.uid}|${owner.workspaceId}`);
  }

  async recordConsent(owner: VoiceOwner, consented: boolean, status: MicState): Promise<void> {
    this.consents.set(`${owner.uid}|${owner.workspaceId}`, { owner: { ...owner }, consented, status, recordedAt: new Date().toISOString() });
  }

  async localeCovered(locale: string): Promise<boolean> {
    return this.qualifiedLocales.has(locale);
  }

  async allowedActions(): Promise<ReadonlySet<SafeActionName>> {
    return new Set(this.actions);
  }

  async maxTurnsPerSession(): Promise<number> {
    return this.maxTurns;
  }

  async maxAudioTokensPerSession(): Promise<number> {
    return this.maxTokens;
  }

  async maxConcurrentSessions(): Promise<number> {
    return this.maxConcurrent;
  }

  async openSessions(owner: VoiceOwner): Promise<number> {
    return this.sessionList.filter((s) => s.owner.uid === owner.uid && s.owner.workspaceId === owner.workspaceId && !s.closed).length;
  }

  async saveSession(session: VoiceSession): Promise<void> {
    this.sessions.set(session.sessionId, { ...session, owner: { ...session.owner } });
    this.sessionList = [...this.sessionList.filter((s) => s.sessionId !== session.sessionId), { ...session, owner: { ...session.owner } }];
  }

  async bySessionId(sessionId: string): Promise<VoiceSession | undefined> {
    const s = this.sessions.get(sessionId);
    return s ? { ...s, owner: { ...s.owner } } : undefined;
  }

  async saveTurn(turn: VoiceTurn): Promise<void> {
    const list = this.turnsBySession.get(turn.sessionId) ?? [];
    this.turnsBySession.set(turn.sessionId, [...list.filter((t) => t.turnId !== turn.turnId), { ...turn }]);
  }

  async turns(sessionId: string): Promise<VoiceTurn[]> {
    return (this.turnsBySession.get(sessionId) ?? []).sort((a, b) => a.seq - b.seq);
  }

  async recordInterruption(ack: { ackId: string; sessionId: string; cancelledTurnSeq: number; acknowledgedAt: string }): Promise<void> {
    this.interruptions = [...this.interruptions, { ...ack }];
  }

  async currentRevision(projectId: string): Promise<number | undefined> {
    return this.projectRevisions.get(projectId);
  }

  async revoked(owner: VoiceOwner): Promise<boolean> {
    return this.revokedOwners.has(`${owner.uid}|${owner.workspaceId}`);
  }
}
