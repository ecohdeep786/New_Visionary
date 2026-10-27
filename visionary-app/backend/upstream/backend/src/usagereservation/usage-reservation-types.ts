// AI-07 (KAN-89) — atomic usage reservation, bounded context/tokens/tool
// loops/attempts, measured usage ledger, terminal settlement and
// ambiguous-timeout reconciliation without duplicate user debit.
//
// The checkpoint here is bounded, measured, honest usage:
//   - Reservation is ATOMIC: the quota check and the deduction happen in one
//     critical section — two concurrent reservations can never both consume the
//     last unit (the SQL adapter mirrors this with a transaction).
//   - Everything is BOUNDED: tokens per request, tool loops, and attempts are
//     capped; exceeding a bound refuses (bound_exceeded) before any spend.
//   - The ledger is MEASURED: every entry records exactly what happened
//     (reserved / settled / released) with the measured amount — never an
//     estimate; entries are append-only and byte-stable.
//   - Settlement is TERMINAL and IDEMPOTENT: a settle applies once per
//     reservation; an ambiguous timeout that retries the same settle converges
//     to the same outcome and NEVER debits the user twice.
//   - No cross-user leakage: a reservation/quota belongs to exactly one
//     uid+workspace; another user's activity cannot touch it.
//
// Exit: evaluated, authorized assistance with bounded costs and no cross-user
// leakage.

/** Server-owned usage authority. */
export interface UsageOwner {
  uid: string;
  workspaceId: string;
}

/** The bounds a request may not exceed. */
export interface UsageBounds {
  maxTokens: number;
  maxToolLoops: number;
  maxAttempts: number;
}

/** A usage reservation (atomic; settled terminally). */
export interface UsageReservation {
  reservationId: string;
  owner: UsageOwner;
  reservedTokens: number;
  status: 'reserved' | 'settled' | 'released';
  /** Settled measured usage (present only after terminal settlement). */
  settledUsedTokens: number | null;
  createdAt: string;
}

/** One measured ledger entry (append-only). */
export interface UsageLedgerEntry {
  entryId: string;
  reservationId: string;
  owner: UsageOwner;
  kind: 'reserved' | 'settled' | 'released';
  /** The measured amount for this entry (never an estimate). */
  amountTokens: number;
  at: string;
}

export type SettleOutcome = 'settled' | 'duplicate';

export interface SettleResult {
  outcome: SettleOutcome;
  reservationId: string;
  usedTokens: number;
  releasedTokens: number;
}

export class UsageError extends Error {
  constructor(
    public readonly code:
      | 'insufficient_quota'
      | 'bound_exceeded'
      | 'unknown_reservation'
      | 'not_owner'
  ) {
    super(code);
  }
}
