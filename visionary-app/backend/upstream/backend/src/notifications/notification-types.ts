// PRIV-04 (KAN-113) — durable in-app notification/read/preference state and
// approved email delivery, with idempotency, quiet/retry handling and no
// private data in public links/logs.
//
// The checkpoint here is honest, durable notification state:
//   - DURABLE: in-app notifications are server-owned per owner (uid+workspace);
//     read/unread transitions persist; a retried delivery (same notificationId)
//     converges to ONE notification — no duplicates.
//   - PREFERENCES ENFORCED: an opted-out channel suppresses delivery, recorded
//     honestly as `suppressed` (never silently dropped, never delivered).
//   - QUIET HOURS: a delivery inside the owner's quiet window is DEFERRED
//     (not dropped, not sent); after the window it delivers on retry.
//   - RETRY HANDLING: a failed delivery retries within bounded attempts;
//     beyond the bound it reports `failed` honestly (never silently lost).
//   - NO PRIVATE DATA IN PUBLIC LINKS/LOGS: a notification's public link
//     carries an OPAQUE TOKEN only (no uid, no email, no subject); log records
//     are redacted (KAN-91 composition).
//   - APPROVED CHANNELS ONLY: email is delivered to the account's SERVER-
//     DERIVED verified address — never an address from the payload.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The notification owner. */
export interface NotificationOwner {
  uid: string;
  workspaceId: string;
}

export type Channel = 'in_app' | 'email';

export interface DeliveryPreference {
  channel: Channel;
  enabled: boolean;
  /** Quiet window in the owner's locale (hours, 0-23). */
  quietHoursStart: number;
  quietHoursEnd: number;
}

/** A durable in-app notification. */
export interface AppNotification {
  notificationId: string;
  owner: NotificationOwner;
  channel: Channel;
  subject: string;
  /** The public link carries an OPAQUE TOKEN only. */
  publicToken: string;
  read: boolean;
  state: 'delivered' | 'suppressed' | 'deferred' | 'failed';
  attempts: number;
  createdAt: string;
}

export class NotificationError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_notification'
      | 'retry_bound_exceeded'
  ) {
    super(code);
  }
}
