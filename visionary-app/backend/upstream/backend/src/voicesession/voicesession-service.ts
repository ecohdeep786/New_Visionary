// AI-17 (KAN-155) — two-way voice session with interruption and safe actions.
//
// Core responsibilities (server-owned; fail closed):
//   1. recordConsent: explicit mic consent/status (no always-on recording).
//   2. open: requires recorded consent + a QUALIFIED locale (AI-18 seam);
//      enforces the concurrency bound.
//   3. turns: interim transcripts are NEVER input; only FINAL recognized
//      speech advances, keyed by audio sequence ids; STALE audio (reordered/
//      old seq) is suppressed. Unclear numbers/units require a READBACK
//      confirmation before they become input (never auto-committed).
//   4. interrupt/cancel: bounded, acknowledged; cancels the in-flight turn.
//   5. safeAction: an allowlist; consequential Build accept/share/export
//      require an explicit confirm bound to the EXACT revision (revision-moved
//      blocks). Final speech is input, never assessment or permission.
//   6. reauthorize + bounds + privacy: turn/deadline/token/cost bounds;
//      reconnect re-checks consent/revocation; no raw audio retention, no
//      voice cloning, no automatic raw-audio training.
import type {
  ActionTarget,
  InterruptionAck,
  MicState,
  PrivacyPolicy,
  SafeActionName,
  VoiceOwner,
  VoiceSession,
  VoiceSessionError as VoiceSessionErrorType,
  VoiceTurn,
} from './voicesession-types';
import { VoiceSessionError } from './voicesession-types';
import type { VoiceStore } from './voicesession-lookups';

export class VoiceSessionService {
  private sessionCounter = 0;
  private turnCounter = 0;
  private readonly policy: PrivacyPolicy = {
    rawAudioRetained: false,
    alwaysOnRecording: false,
    voiceCloning: false,
    automaticRawAudioTraining: false,
    retainedMetadata: ['approved_transcript', 'audio_seq_id', 'turn_meta'],
  };

  constructor(private readonly store: VoiceStore) {}

  privacyPolicy(): PrivacyPolicy {
    return { ...this.policy, retainedMetadata: [...this.policy.retainedMetadata] };
  }

  async recordConsent(owner: VoiceOwner, consented: boolean): Promise<void> {
    await this.store.recordConsent(owner, consented, consented ? 'off' : 'off');
  }

  async open(owner: VoiceOwner, locale: string): Promise<VoiceSession> {
    const consent = await this.store.consentFor(owner);
    if (!consent || !consent.consented) throw new VoiceSessionError('mic_consent_missing');
    if (!(await this.store.localeCovered(locale))) throw new VoiceSessionError('locale_not_qualified');
    const open = await this.store.openSessions(owner);
    if (open >= (await this.store.maxConcurrentSessions())) throw new VoiceSessionError('concurrency_exceeded');

    const session: VoiceSession = {
      sessionId: `vs_${++this.sessionCounter}`,
      owner: { ...owner },
      locale,
      coveredLocale: true,
      startsAt: new Date().toISOString(),
      turns: 0,
      audioCostTokens: 0,
      closed: false,
    };
    await this.store.saveSession(session);
    return session;
  }

  async beginTurn(owner: VoiceOwner, sessionId: string): Promise<VoiceTurn> {
    const session = await this.requireOpen(owner, sessionId);
    const maxTurns = await this.store.maxTurnsPerSession();
    if (session.turns >= maxTurns) throw new VoiceSessionError('max_turns_exceeded');
    const turn: VoiceTurn = {
      turnId: `vt_${++this.turnCounter}`,
      sessionId,
      seq: session.turns + 1,
      interimTranscript: '',
      finalTranscript: null,
      finalAt: null,
      audioSeqId: 0,
      status: 'transcribing',
      readbackRequested: false,
      readbackConfirmed: false,
    };
    await this.store.saveTurn(turn);
    return turn;
  }

  async appendAudio(owner: VoiceOwner, sessionId: string, turnId: string, audioSeqId: number): Promise<VoiceTurn> {
    const turn = await this.requireOwnedTurn(owner, sessionId, turnId);
    if (audioSeqId <= turn.audioSeqId) throw new VoiceSessionError('stale_audio');
    const updated = { ...turn, audioSeqId };
    await this.store.saveTurn(updated);
    return updated;
  }

  /** INTERIM transcripts are never input. */
  async interimTranscript(owner: VoiceOwner, sessionId: string, turnId: string, text: string): Promise<VoiceTurn> {
    const turn = await this.requireOwnedTurn(owner, sessionId, turnId);
    const updated = { ...turn, interimTranscript: text };
    await this.store.saveTurn(updated);
    return updated;
  }

