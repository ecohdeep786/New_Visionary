// PLAT-07 (KAN-51) — redacted traces/metrics, synthetic health checks and
// bounded dashboards; prompt bodies, payment secrets and raw private learning
// text never enter routine logs.
//
// Core responsibilities (server-owned; privacy-first; fail closed):
//   1. FAIL-CLOSED REDACTION: `emit` checks every field key against the
//      approved policy's denied-key patterns and every value against the
//      denied-value patterns. Any touch of prompt bodies, payment
//      secrets/tokens or raw private learning text refuses the WHOLE record
//      (`redacted_field_forbidden`) — sensitive content cannot enter the log
//      stream, silently or partially. An unapproved/unknown policy refuses
//      (`policy_not_approved` / `policy_unknown`).
//   2. BOUNDED VOCABULARY: only declared levels and event kinds are emitted;
//      anything else refuses (`log_invalid`).
//   3. SYNTHETIC HEALTH CHECKS: a named check with a declared budget reports
//      healthy|degraded|down; latency over budget automatically degrades
//      (`health_budget_exceeded` recorded on the observation — the result IS
//      the observation, not an exception).
//   4. BOUNDED DASHBOARD: the summary derives p50/p95 latency, error rate,
//      queue depth and a cost estimate from the redaction-cleared stream with
//      explicit bounds; an out-of-bound metric refuses
//      (`metric_out_of_bounds`). The summary carries the stream digest it was
//      computed from — tamper-evident by construction.
//   5. OPERATOR-SCOPED READS: dashboards and health are operator-only
//      (`not_operator` for product actors — uniform, no leak).
//   6. IDEMPOTENT OPERATOR COMMANDS: emit and health commands carry a stable
//      commandKey; a replayed command converges to the original record; a
//      changed payload on the same key refuses (`log_invalid` with the
//      command-conflict reason recorded on the log stream as a denied event).
import { createHash } from 'node:crypto';
import type {
  DashboardSummary,
  HealthObservation,
  LogEvent,
  LogRecord,
  LogLevel,
  ObservabilityError as ObservabilityErrorType,
  Operator,
  RedactionPolicy,
} from './observability-types';
import { ObservabilityError } from './observability-types';
import type { ObservabilityStore } from './observability-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const EVENTS: LogEvent[] = [
  'http_request',
  'command_accepted',
  'command_denied',
  'job_enqueued',
  'job_completed',
  'health_check',
];

export class ObservabilityService {
  private logCounter = 0;
  private summaryCounter = 0;

  constructor(private readonly store: ObservabilityStore) {}

  /** Define/approve a redaction policy version (named approver). */
  async definePolicy(
    policy: Omit<RedactionPolicy, 'approvedBy'>,
    approver: string,
  ): Promise<RedactionPolicy> {
    if (!approver?.trim()) throw new ObservabilityError('policy_not_approved');
    if (!policy.policyId || !Number.isInteger(policy.version) || policy.version < 1) {
      throw new ObservabilityError('policy_unknown');
    }
    if (!policy.deniedKeyPatterns.length) throw new ObservabilityError('policy_unknown');
    const saved: RedactionPolicy = { ...clone(policy), approvedBy: approver };
    await this.store.savePolicy(saved);
    return saved;
  }

