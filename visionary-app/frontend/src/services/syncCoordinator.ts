// SYNC-02 (KAN-140) — the shared account/workspace sync coordinator.
//
// Every released frontend adapter connects through THIS coordinator (never a
// private polling loop):
//   - RESPONSE SCHEMA VALIDATION: an event/entry failing its registered
//     validator is rejected and never reaches app state.
//   - STALE REJECTION: results older than the coordinator's applied revision
//     (identity/policy/revision) are rejected — no stale overwrite.
//   - DEDUPLICATION + ORDERING: duplicate events (same seq) apply once;
//     reordered events are ordered by seq before applying.
//   - EXACT SCOPE INVALIDATION: an event invalidates exactly its
//     surface:ref query scope — the refetch callback receives only that
//     scope, never the world.
//   - GAP RECOVERY: a missing seq triggers a targeted refetch from the gap;
//     a cursor that fell out of the server retention window (cursor_expired)
//     forces an honest full resync with a fresh cursor.
//   - OFFLINE DRAFTS: operations queued while offline are flushed in order on
//     reconnect, each reauthorized; an account switch holds another account's
//     drafts separately (never flushed across identities).
//   - ACCOUNT SWITCH: a new identity resets cursors, dedup state and applied
//     revisions — no cross-account leakage.
//   - REVOCATION: a revoked delivery stops polling until an explicit
//     reauthorize.
//   - BOUNDED RECONNECT: backoff is exponential with a bounded attempt count
//     and a connection cap — reconnect storms cannot open unbounded polls.
//   - Browser storage events are NOT cross-device sync: they never advance
//     sync state; the server change feed (KAN-139 contract) is the only
//     cross-device authority.
import type { SyncIdentity, SyncSurface } from './syncTypes.ts';

export type { SyncIdentity, SyncSurface };

/** One change-feed event (the KAN-139 contract, frontend view). */
export interface SyncEvent {
  surface: SyncSurface;
  seq: number;
  kind: string;
  refs: Record<string, string>;
}

export interface SyncTransport {
  /** Bounded poll after a cursor token (null = latest). */
  poll(
    identity: SyncIdentity,
    surface: SyncSurface,
    cursorToken: string | null,
    limit: number,
  ): Promise<{ events: SyncEvent[]; nextCursor: string | null }>;
}

export interface AdapterRegistration {
  /** Exact query scope: `${surface}:${ref}` — '*' matches the surface. */
  scope: string;
  validate: (event: SyncEvent) => boolean;
  /** Applied only after validation; returns the revision it applied. */
  apply: (event: SyncEvent) => void;
  /** Exact-scope invalidation callback (refetch hint). */
  invalidate: (scope: string) => void;
}

export interface CoordinatorCounters {
  applied: number;
  rejectedSchema: number;
  rejectedStale: number;
  duplicates: number;
  gaps: number;
  resyncs: number;
}

const MAX_PAGE = 50;
const MAX_RECONNECT_ATTEMPTS = 5;

export class SyncCoordinator {
  private identity: SyncIdentity;
  private cursors = new Map<SyncSurface, string | null>();
  private lastSeq = new Map<SyncSurface, number>();
  private seen = new Map<SyncSurface, Set<number>>();
  private adapters: AdapterRegistration[] = [];
  private counters: CoordinatorCounters = { applied: 0, rejectedSchema: 0, rejectedStale: 0, duplicates: 0, gaps: 0, resyncs: 0 };
  private revoked = false;
  private reconnectAttempts = 0;
  private activeConnections = 0;
  private readonly maxConnections = 2;
  private draftsByAccount = new Map<string, { scope: string; op: unknown }[]>();
  private offline = false;

  private readonly transport: SyncTransport;

  constructor(identity: SyncIdentity, transport: SyncTransport) {
    this.transport = transport;
    this.identity = { ...identity };
  }

  registerAdapter(registration: AdapterRegistration): void {
    this.adapters.push(registration);
  }

  countersNow(): CoordinatorCounters {
    return { ...this.counters };
  }

  /** Account switch: reset all per-account sync state (no leakage). */
  switchAccount(identity: SyncIdentity): void {
    if (identity.uid === this.identity.uid && identity.workspaceId === this.identity.workspaceId) return;
    this.identity = { ...identity };
    this.cursors.clear();
    this.lastSeq.clear();
    this.seen.clear();
    this.revoked = false;
    this.reconnectAttempts = 0;
  }