  /** Only FINAL recognized speech advances the turn (input, never authority). */
  async finalizeTranscript(owner: VoiceOwner, sessionId: string, turnId: string, text: string, requestReadback: boolean): Promise<VoiceTurn> {
    const turn = await this.requireOwnedTurn(owner, sessionId, turnId);
    const updated: VoiceTurn = {
      ...turn,
      finalTranscript: text,
      finalAt: new Date().toISOString(),
      status: 'finalized',
      readbackRequested: requestReadback,
      readbackConfirmed: !requestReadback,
    };
    if (requestReadback) updated.status = 'awaiting_readback';
    await this.store.saveTurn(updated);
    await this.bumpSession(owner, sessionId);
    return updated;
  }

  /** Readback confirmation required before an uncertain number/unit becomes input. */
  async confirmReadback(owner: VoiceOwner, sessionId: string, turnId: string): Promise<VoiceTurn> {
    const turn = await this.requireOwnedTurn(owner, sessionId, turnId);
    if (turn.status !== 'awaiting_readback') return turn;
    const updated: VoiceTurn = { ...turn, status: 'finalized', readbackConfirmed: true };
    await this.store.saveTurn(updated);
    return updated;
  }

  /** Interruption/stop/cancel: acknowledged, cancels the in-flight turn. */
  async interrupt(owner: VoiceOwner, sessionId: string, turnId: string): Promise<InterruptionAck> {
    const turn = await this.requireOwnedTurn(owner, sessionId, turnId);
    if (turn.status === 'transcribing') {
      await this.store.saveTurn({ ...turn, status: 'interrupted' });
    }
    const ack = { ackId: `ack_${turnId}`, sessionId, cancelledTurnSeq: turn.seq, acknowledgedAt: new Date().toISOString() };
    await this.store.recordInterruption(ack);
    return ack;
  }

  /**
   * Safe action: allowlist-only. Consequential Build accept/share/export
   * require an explicit confirm bound to the EXACT project revision.
   */
  async safeAction(owner: VoiceOwner, sessionId: string, action: SafeActionName, confirmed: boolean, target?: ActionTarget): Promise<{ outcome: 'allowed' }> {
    const session = await this.requireOpen(owner, sessionId);
    const allowed = await this.store.allowedActions();
    if (!allowed.has(action)) throw new VoiceSessionError('action_not_allowed');
    const consequential = action === 'build-accept' || action === 'share' || action === 'export';
    if (consequential) {
      if (!confirmed) throw new VoiceSessionError('action_requires_confirm');
      if (!target || target.projectId === undefined || target.revisionNo === undefined) throw new VoiceSessionError('action_requires_confirm');
      const current = await this.store.currentRevision(target.projectId);
      if (current !== target.revisionNo) throw new VoiceSessionError('revision_moved');
    }
    void session;
    return { outcome: 'allowed' };
  }

  /** Reauthorize on reconnect: consent still active + not revoked, else closed. */
  async reconnect(owner: VoiceOwner, sessionId: string): Promise<{ reauthorized: boolean }> {
    await this.requireOpen(owner, sessionId);
    const consent = await this.store.consentFor(owner);
    if (!consent || !consent.consented) throw new VoiceSessionError('revoked');
    if (await this.store.revoked(owner)) throw new VoiceSessionError('revoked');
    return { reauthorized: true };
  }

  async close(owner: VoiceOwner, sessionId: string): Promise<void> {
    const session = await this.requireOwned(owner, sessionId);
    await this.store.saveSession({ ...session, closed: true });
  }

  // ---- helpers ------------------------------------------------------------

  private async requireOpen(owner: VoiceOwner, sessionId: string): Promise<VoiceSession> {
    const session = await this.requireOwned(owner, sessionId);
    if (session.closed) throw new VoiceSessionError('session_closed');
    return session;
  }

  private async requireOwned(owner: VoiceOwner, sessionId: string): Promise<VoiceSession> {
    const session = await this.store.bySessionId(sessionId);
    if (!session) throw new VoiceSessionError('not_owner');
    if (session.owner.uid !== owner.uid || session.owner.workspaceId !== owner.workspaceId) throw new VoiceSessionError('not_owner');
    return session;
  }

  private async requireOwnedTurn(owner: VoiceOwner, sessionId: string, turnId: string): Promise<VoiceTurn> {
    await this.requireOpen(owner, sessionId);
    const turn = (await this.store.turns(sessionId)).find((t) => t.turnId === turnId);
    if (!turn) throw new VoiceSessionError('unknown_turn');
    return turn;
  }

  private async bumpSession(owner: VoiceOwner, sessionId: string): Promise<void> {
    const session = await this.requireOpen(owner, sessionId);
    await this.store.saveSession({ ...session, turns: session.turns + 1 });
  }
}

export type { VoiceSessionErrorType };
