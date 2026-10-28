// SYNC-01 (KAN-139) — the change-feed domain's typed state seams. The owning
// store (per-owner/surface ordered event log, issued cursors, delivery
// revocations) implements these at integration; the in-memory implementation
// is contract-true and fails closed.
import type { FeedCursor, FeedEvent, FeedOwner, FeedSurface } from './changefeed-types';

export interface ChangefeedStore {
  /** Append one immutable ordered record (owning-store outbox record). */
  appendEvent(owner: FeedOwner, surface: FeedSurface, event: FeedEvent): Promise<void>;
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

  async appendEvent(owner: FeedOwner, surface: FeedSurface, event: FeedEvent): Promise<void> {
    const key = this.key(owner, surface);
    const list = this.events.get(key) ?? [];
    list.push(clone(event));
    this.events.set(key, list);
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
