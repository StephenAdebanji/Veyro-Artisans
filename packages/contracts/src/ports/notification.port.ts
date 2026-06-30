import type { NotificationType } from "../common";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

/** Owns: Notification. Pure fan-out consumer — subscribes to almost every DomainEvent and has no other service depending on it synchronously. */
export interface NotificationServicePort {
  notify(userId: string, type: NotificationType, payload: object): Promise<string>;
  listForUser(userId: string, opts?: { unreadOnly?: boolean }): Promise<NotificationRecord[]>;
  markRead(notificationId: string): Promise<void>;
}