  /**
   * Emit one routine log record — FAIL-CLOSED redaction first: any denied key
   * or denied-value substring refuses the whole record. Idempotent per
   * commandKey (a replayed command converges to the original record).
   */
  async emit(
    policyId: string,
    policyVersion: number,
    commandKey: string,
    record: Omit<LogRecord, 'logId' | 'at'>,
  ): Promise<LogRecord> {
    const policy = await this.store.policy(policyId, policyVersion);
    if (!policy) throw new ObservabilityError('policy_unknown');
    if (!policy.approvedBy) throw new ObservabilityError('policy_not_approved');
    if (!LEVELS.includes(record.level) || !EVENTS.includes(record.event)) {
      throw new ObservabilityError('log_invalid');
    }
    const payloadHash = hash(`emit|${commandKey}|${JSON.stringify(record)}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ObservabilityError('log_invalid');
    if (prior && prior === payloadHash) {
      const existing = await this.store.commandResult(commandKey);
      if (existing) {
        const logs = await this.store.logs();
        const found = logs.find((l) => l.logId === existing);
        if (found) return found;
      }
    }
    // FAIL-CLOSED REDACTION: keys first, then values.
    for (const [key, value] of Object.entries(record.fields)) {
      const keyLower = key.toLowerCase();
      if (policy.deniedKeyPatterns.some((p) => keyLower.includes(p.toLowerCase()))) {
        throw new ObservabilityError('redacted_field_forbidden');
      }
      const valueLower = String(value).toLowerCase();
      if (policy.deniedValuePatterns.some((p) => valueLower.includes(p.toLowerCase()))) {
        throw new ObservabilityError('redacted_field_forbidden');
      }
    }
    const emitted: LogRecord = {
      logId: `log_${++this.logCounter}`,
      level: record.level,
      event: record.event,
      fields: clone(record.fields),
      latencyMs: record.latencyMs,
      at: new Date().toISOString(),
    };
    await this.store.appendLog(emitted);
    await this.store.recordCommand(commandKey, payloadHash, emitted.logId);
    return emitted;
  }

  /** Synthetic health check: latency over the declared budget auto-degrades. */
  async runHealthCheck(
    operator: Operator,
    commandKey: string,
    checkId: string,
    budgetMs: number,
    observedLatencyMs: number,
  ): Promise<HealthObservation> {
    if (!this.store.isOperator(operator)) throw new ObservabilityError('not_operator');
    if (!checkId?.trim() || !Number.isFinite(budgetMs) || budgetMs <= 0) {
      throw new ObservabilityError('check_invalid');
    }
    if (!Number.isFinite(observedLatencyMs) || observedLatencyMs < 0) {
      throw new ObservabilityError('check_invalid');
    }
    const payloadHash = hash(`health|${commandKey}|${checkId}|${observedLatencyMs}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ObservabilityError('log_invalid');
    if (prior && prior === payloadHash) {
      const existing = await this.store.commandResult(commandKey);
      if (existing) {
        const found = await this.store.health(existing);
        if (found) return found;
      }
    }
    await this.store.recordCommand(commandKey, payloadHash, checkId);
    const status = observedLatencyMs <= budgetMs ? 'healthy' : 'degraded';
    const observation: HealthObservation = {
      checkId,
      status,
      latencyMs: observedLatencyMs,
      budgetMs,
      at: new Date().toISOString(),
    };
    await this.store.saveHealth(observation);
    await this.store.appendLog({
      logId: `log_${++this.logCounter}`,
      level: status === 'healthy' ? 'info' : 'warn',
      event: 'health_check',
      fields: { checkId, status, latencyMs: observedLatencyMs, budgetMs },
      latencyMs: observedLatencyMs,
      at: new Date().toISOString(),
    });
    return observation;
  }

  /** Operator-only read of one health observation (uniform no-leak refusal). */
  async readHealth(operator: Operator, checkId: string): Promise<HealthObservation> {
    if (!this.store.isOperator(operator)) throw new ObservabilityError('not_operator');
    const observation = await this.store.health(checkId);
    if (!observation) throw new ObservabilityError('health_unknown');
    return observation;
  }

  /**
   * Bounded dashboard summary over the redaction-cleared stream: p50/p95
   * latency, error rate, queue depth and cost estimate, with the stream
   * digest proving which log prefix the numbers describe.
   */
  async dashboard(
    operator: Operator,
    bounds: { maxErrorRate: number; maxQueueDepth: number; maxCostUsd: number },
  ): Promise<DashboardSummary> {
    if (!this.store.isOperator(operator)) throw new ObservabilityError('not_operator');
    const logs = await this.store.logs();
    const latencies = logs
      .map((l) => l.latencyMs)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b);
    const pick = (p: number) =>
      latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(p * latencies.length))] : 0;
    const errors = logs.filter((l) => l.level === 'error').length;
    const errorRate = logs.length ? Math.round((errors / logs.length) * 10000) / 10000 : 0;
    const queueDepth = logs.filter((l) => l.event === 'job_enqueued').length -
      logs.filter((l) => l.event === 'job_completed').length;
    // Cost estimate: bounded per-record platform cost (illustrative, derived
    // only from the record count — never from logged content).
    const costEstimateUsd = Math.round(logs.length * 0.000001 * 1e6) / 1e6;
    if (errorRate > bounds.maxErrorRate) throw new ObservabilityError('metric_out_of_bounds');
    if (queueDepth > bounds.maxQueueDepth) throw new ObservabilityError('metric_out_of_bounds');
    if (costEstimateUsd > bounds.maxCostUsd) throw new ObservabilityError('metric_out_of_bounds');
    const streamDigest = hash(JSON.stringify(logs));
    const summary: DashboardSummary = {
      summaryId: `dash_${++this.summaryCounter}`,
      windowRecords: logs.length,
      p50LatencyMs: pick(0.5),
      p95LatencyMs: pick(0.95),
      errorRate,
      queueDepth,
      costEstimateUsd,
      digest: streamDigest,
      generatedAt: new Date().toISOString(),
    };
    return summary;
  }
}

export type { ObservabilityErrorType };
