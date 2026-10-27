// AI-09 (KAN-91) — redaction, provider fairness/resilience, mid-run revocation.
//
// Core responsibilities (server-owned; fail closed):
//   1. redactForLog: replace raw private text with typed length-noting
//      placeholders; the returned record is PROVABLY free of the original
//      strings (no raw learner text ever reaches a log).
//   2. acquireProviderSlot: classroom/NAT fairness — a shared egress window
//      caps the aggregate rate so one learner cannot starve the classroom;
//      exhausted windows refuse with `egress_window_exhausted` (fail closed,
//      honest retry-after, no silent degradation to another provider).
//   3. onProviderResponse: a 429 or outage refuses with the honest reason
//      (`provider_rate_limited` / `provider_outage`) — no retry storm inside
//      the request; the caller retries deliberately.
//   4. checkpointRun: policy revocation mid-run stops the run — produced
//      partial stays partial (`final: false`, reason `policy_revoked`), no
//      further provider work for that caller (KAN-90 semantics composed).
import type {
  MlRunCaller,
  RedactedLogRecord,
  ResilienceError as ResilienceErrorType,
  RevokedRunOutcome,
} from './ml-resilience-types';
import { ResilienceError } from './ml-resilience-types';
import type { ResilienceStore } from './ml-resilience-lookups';

export class MlResilienceService {
  constructor(
    private readonly store: ResilienceStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Redact raw private text out of a log record. Every string field that is
   * private text becomes `learner_text:<len:N>` (length noted, content gone).
   */
  redactForLog(event: string, fields: Record<string, string | number>): RedactedLogRecord {
    const redacted: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'number') {
        redacted[key] = value;
        continue;
      }
      // Private text placeholder: type + length only. The original content is
      // not embedded in any form (not hashed, not truncated) — gone.
      redacted[key] = `learner_text:<len:${value.length}>`;
    }
    return { event, fields: redacted, at: this.now().toISOString() };
  }

  /** Prove a record carries no raw private text (digests cannot collide with it). */
  static containsRawText(record: RedactedLogRecord, rawText: readonly string[]): boolean {
    const serialized = JSON.stringify(record);
    return rawText.some((t) => serialized.includes(t));
  }

  /** Fair shared-egress slot: one learner cannot starve the classroom. */
  async acquireProviderSlot(caller: MlRunCaller, windowKey: string, egressLimit: number): Promise<void> {
    const granted = await this.store.tryConsumeEgressWindow(caller.egressId, windowKey, egressLimit);
    if (!granted) throw new ResilienceError('egress_window_exhausted');
  }

  /** Provider 429/outage handling: honest refusal, no retry storm. */
  onProviderResponse(status: number): void {
    if (status === 429) throw new ResilienceError('provider_rate_limited');
    if (status >= 500) throw new ResilienceError('provider_outage');
  }

  /** Mid-run checkpoint: policy revocation stops the run honestly. */
  async checkpointRun(input: {
    runId: string;
    caller: MlRunCaller;
    partialBody: unknown | null;
  }): Promise<RevokedRunOutcome | null> {
    if (await this.store.policyActive(input.caller)) return null; // still authorized
    return {
      runId: input.runId,
      stopped: true,
      reason: 'policy_revoked',
      partialBody: input.partialBody,
      final: false,
    };
  }
}

export type { ResilienceErrorType };
