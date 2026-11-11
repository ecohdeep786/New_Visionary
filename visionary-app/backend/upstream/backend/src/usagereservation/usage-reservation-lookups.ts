// AI-07 (KAN-89) — the usage domain's typed state seams. The owning store
// (quota balances, reservations, measured ledger) implements this at
// integration; the in-memory implementation is contract-true: the reservation
// critical section is synchronous (the SQL adapter mirrors it with a
// transaction), so two concurrent reservations can never both consume the last
// unit.
import type { UsageLedgerEntry, UsageOwner, UsageReservation } from './usage-reservation-types';

export interface UsageStore {
  /**
   * ATOMIC check-and-deduct: quota check + deduction in ONE critical section.
   * Returns granted=false with the remaining balance when quota is insufficient.
   */
  tryReserve(owner: UsageOwner, amountTokens: number): Promise<{ granted: boolean; remaining: number }>;
  /** ATOMIC terminal settlement: conditional on the reservation's status being
   * 'reserved' — credits the remainder and marks settled TOGETHER, so two
   * concurrent settles can never both credit (the ambiguous-timeout retry
   * converges to duplicate). (SQL adapter: one UPDATE ... WHERE status =
   * 'reserved' inside the credit transaction.) */
  settleReservation(reservationId: string, measuredUsedTokens: number, settledAt: string): Promise<{ ok: true; releasedTokens: number } | { ok: false; reason: 'not_reserved' }>;
  saveReservation(reservation: UsageReservation): Promise<void>;
  byReservationId(reservationId: string): Promise<UsageReservation | undefined>;
  updateReservation(reservation: UsageReservation): Promise<void>;
  appendLedgerEntry(entry: UsageLedgerEntry): Promise<void>;
  ledgerFor(owner: UsageOwner): Promise<UsageLedgerEntry[]>;
}

/** Contract-true in-memory store; synchronous critical section, append-only ledger. */
export class InMemoryUsageStore implements UsageStore {
  private balances = new Map<string, number>();
  private reservations = new Map<string, UsageReservation>();
  private ledger: UsageLedgerEntry[] = [];

  private key(owner: UsageOwner): string {
    return `${owner.uid}|${owner.workspaceId}`;
  }

  /** Seed a quota balance for tests/integration. */
  seedQuota(owner: UsageOwner, tokens: number): void {
    this.balances.set(this.key(owner), tokens);
  }

  async tryReserve(owner: UsageOwner, amountTokens: number): Promise<{ granted: boolean; remaining: number }> {
    // CRITICAL SECTION: no await between check and deduct (atomic).
    const key = this.key(owner);
    const balance = this.balances.get(key) ?? 0;
    if (balance < amountTokens) {
      return { granted: false, remaining: balance };
    }
    this.balances.set(key, balance - amountTokens);
    return { granted: true, remaining: balance - amountTokens };
  }

  async saveReservation(reservation: UsageReservation): Promise<void> {
    this.reservations.set(reservation.reservationId, { ...reservation, owner: { ...reservation.owner } });
  }

  async byReservationId(reservationId: string): Promise<UsageReservation | undefined> {
    const found = this.reservations.get(reservationId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async updateReservation(reservation: UsageReservation): Promise<void> {
    this.reservations.set(reservation.reservationId, { ...reservation, owner: { ...reservation.owner } });
  }

  async settleReservation(reservationId: string, measuredUsedTokens: number, settledAt: string): Promise<{ ok: true; releasedTokens: number } | { ok: false; reason: 'not_reserved' }> {
    // CRITICAL SECTION: no await between the status check, the credit, and the
    // settle mark (atomic — the concurrent second settle converges to duplicate).
    const reservation = this.reservations.get(reservationId);
    if (!reservation || reservation.status !== 'reserved') return { ok: false, reason: 'not_reserved' };
    const released = reservation.reservedTokens - measuredUsedTokens;
    if (released > 0) {
      const key = this.key(reservation.owner);
      this.balances.set(key, (this.balances.get(key) ?? 0) + released);
    }
    this.reservations.set(reservationId, { ...reservation, status: 'settled', settledUsedTokens: measuredUsedTokens });
    return { ok: true, releasedTokens: released };
  }
  async appendLedgerEntry(entry: UsageLedgerEntry): Promise<void> {
    // Append-only: the array is replaced with a new tail entry, never rewritten.
    this.ledger = [...this.ledger, { ...entry, owner: { ...entry.owner } }];
  }

  async ledgerFor(owner: UsageOwner): Promise<UsageLedgerEntry[]> {
    return this.ledger
      .filter((e) => e.owner.uid === owner.uid && e.owner.workspaceId === owner.workspaceId)
      .map((e) => ({ ...e, owner: { ...e.owner } }));
  }

  /** Test/integration hook: read a balance without mutating. */
  balanceOf(owner: UsageOwner): number {
    return this.balances.get(this.key(owner)) ?? 0;
  }
}
