import type { Notification as NotificationRow } from "@prisma/client";
import type {
  NotificationRecord,
  NotificationServicePort,
  NotificationType,
} from "@veyro/contracts";
import { notificationRepository } from "./notification.repository";

function toRecord(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    payload: row.payload as Record<string, unknown>,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Owns: Notification. Pure fan-out consumer — see notification.handlers.ts. */
class NotificationService implements NotificationServicePort {
  async notify(userId: string, type: NotificationType, payload: object): Promise<string> {
    const notification = await notificationRepository.create(userId, type, payload);
    return notification.id;
  }

  async listForUser(
    userId: string,
    opts?: { unreadOnly?: boolean },
  ): Promise<NotificationRecord[]> {
    const rows = await notificationRepository.listForUser(userId, opts?.unreadOnly);
    return rows.map(toRecord);
  }

  async markRead(notificationId: string): Promise<void> {
    await notificationRepository.markRead(notificationId);
  }
}

export const notificationService = new NotificationService();
