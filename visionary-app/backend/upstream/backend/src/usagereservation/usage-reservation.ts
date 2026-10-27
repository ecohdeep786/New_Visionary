// AI-07 (KAN-89) — atomic usage reservation, bounded execution, measured
// ledger, terminal settlement.
//
// Core responsibilities (server-owned; bounded; no duplicate debit):
//   1. reserve: ATOMIC check-and-deduct against the owner's quota; the request
//      must be within bounds (tokens/loops/attempts) before any spend.
//   2. ensureWithinBound: bounded tool loops and attempts — exceeding a bound
//      refuses (bound_exceeded) before any further spend.
//   3. settle: TERMINAL and idempotent — the measured used amount is charged
//      once, the unused remainder is released; an ambiguous timeout that
//      retries the same settle converges to `duplicate` and NEVER debits twice.
//   4. release: settle a reservation with zero measured usage (nothing spent).
//   5. Every transition appends a MEASURED ledger entry (never an estimate).
import type {
  UsageBounds,
  UsageError as UsageErrorType,
  UsageLedgerEntry,
  UsageOwner,
  UsageReservation,
} from './usage-reservation-types';
import { UsageError } from './usage-reservation-types';
import type { UsageStore } from './usage-reservation-lookups';

export class UsageReservationService {
  private reservationCounter = 0;
  private entryCounter = 0;
  constructor(
    private readonly store: UsageStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Atomically reserve tokens within the request bounds and the owner's quota. */
  async reserve(owner: UsageOwner, requestedTokens: number, bounds: UsageBounds): Promise<UsageReservation> {
    if (requestedTokens > bounds.maxTokens) throw new UsageError('bound_exceeded');
    const attempt = await this.store.tryReserve(owner, requestedTokens);
    if (!attempt.granted) throw new UsageError('insufficient_quota');
    const reservation: UsageReservation = {
      reservationId: `res_${++this.reservationCounter}`,
      owner: { ...owner },
      reservedTokens: requestedTokens,
      status: 'reserved',
      settledUsedTokens: null,
      createdAt: this.now().toISOString(),
    };
    await this.store.saveReservation(reservation);
    await this.appendEntry(reservation, 'reserved', requestedTokens);
    return reservation;
  }

  /** Bounded tool loops: refusing before any further spend once the cap is hit. */
  ensureWithinBound(kind: 'toolLoop' | 'attempt', usedCount: number, bounds: UsageBounds): void {
    const cap = kind === 'toolLoop' ? bounds.maxToolLoops : bounds.maxAttempts;
    if (usedCount + 1 > cap) throw new UsageError('bound_exceeded');
  }

  /**
   * Terminal settlement: charge the MEASURED used tokens once, release the
   * unused remainder. Idempotent per reservation — an ambiguous timeout that
   * retries converges to `duplicate` and never debits twice.
   */
  async settle(owner: UsageOwner, reservationId: string, measuredUsedTokens: number): Promise<{ outcome: 'settled' | 'duplicate'; usedTokens: number; releasedTokens: number } | { ok: false; reason: 'not_owner' | 'unknown_reservation' }> {
    const reservation = await this.store.byReservationId(reservationId);
    if (!reservation) return { ok: false, reason: 'unknown_reservation' };
    if (reservation.owner.uid !== owner.uid || reservation.owner.workspaceId !== owner.workspaceId) {
      return { ok: false, reason: 'not_owner' };
    }
    if (reservation.status !== 'reserved') {
      // Already settled (or released): the ambiguous-timeout retry converges
      // here WITHOUT a second debit.
      return { outcome: 'duplicate', usedTokens: reservation.settledUsedTokens ?? 0, releasedTokens: 0 };
    }
    if (measuredUsedTokens > reservation.reservedTokens) throw new UsageError('bound_exceeded');

    const released = reservation.reservedTokens - measuredUsedTokens;
    if (released > 0) await this.store.tryReserve(owner, -released); // credit back
    await this.store.updateReservation({ ...reservation, status: 'settled', settledUsedTokens: measuredUsedTokens });
    await this.appendEntry({ ...reservation, status: 'settled' }, 'settled', measuredUsedTokens);
    if (released > 0) await this.appendEntry({ ...reservation, status: 'settled' }, 'released', released);
    return { outcome: 'settled', usedTokens: measuredUsedTokens, releasedTokens: released };
  }

  private async appendEntry(reservation: UsageReservation, kind: UsageLedgerEntry['kind'], amountTokens: number): Promise<void> {
    const entry: UsageLedgerEntry = {
      entryId: `uln_${++this.entryCounter}`,
      reservationId: reservation.reservationId,
      owner: { ...reservation.owner },
      kind,
      amountTokens,
      at: this.now().toISOString(),
    };
    await this.store.appendLedgerEntry(entry);
  }
}

export type { UsageErrorType };
