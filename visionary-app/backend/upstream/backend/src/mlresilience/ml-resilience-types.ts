// AI-09 (KAN-91) — remove raw private-text logging; classroom/NAT fairness,
// provider 429/outage handling, and policy revocation honored mid-run.
//
// The checkpoint here is private, fair, revocation-honest ML operations:
//   - NO RAW PRIVATE TEXT IN LOGS: every log record passes the redactor —
//     raw learner text (query/response/retrieved context) is replaced with
//     typed, length-noting placeholders; the redacted log carries NO raw
//     private text (provable: the original strings appear nowhere).
//   - PROVIDER FAIRNESS (classroom/NAT): many learners behind one shared
//     egress (a classroom or NAT) get FAIR access — a per-egress fairness
//     limiter refuses when the shared window is exhausted, instead of one
//     learner starving the rest (fail closed with an honest retry-after).
//   - PROVIDER 429/OUTAGE: a rate-limited (429) or unavailable provider is
//     backed off honestly — no retry storms; the refusal carries the retry
//     budget state and never silently degrades to another provider.
//   - POLICY REVOCATION MID-RUN: a policy/consent revoked while a run is in
//     flight stops the run at the next checkpoint — produced partial stays
//     partial (KAN-90 semantics), the outcome records `policy_revoked`, and
//     no further provider work happens for that caller.
//
// Exit: evaluated, authorized assistance with bounded costs and no cross-user
// leakage.

/** The authenticated ML caller. */
export interface MlRunCaller {
  uid: string;
  workspaceId: string;
  /** Shared egress identity (classroom/NAT) for fairness accounting. */
  egressId: string;
}

/** A redacted log record — provably free of raw private text. */
export interface RedactedLogRecord {
  event: string;
  /** Typed placeholders, e.g. "learner_text:<len:42>". */
  fields: Record<string, string | number>;
  at: string;
}

/** The run outcome under mid-run policy revocation. */
export interface RevokedRunOutcome {
  runId: string;
  stopped: true;
  reason: 'policy_revoked';
  /** Produced partial stays partial (never presented as final). */
  partialBody: unknown | null;
  final: false;
}

export class ResilienceError extends Error {
  constructor(
    public readonly code:
      | 'raw_text_in_log'
      | 'egress_window_exhausted'
      | 'provider_rate_limited'
      | 'provider_outage'
      | 'policy_revoked'
  ) {
    super(code);
  }
}
