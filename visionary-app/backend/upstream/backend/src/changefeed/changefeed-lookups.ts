// SYNC-01 (KAN-139) — the change-feed domain's typed state seams. The owning
// store (per-owner/surface ordered event log, issued cursors, delivery
// revocations) implements these at integration; the in-memory implementation
// is contract-true and fails closed.
import type { FeedCursor, FeedEvent, FeedOwner, FeedSurface } from './changefeed-types';

export interface ChangefeedStore {
  /**
   * ATOMIC append (the sequence fence lives INSIDE the store): the store
   * assigns the strictly-increasing per-(owner,surface) seq in the SAME
   * critical section as the insert — a caller-supplied seq is a read-then-
   * write race (two concurrent appends would collide on the same seq).
   * Integration law: one transaction computing INSERT with
   * COALESCE(MAX(seq),0)+1 per (owner,surface), never read-then-insert.
   * Returns the committed event with its store-assigned seq.
   */
  appendEvent(
    owner: FeedOwner,
    surface: FeedSurface,
    event: Omit<FeedEvent, 'seq'>,
  ): Promise<FeedEvent>;
  /** Events strictly after seq for one owner+surface, in seq order. */
  eventsAfter(owner: FeedOwner, surface: FeedSurface, afterSeq: number): Promise<FeedEvent[]>;
  latestSeq(owner: FeedOwner, surface: FeedSurface): Promise<number>;
  saveCursor(cursor: FeedCursor): Promise<void>;
  cursor(token: string): Promise<FeedCursor | undefined>;
  /** Delivery revocation (session/account level; fail closed). */
  setDeliveryRevoked(owner: FeedOwner, revoked: boolean): Promise<void>;
  isDeliveryRevoked(owner: FeedOwner): Promise<boolean>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryChangefeedStore implements ChangefeedStore {
  private events = new Map<string, FeedEvent[]>();
  private cursors = new Map<string, FeedCursor>();
  private revoked = new Set<string>();

  private key(owner: FeedOwner, surface: FeedSurface): string {
    return `${owner.uid}|${owner.workspaceId}|${surface}`;
  }

  async appendEvent(owner: FeedOwner, surface: FeedSurface, event: Omit<FeedEvent, 'seq'>): Promise<FeedEvent> {
    const key = this.key(owner, surface);
    const list = this.events.get(key) ?? [];
    // The sequence fence lives HERE (single critical section): the next seq is
    // derived from the last committed record inside the same append, so two
    // concurrent callers can never collide on the same seq.
    const seq = list.length ? list[list.length - 1].seq + 1 : 1;
    const committed: FeedEvent = { ...clone(event), seq };
    list.push(committed);
    this.events.set(key, list);
    return clone(committed);
  }

  async eventsAfter(owner: FeedOwner, surface: FeedSurface, afterSeq: number): Promise<FeedEvent[]> {
    const list = this.events.get(this.key(owner, surface)) ?? [];
    return list.filter((e) => e.seq > afterSeq).map(clone);
  }

  async latestSeq(owner: FeedOwner, surface: FeedSurface): Promise<number> {
    const list = this.events.get(this.key(owner, surface)) ?? [];
    return list.length ? list[list.length - 1].seq : 0;
  }

  async saveCursor(cursor: FeedCursor): Promise<void> {
    this.cursors.set(cursor.token, clone(cursor));
  }

  async cursor(token: string): Promise<FeedCursor | undefined> {
    const found = this.cursors.get(token);
    return found ? clone(found) : undefined;
  }

  async setDeliveryRevoked(owner: FeedOwner, revoked: boolean): Promise<void> {
    if (revoked) this.revoked.add(`${owner.uid}|${owner.workspaceId}`);
    else this.revoked.delete(`${owner.uid}|${owner.workspaceId}`);
  }

  async isDeliveryRevoked(owner: FeedOwner): Promise<boolean> {
    return this.revoked.has(`${owner.uid}|${owner.workspaceId}`);
  }
}
