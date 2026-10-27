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
