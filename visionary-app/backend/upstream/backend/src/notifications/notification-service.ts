// PRIV-04 (KAN-113) — durable notifications with preferences, quiet/retry, and
// privacy-safe links.
//
// Core responsibilities (server-owned; idempotent; privacy-safe):
//   1. deliver: idempotent by notificationId — a retried delivery converges to
//      the same notification (no duplicates). In-app notifications are durable
//      server state.
//   2. Preferences: an opted-out channel suppresses delivery, recorded
//      honestly as `suppressed` — never silently dropped, never delivered.
//   3. Quiet hours: a delivery inside the owner's quiet window DEFERS
//      (`deferred`) — not dropped, not sent; a retry after the window delivers.
//   4. Retry handling: a failed delivery retries within bounds; beyond the
//      bound it reports `failed` honestly (never silently lost).
//   5. markRead: durable read/unread transitions; owner-only.
//   6. publicLink: the link carries an OPAQUE TOKEN only — no uid, no email,
//      no subject (privacy-safe public surface).
//   7. emailRecipient: the recipient is the account's SERVER-DERIVED verified
//      email — never an address from the payload.
import type {
  AppNotification,
  NotificationError as NotificationErrorType,
  NotificationOwner,
} from './notification-types';
import { NotificationError } from './notification-types';
import type { NotificationStore } from './notification-lookups';

export class NotificationService {
  constructor(private readonly store: NotificationStore) {}

  /** Deliver a notification: idempotent, preference- and quiet-aware. */
  async deliver(input: {
    notificationId: string;
    owner: NotificationOwner;
    channel: 'in_app' | 'email';
    subject: string;
    publicToken: string;
    /** The owner's current local hour (0-23) for quiet-window evaluation. */
    currentHour: number;
    /** Simulated provider failure for retry testing (integration fault). */
    providerFails?: boolean;
  }): Promise<AppNotification> {
    // Idempotent replay: the same notificationId converges to one row.
    const existing = await this.store.byNotificationId(input.notificationId);
    if (existing) return existing;

    const preference = await this.store.preferenceFor(input.owner, input.channel);
    const attempts = 1;
    let state: AppNotification['state'] = 'delivered';
    if (preference && !preference.enabled) state = 'suppressed';
    else if (preference && inQuietWindow(input.currentHour, preference)) state = 'deferred';
    else if (input.providerFails) state = 'failed';

    const notification: AppNotification = {
      notificationId: input.notificationId,
      owner: { ...input.owner },
      channel: input.channel,
      subject: input.subject,
      publicToken: input.publicToken,
      read: false,
      state,
      attempts,
      createdAt: new Date().toISOString(),
    };
    await this.store.saveNotification(notification);
    return notification;
  }

  /** Retry a deferred/failed delivery; bounded attempts, honest failure. */
  async retry(notificationId: string, owner: NotificationOwner, options: { currentHour: number; maxAttempts: number; providerFails?: boolean }): Promise<AppNotification> {
    const notification = await this.getOwned(notificationId, owner);
    if (notification.attempts + 1 > options.maxAttempts) throw new NotificationError('retry_bound_exceeded');
    const preference = await this.store.preferenceFor(owner, notification.channel);
    let state: AppNotification['state'] = 'delivered';
    if (preference && !preference.enabled) state = 'suppressed';
    else if (preference && inQuietWindow(options.currentHour, preference)) state = 'deferred';
    else if (options.providerFails) state = 'failed';
    const updated: AppNotification = { ...notification, state, attempts: notification.attempts + 1 };
    await this.store.saveNotification(updated);
    return updated;
  }

  /** Durable read transition (owner-only; idempotent). */
  async markRead(notificationId: string, owner: NotificationOwner): Promise<AppNotification> {
    const notification = await this.getOwned(notificationId, owner);
    if (notification.read) return notification;
    const updated = { ...notification, read: true };
    await this.store.saveNotification(updated);
    return updated;
  }

  /** The privacy-safe public link: opaque token only, nothing private. */
  publicLink(notification: AppNotification, baseUrl: string): string {
    return `${baseUrl}/n/${notification.publicToken}`;
  }

  /** The approved email recipient: the SERVER-DERIVED verified address. */
  async emailRecipient(uid: string): Promise<string> {
    const email = await this.store.verifiedEmail(uid);
    if (!email) throw new NotificationError('unknown_notification');
    return email;
  }

  private async getOwned(notificationId: string, owner: NotificationOwner): Promise<AppNotification> {
    const notification = await this.store.byNotificationId(notificationId);
    if (!notification) throw new NotificationError('unknown_notification');
    if (notification.owner.uid !== owner.uid || notification.owner.workspaceId !== owner.workspaceId) {
      throw new NotificationError('not_owner');
    }
    return notification;
  }
}

function inQuietWindow(hour: number, preference: { quietHoursStart: number; quietHoursEnd: number }): boolean {
  if (preference.quietHoursStart === preference.quietHoursEnd) return false; // no quiet window
  if (preference.quietHoursStart < preference.quietHoursEnd) {
    return hour >= preference.quietHoursStart && hour < preference.quietHoursEnd;
  }
  // Wraps midnight (e.g. 22 -> 7).
  return hour >= preference.quietHoursStart || hour < preference.quietHoursEnd;
}

export type { NotificationErrorType };
