// AI-17 (KAN-155) — natural two-way voice tutoring with interruption and safe
// actions over the same authorized session.
//
// The checkpoint here is the server-owned voice-session contract (the ASR/TTS
// provider adapters and locale qualification are SEAMS the integration
// supplies; providers are NEVER part of the contract):
//   - EXPLICIT MIC CONSENT/STATUS: a session opens only with recorded mic
//     consent and a qualified locale (the AI-18 matrix decides locale
//     coverage). No always-on recording; raw audio is never retained.
//   - INTERIM VS FINAL: interim transcripts are NEVER input — only FINAL
//     recognized speech advances the turn, with interim/final transcript and
//     audio sequence ids. STALE AUDIO (reordered/old sequence) is suppressed.
//   - INTERRUPTION/STOP/CANCEL are acknowledged and bounded: interrupting
//     cancels the in-flight assistant turn; readback/confirmation is REQUIRED
//     before uncertain numbers/units become input (never auto-committed).
//   - SAFE ACTIONS ONLY: an allowlist; consequential Build accept/share/export
//     require an explicit confirm bound to the EXACT revision (revision-moved
//     blocks). Final recognized speech is INPUT, never assessment or
//     permission authority.
//   - BOUNDS + REAUTHORIZE + PRIVACY: stream/deadline/concurrency/audio/token
//     cost are bounded; reconnect/output reauthorize; account switch and
//     revocation fail closed; no voice cloning and no automatic raw-audio
//     training.
export interface VoiceOwner {
  uid: string;
  workspaceId: string;
}

export type MicState = 'off' | 'listening' | 'speaking';

export interface MicConsent {
  owner: VoiceOwner;
  consented: boolean;
  status: MicState;
  recordedAt: string;
}

export type TurnStatus = 'transcribing' | 'finalized' | 'interrupted' | 'cancelled' | 'awaiting_readback';

export interface VoiceTurn {
  turnId: string;
  sessionId: string;
  seq: number;
  interimTranscript: string;
  finalTranscript: string | null;
  finalAt: string | null;
  audioSeqId: number;
  status: TurnStatus;
  readbackRequested: boolean;
  readbackConfirmed: boolean;
}

export interface InterruptionAck {
  ackId: string;
  sessionId: string;
  cancelledTurnSeq: number;
  acknowledgedAt: string;
}

export type SafeActionName =
  | 'reveal-step-hint'
  | 'advance-question'
  | 're-read-source'
  | 'build-accept'
  | 'share'
  | 'export';

/** A consequential action must be confirmed against the EXACT project revision. */
export interface ActionTarget {
  kind: SafeActionName;
  projectId?: string;
  revisionNo?: number;
}

export interface VoiceSession {
  sessionId: string;
  owner: VoiceOwner;
  locale: string;
  coveredLocale: boolean;
  startsAt: string;
  turns: number;
  audioCostTokens: number;
  closed: boolean;
}

export interface PrivacyPolicy {
  rawAudioRetained: false;
  alwaysOnRecording: false;
  voiceCloning: false;
  automaticRawAudioTraining: false;
  /** Only approved transcript + audio metadata is retained. */
  retainedMetadata: readonly string[];
}

export type VoiceSessionErrorCode =
  | 'not_owner'
  | 'mic_consent_missing'
  | 'locale_not_qualified'
  | 'session_closed'
  | 'stale_audio'
  | 'unknown_turn'
  | 'readback_pending'
  | 'action_not_allowed'
  | 'action_requires_confirm'
  | 'revision_moved'
  | 'max_turns_exceeded'
  | 'concurrency_exceeded'
  | 'deadline_exceeded'
  | 'token_budget_exceeded'
  | 'revoked';

export class VoiceSessionError extends Error {
  constructor(public readonly code: VoiceSessionErrorCode) {
    super(code);
  }
}
