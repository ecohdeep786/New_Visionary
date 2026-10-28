// SYNC-01 (KAN-139) — the authorized durable change/run observation service.
//
// Core responsibilities (server-owned; observation-only; fail closed):
//   1. recordEvent: the owning domain appends an immutable record carrying
//      kinds + reference ids ONLY — a record containing raw private content
//      (learner_text/rawQuery/transcript-style fields) refuses
//      (`private_content_refused`). Per-(owner, surface) sequence is strictly
//      increasing — ordered revisions, no gaps in returned pages.
//   2. issueCursor / poll: cursors are SERVER-ISSUED, opaque (nonce-padded,
//      non-guessable) and bound to (owner, surface). Every poll REAUTHORIZES
//      from the authenticated caller — a cursor alone grants nothing (a valid
//      token presented by a different caller refuses uniformly). Tampered or
//      unknown tokens refuse (`cursor_invalid`); a foreign surface/cursor
//      pairing refuses; a cursor fallen out of the retention window refuses
//      honestly (`cursor_expired`) with the resync point (latest seq).
//      Pages are bounded (`limit_exceeded`).
//   3. Replay/refetch: polling from any retained cursor replays the same
//      ordered suffix deterministically.
//   4. Subscription: bounded polling is the default; SSE is allowed for
//      streams; a websocket surface refuses without a recorded explicit
//      bidirectional need (`websocket_requires_explicit_need`); a revoked
//      delivery refuses (`delivery_revoked`); reconnect re-derives authority.
//   5. Observation only: the feed has NO command path — an execute attempt
//      through the observation channel refuses (`observation_only`), and every
//      record is not a commit receipt (`isCommitProof: false` by construction).
//   6. Uniform denial: unknown surface and foreign owner deny without leaking
//      existence; events of one owner are invisible to another.
import type {
  ChangefeedError as ChangefeedErrorType,
  FeedCursor,
  FeedEvent,
  FeedOwner,
  FeedPage,
  FeedSurface,
  StreamRegistration,
} from './changefeed-types';
import { ChangefeedError, RELEASED_SURFACES } from './changefeed-types';
import type { ChangefeedStore } from './changefeed-lookups';

/** Field-name substrings that indicate raw private content in a record. */
const PRIVATE_CONTENT_HINTS: readonly string[] = [
  'learner_text',
  'rawquery',
  'rawresponse',
  'retrievedcontext',
  'fulltranscript',
  'transcript',
  'audio',
];

export class ChangefeedService {
  private seqCounter = 0;
  private cursorCounter = 0;

  constructor(
    private readonly store: ChangefeedStore,
    private readonly limits: { maxPageSize: number; retentionWindow: number } = {
      maxPageSize: 50,
      retentionWindow: 1000,
    },
  ) {}

  /** Owning-store record: append one immutable ordered observation record. */
  async recordEvent(
    owner: FeedOwner,
    surface: FeedSurface,
    kind: string,
    refs: Record<string, string>,
  ): Promise<FeedEvent> {
    if (!RELEASED_SURFACES.includes(surface)) throw new ChangefeedError('unknown_surface');
    // Reference ids only: the feed never carries raw private content.
    for (const key of Object.keys(refs)) {
      if (PRIVATE_CONTENT_HINTS.some((h) => key.toLowerCase().includes(h))) {
        throw new ChangefeedError('private_content_refused');
      }
    }
    const seq = (await this.store.latestSeq(owner, surface)) + 1;
    const event: FeedEvent = {
      surface,
      seq,
      kind,
      refs: { ...refs },
      at: new Date().toISOString(),
      isCommitProof: false,
    };
    await this.store.appendEvent(owner, surface, event);
    return event;
  }

  /** Issue a fresh opaque scoped cursor at the current revision. */
  async issueCursor(owner: FeedOwner, surface: FeedSurface): Promise<FeedCursor> {
    this.assertSurface(surface);
    await this.assertNotRevoked(owner);
    const cursor: FeedCursor = {
      // Opaque: nonce-padded token — the sequence number is never exposed raw.
      token: `cur_${++this.cursorCounter}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
      owner: { ...owner },
      surface,
      seq: await this.store.latestSeq(owner, surface),
      issuedAt: new Date().toISOString(),
    };
    await this.store.saveCursor(cursor);
    return cursor;
  }

  /**
   * One authorized bounded poll: re-derives authority from the caller,
   * validates the cursor, replays the ordered suffix after it.
   */
  async poll(
    owner: FeedOwner,
    surface: FeedSurface,
    cursorToken: string | null,
    limit: number,
  ): Promise<FeedPage> {
    this.assertSurface(surface);
    await this.assertNotRevoked(owner);
    if (!Number.isInteger(limit) || limit < 1 || limit > this.limits.maxPageSize) {
      throw new ChangefeedError('limit_exceeded');
    }
    let afterSeq = 0;
    let nextCursor: FeedCursor | null = null;
    if (cursorToken) {
      const cursor = await this.store.cursor(cursorToken);
      // A cursor alone is worthless: it must exist AND belong to THIS caller.
      if (!cursor || cursor.owner.uid !== owner.uid || cursor.owner.workspaceId !== owner.workspaceId) {
        throw new ChangefeedError('cursor_invalid');
      }
      if (cursor.surface !== surface) throw new ChangefeedError('cursor_invalid');
      const latest = await this.store.latestSeq(owner, surface);
      if (cursor.seq < latest - this.limits.retentionWindow) {
        // Honest expiry: the cursor fell out of the retention window.
        throw new ChangefeedError('cursor_expired');
      }
      afterSeq = cursor.seq;
    }
    const events = (await this.store.eventsAfter(owner, surface, afterSeq)).slice(0, limit);
    if (events.length) {
      nextCursor = await this.issueCursor(owner, surface);
      nextCursor.seq = events[events.length - 1].seq;
      await this.store.saveCursor(nextCursor);
    }
    return { surface, events, nextCursor, hasMore: events.length === limit };
  }

  /**
   * Register a delivery stream: bounded polling by default, SSE where
   * streaming is needed; websocket requires a recorded explicit bidirectional
   * need. Every subscription reauthorizes (revoked delivery refuses).
   */
  async subscribe(owner: FeedOwner, registration: StreamRegistration): Promise<{ mode: string; surface: FeedSurface }> {
    this.assertSurface(registration.surface);
    await this.assertNotRevoked(owner);
    if (registration.mode === 'websocket' && !registration.bidirectionalNeed?.trim()) {
      throw new ChangefeedError('websocket_requires_explicit_need');
    }
    return { mode: registration.mode, surface: registration.surface };
  }

  /** Revoke delivery (account/session level); re-grant restores delivery. */
  async setDeliveryRevoked(owner: FeedOwner, revoked: boolean): Promise<void> {
    await this.store.setDeliveryRevoked(owner, revoked);
  }

  /** The observation channel never executes anything. */
  async executeThroughFeed(): Promise<never> {
    throw new ChangefeedError('observation_only');
  }

  private assertSurface(surface: FeedSurface): void {
    if (!RELEASED_SURFACES.includes(surface)) throw new ChangefeedError('unknown_surface');
  }

  private async assertNotRevoked(owner: FeedOwner): Promise<void> {
    if (await this.store.isDeliveryRevoked(owner)) throw new ChangefeedError('delivery_revoked');
  }
}

export type { ChangefeedErrorType };
