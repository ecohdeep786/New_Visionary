// PLAT-07 (KAN-51) — redacted traces/metrics, synthetic health checks and
// bounded dashboards for the product's routine logs.
//
// Design constraints (server-owned; privacy-first; fail closed):
//   - REDACTION IS FAIL-CLOSED: a log record carrying a field whose key or
//     value touches prompt bodies, payment secrets/tokens, raw private
//     learning text or criterion self-review content REFUSES to emit
//     (`redacted_field_forbidden`) — sensitive content can never enter the
//     routine log stream, silently or otherwise. Redaction is never a silent
//     drop: the emit fails and the caller must log without the field.
//   - TYPED LEVELS/EVENTS: only declared levels and event kinds reach the
//     stream; unknown kinds refuse (`log_invalid`).
//   - METRICS ARE BOUNDED: the dashboard summary derives p50/p95 latency,
//     error rate, queue depth and cost estimate from the emitted stream with
//     explicit bounds; a metric outside its declared bound refuses
//     (`metric_out_of_bounds`).
//   - SYNTHETIC HEALTH CHECKS: named checks report healthy|degraded|down with
//     a latency inside the check's declared budget; a check exceeding its
//     budget degrades automatically (`health_budget_exceeded` — recorded, not
//     thrown; the check result IS the observation).
//   - TAMPER-EVIDENT STREAM: every append advances a byte-stable digest; the
//     dashboard summary carries the digest it was computed from, so a summary
//     can always be proven to belong to its log prefix.
//   - OPERATOR-SCOPED READS: dashboards and health are operator-readable only
//     (`not_operator` for product actors — uniform, no leak).
export interface Operator {
  uid: string;
  role: 'operator' | 'learner' | 'teacher' | 'guardian' | 'professional' | 'organization';
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Declared event kinds for the routine stream (bounded vocabulary). */
export type LogEvent =
  | 'http_request'
  | 'command_accepted'
  | 'command_denied'
  | 'job_enqueued'
  | 'job_completed'
  | 'health_check';

/** A routine log record: bounded fields, no free-form sensitive content. */
export interface LogRecord {
  logId: string;
  level: LogLevel;
  event: LogEvent;
  /** Bounded field keys/values (redaction-enforced at emit). */
  fields: Record<string, string | number | boolean>;
  latencyMs?: number;
  at: string;
}

/** The fail-closed redaction policy (versioned; named approver). */
export interface RedactionPolicy {
  policyId: string;
  version: number;
  /** Field-key substrings that may never be logged. */
  deniedKeyPatterns: readonly string[];
  /** Value substrings that may never be logged even under safe keys. */
  deniedValuePatterns: readonly string[];
  approvedBy: string | null;
}

/** A synthetic health check observation. */
export interface HealthObservation {
  checkId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  /** Declared latency budget for this check (ms). */
  budgetMs: number;
  at: string;
}

/** The bounded dashboard summary (latency/error/queue/cost). */
export interface DashboardSummary {
  summaryId: string;
  windowRecords: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  queueDepth: number;
  costEstimateUsd: number;
  /** Digest of the log prefix this summary was computed from. */
  digest: string;
  generatedAt: string;
}

export class ObservabilityError extends Error {
  readonly code:
    | 'not_operator'
    | 'log_invalid'
    | 'redacted_field_forbidden'
    | 'policy_unknown'
    | 'policy_not_approved'
    | 'metric_out_of_bounds'
    | 'health_unknown'
    | 'check_invalid';
  constructor(code: ObservabilityError['code']) {
    super(code);
    this.code = code;
  }
}
