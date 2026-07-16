import type { MessageType } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const chatRepository = {
  async findConversation(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  },

  async findConversationBetween(homeownerId: string, artisanId: string) {
    return prisma.conversation.findFirst({ where: { homeownerId, artisanId } });
  },

  async createConversation(homeownerId: string, artisanId: string, jobId?: string) {
    return prisma.conversation.create({ data: { homeownerId, artisanId, jobId } });
  },

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    type: MessageType;
    content?: string;
    mediaUrl?: string;
  }) {
    return prisma.message.create({ data });
  },

  async touchConversation(conversationId: string, at: Date) {
    return prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: at } });
  },

  async markMessagesRead(conversationId: string, readerId: string) {
    return prisma.message.updateMany({
      where: { conversationId, senderId: { not: readerId }, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async listConversationsForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ homeownerId: userId }, { artisanId: userId }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        _count: {
          select: {
            messages: { where: { senderId: { not: userId }, readAt: null } },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, senderId: true } },
      },
    });
  },

  async findConversationByJob(jobId: string) {
    return prisma.conversation.findFirst({ where: { jobId } });
  },

  async listMessages(conversationId: string) {
    return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  },

  async countUnread(userId: string) {
    return prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: { OR: [{ homeownerId: userId }, { artisanId: userId }] },
      },
    });
  },
};
