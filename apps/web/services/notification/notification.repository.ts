import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const notificationRepository = {
  async create(userId: string, type: NotificationType, payload: object) {
    return prisma.notification.create({
      data: { userId, type, payload: payload as unknown as Prisma.InputJsonValue },
    });
  },

  async listForUser(userId: string, unreadOnly?: boolean) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
    });
  },

  async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  },
};