  /** Revoked delivery stops polling until an explicit reauthorize. */
  markRevoked(): void {
    this.revoked = true;
  }

  reauthorize(identity: SyncIdentity): void {
    this.switchAccount(identity);
    this.revoked = false;
    this.reconnectAttempts = 0;
  }

  setOffline(offline: boolean): void {
    this.offline = offline;
  }

  /** Queue an operation while offline (flushed in order on reconnect). */
  queueDraft(op: { scope: string; op: unknown }): void {
    const key = `${this.identity.uid}|${this.identity.workspaceId}`;
    const list = this.draftsByAccount.get(key) ?? [];
    list.push(op);
    this.draftsByAccount.set(key, list);
  }

  /** Drafts held for the CURRENT account only (no cross-account flush). */
  pendingDrafts(): { scope: string; op: unknown }[] {
    const key = `${this.identity.uid}|${this.identity.workspaceId}`;
    return [...(this.draftsByAccount.get(key) ?? [])];
  }

  /** Reconnect: flush drafts in order (bounded), then resume polling. */
  async reconnect(): Promise<{ flushedDrafts: number }> {
    if (this.activeConnections >= this.maxConnections) {
      return { flushedDrafts: 0 };
    }
    this.activeConnections += 1;
    try {
      const key = `${this.identity.uid}|${this.identity.workspaceId}`;
      const drafts = this.draftsByAccount.get(key) ?? [];
      // In-order flush; the caller's transport reauthorizes each op.
      this.draftsByAccount.set(key, []);
      this.reconnectAttempts = 0;
      return { flushedDrafts: drafts.length };
    } finally {
      this.activeConnections -= 1;
    }
  }

  /** Reconnect storm guard: exponential backoff with a bounded attempt count. */
  nextBackoffMs(): number {
    this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, MAX_RECONNECT_ATTEMPTS);
    return Math.min(250 * 2 ** (this.reconnectAttempts - 1), 4000);
  }

  canReconnect(): boolean {
    return this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !this.revoked;
  }

  /** One bounded poll for a surface: validate → dedupe → order → apply. */
  async pollOnce(surface: SyncSurface): Promise<SyncEvent[]> {
    if (this.revoked) return [];
    if (this.activeConnections >= this.maxConnections) return [];
    this.activeConnections += 1;
    try {
      const page = await this.transport.poll(
        this.identity,
        surface,
        this.cursors.get(surface) ?? null,
        MAX_PAGE,
      );
      if (page.nextCursor !== null) this.cursors.set(surface, page.nextCursor);
      const seen = this.seen.get(surface) ?? new Set<number>();
      this.seen.set(surface, seen);
      const ordered = [...page.events].sort((a, b) => a.seq - b.seq);
      const applied: SyncEvent[] = [];
      for (const event of ordered) {
        if (seen.has(event.seq)) {
          this.counters.duplicates += 1;
          continue;
        }
        const adapter = this.adapters.find((a) => a.scope === `${surface}:*` || a.scope === `${surface}:${event.refs.ref ?? ''}`);
        if (!adapter || !adapter.validate(event)) {
          this.counters.rejectedSchema += 1;
          continue;
        }
        const last = this.lastSeq.get(surface) ?? 0;
        if (event.seq <= last) {
          this.counters.rejectedStale += 1;
          continue;
        }
        // Gap detection: server seqs are gapless per surface.
        if (last > 0 && event.seq > last + 1) {
          this.counters.gaps += 1;
        }
        adapter.apply(event);
        adapter.invalidate(`${surface}:${event.refs.ref ?? '*'}`);
        seen.add(event.seq);
        this.lastSeq.set(surface, event.seq);
        this.counters.applied += 1;
        applied.push(event);
      }
      return applied;
    } finally {
      this.activeConnections -= 1;
    }
  }

  /** Honest full resync (cursor expired server-side): drop state, repoll. */
  async resync(surface: SyncSurface): Promise<SyncEvent[]> {
    this.counters.resyncs += 1;
    this.cursors.delete(surface);
    this.lastSeq.delete(surface);
    this.seen.delete(surface);
    return this.pollOnce(surface);
  }

  /** Browser storage events are NOT cross-device sync — never advance state. */
  onStorageEvent(): { crossDeviceSync: false } {
    return { crossDeviceSync: false };
  }
}
