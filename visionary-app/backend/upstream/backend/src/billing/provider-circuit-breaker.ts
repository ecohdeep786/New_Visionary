import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Billing provider circuit breaker (launch-operations.md: "Give billing its own
// queue and provider circuit breaker"). The provider read-back path
// (subscription/invoice/payment lookups) is the one dependency whose sustained
// failure must NOT translate into a per-request timeout storm: once the
// provider is failing, further calls fail fast with a typed 503 instead of
// queueing work that cannot succeed, and the breaker half-opens after a cooling
// window to probe recovery on a single request.
//
// The state is held in-process but keyed per instance, which is honest for the
// single-connection runtime: the shared, cross-instance budget for *admitted
// work* remains the Firestore-transactional rate limiter. This breaker bounds
// outbound calls to one provider; it does not claim to bound a global fleet.
export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitSnapshot {
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
  reopened: number;
}

const FAILURE_THRESHOLD = 3;      // consecutive provider failures before opening
const DEFAULT_COOLING_MS = 15_000; // open window before a single half-open probe

@Injectable()
export class ProviderCircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt: number | null = null;
  private probeInFlight = false;
  private reopened = 0;
  constructor(private readonly config: ConfigService) {}

  private enabled(): boolean {
    // Explicitly opt-out-able for tests; on by default in every real mode.
    return this.config.get('BILLING_PROVIDER_BREAKER') !== 'disabled';
  }

  // The cooling window is deployment-tunable (a breaker is operated, not just
  // written): an operator can shorten it during a provider incident review or
  // lengthen it when the provider's recovery is known to be slow. An absent,
  // empty, non-numeric or negative value falls back to the documented default —
  // in particular an accidentally-empty environment variable must NOT be read as
  // a zero-length window, which would defeat the breaker's protection.
  private coolingMs(): number {
    const raw = this.config.get('BILLING_PROVIDER_BREAKER_COOLING_MS');
    if (typeof raw !== 'string' || raw.trim() === '') return DEFAULT_COOLING_MS;
    const configured = Number(raw);
    return Number.isInteger(configured) && configured >= 0 ? configured : DEFAULT_COOLING_MS;
  }

  snapshot(): CircuitSnapshot {
    return { state: this.state, consecutiveFailures: this.failures, openedAt: this.openedAt, reopened: this.reopened };
  }

  /** Reject fast while open; allow one probe once the cooling window elapses. */
  admit(): void {
    if (!this.enabled()) return;
    if (this.state === 'closed') return;
    if (this.state === 'open') {
      if (this.openedAt !== null && Date.now() - this.openedAt >= this.coolingMs()) {
        this.state = 'half_open';
        this.probeInFlight = false;
      } else {
        throw new ServiceUnavailableException('The payment provider is temporarily unavailable. Your saved payment status is unchanged; retry shortly.');
      }
    }
    if (this.state === 'half_open') {
      if (this.probeInFlight) throw new ServiceUnavailableException('The payment provider is recovering. Retry shortly.');
      this.probeInFlight = true;
    }
  }

  /** Record the outcome of an admitted call. */
  settle(ok: boolean): void {
    if (!this.enabled()) return;
    this.probeInFlight = false;
    if (ok) { this.state = 'closed'; this.failures = 0; this.openedAt = null; return; }
    this.failures += 1;
    if (this.state === 'half_open' || this.failures >= FAILURE_THRESHOLD) {
      if (this.state !== 'open') this.reopened += 1;
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}
