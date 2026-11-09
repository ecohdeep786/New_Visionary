import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Enforced spend admission (launch-operations.md: "Alerts-only budgets are not
// spending caps; assess supported-service spend caps separately"). No amount of
// alerting enforces a cap; a configured spend cap must actually refuse new
// spend once it would be exceeded, with a typed 503 and a documented retry
// posture, instead of spend-drift being detected long after the fact. This gate
// is the billing-side enforcement half of RELEASE-04: the per-completed-task
// cost measured by scripts/per-task-economics.mjs is what a deployment admits
// against. The real provider/model cost numbers themselves remain a hosted
// gate; here the *enforcement law* is first-party product code and proven
// locally.
//
// Enforcement is a deliberate opt-in because every real composition must choose
// it: `BILLING_SPEND_ADMISSION=enabled` turns the gate on; anything else leaves
// the existing behavior byte-identical (the served product's current test-mode
// runtime is unchanged). Once enabled, a missing, empty, non-numeric or
// non-positive cap is itself a failure — the gate refuses rather than
// interpreting a misconfiguration as "no limit". `BILLING_SPEND_ADMISSION_CAP`
// is the enforced committed-spend ceiling, in the same spend units the
// deployment admits (here, the plan-composed subscription commit value in test
// mode; a live deployment would use its own reviewed unit-cost figure, which is
// a hosted gate). The state is in-process and keyed per instance, which is
// honest for the single-connection runtime; the cross-instance accounting
// ledger stays the owning store.
export type SpendAdmissionState = 'off' | 'enforcing';

export interface SpendAdmissionSnapshot {
  state: SpendAdmissionState;
  cap: number | null;
  committed: number;
  admitted: number;
  refused: number;
}

const REFUSED_MESSAGE = 'Spend admission is not ready. Retry shortly.';

@Injectable()
export class BillingSpendAdmission {
  private committed = 0;
  private admitted = 0;
  private refused = 0;
  constructor(private readonly config: ConfigService) {}

  /** Explicit opt-in; an absent or unrecognized value keeps the current behavior. */
  private enforced(): boolean {
    return this.config.get('BILLING_SPEND_ADMISSION') === 'enabled';
  }

  /** The enforced cap. A missing/empty/non-numeric/non-positive value while
   * enforcement is on is read as a refused configuration, never as "no cap". */
  cap(): number | null {
    const raw = this.config.get('BILLING_SPEND_ADMISSION_CAP');
    if (typeof raw !== 'string' || raw.trim() === '' || !Number.isFinite(Number(raw)) || Number(raw) <= 0) return null;
    return Number(raw);
  }

  snapshot(): SpendAdmissionSnapshot {
    const cap = this.enforced() ? this.cap() : null;
    return { state: this.enforced() ? 'enforcing' : 'off', cap, committed: this.committed, admitted: this.admitted, refused: this.refused };
  }

  /** Admit `costUnits` of new committed spend against the enforced cap. Refuses
   * with a typed 503 (never an alert) when admitting would exceed the cap, or
   * when enforcement is on but the cap is misconfigured. Admitted spend is
   * reserved until `settle` releases it. */
  admit(costUnits: number): boolean {
    if (!this.enforced()) return true;
    const cap = this.cap();
    if (cap === null) {
      this.refused += 1;
      throw new ServiceUnavailableException(REFUSED_MESSAGE);
    }
    if (!Number.isFinite(costUnits) || costUnits < 0) {
      this.refused += 1;
      throw new ServiceUnavailableException(REFUSED_MESSAGE);
    }
    if (this.committed + costUnits > cap) {
      this.refused += 1;
      throw new ServiceUnavailableException(REFUSED_MESSAGE);
    }
    this.committed += costUnits;
    this.admitted += 1;
    return true;
  }

  /** Release reserved spend after the operation settled (e.g. a request that
   * never reached the provider, or a cancelled/refunded charge). */
  settle(costUnits: number): void {
    if (!this.enforced()) return;
    if (!Number.isFinite(costUnits) || costUnits < 0) throw new ServiceUnavailableException(REFUSED_MESSAGE);
    this.committed = Math.max(0, this.committed - costUnits);
  }
}
