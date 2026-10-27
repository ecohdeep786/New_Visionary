// PRIV-04 (KAN-113) — the notification domain's typed state seams. The owning
// stores (notifications, preferences, verified addresses) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { AppNotification, DeliveryPreference, NotificationOwner } from './notification-types';

export interface NotificationStore {
  saveNotification(notification: AppNotification): Promise<void>;
  byNotificationId(notificationId: string): Promise<AppNotification | undefined>;
  notificationsFor(owner: NotificationOwner): Promise<AppNotification[]>;
  preferenceFor(owner: NotificationOwner, channel: 'in_app' | 'email'): Promise<DeliveryPreference | undefined>;
  /** The account's SERVER-DERIVED verified email (never from the payload). */
  verifiedEmail(uid: string): Promise<string | undefined>;
}

/** Contract-true in-memory store; notifications are server-owned state. */
export class InMemoryNotificationStore implements NotificationStore {
  private notifications = new Map<string, AppNotification>();
  private preferences = new Map<string, DeliveryPreference>();
  private emails = new Map<string, string>();

  seedPreference(owner: NotificationOwner, preference: DeliveryPreference): void {
    this.preferences.set(`${owner.uid}|${preference.channel}`, { ...preference });
  }

  seedVerifiedEmail(uid: string, email: string): void {
    this.emails.set(uid, email);
  }

  async saveNotification(notification: AppNotification): Promise<void> {
    // Upsert by notificationId (idempotent delivery).
    this.notifications.set(notification.notificationId, { ...notification, owner: { ...notification.owner } });
  }

  async byNotificationId(notificationId: string): Promise<AppNotification | undefined> {
    const found = this.notifications.get(notificationId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async notificationsFor(owner: NotificationOwner): Promise<AppNotification[]> {
    return [...this.notifications.values()]
      .filter((n) => n.owner.uid === owner.uid && n.owner.workspaceId === owner.workspaceId)
      .map((n) => ({ ...n, owner: { ...n.owner } }));
  }

  async preferenceFor(owner: NotificationOwner, channel: 'in_app' | 'email'): Promise<DeliveryPreference | undefined> {
    return this.preferences.get(`${owner.uid}|${channel}`);
  }

  async verifiedEmail(uid: string): Promise<string | undefined> {
    return this.emails.get(uid);
  }
}
