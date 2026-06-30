import type { MessageType as DbMessageType } from "@prisma/client";
import type {
  ChatServicePort,
  ConversationSummary,
  MessageRecord,
  SendMessageInput,
} from "@veyro/contracts";
import { eventBus } from "@/platform/event-bus";
import { chatRepository } from "./chat.repository";

interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  type: DbMessageType;
  content: string | null;
  mediaUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

function toMessageRecord(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    type: row.type,
    content: row.content ?? undefined,
    mediaUrl: row.mediaUrl ?? undefined,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Owns: Conversation, Message. Transport (live delivery) is apps/realtime's
 * chat-gateway, which calls this service's REST surface to persist — this
 * service never talks to Socket.io directly. */
class ChatService implements ChatServicePort {
  async getOrCreateConversation(homeownerId: string, artisanId: string, jobId?: string): Promise<string> {
    const existing = await chatRepository.findConversationBetween(homeownerId, artisanId);
    if (existing) return existing.id;

    const conversation = await chatRepository.createConversation(homeownerId, artisanId, jobId);
    return conversation.id;
  }

  async sendMessage(input: SendMessageInput): Promise<MessageRecord> {
    const conversation = await chatRepository.findConversation(input.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const message = await chatRepository.createMessage({
      conversationId: input.conversationId,
      senderId: input.senderId,
      type: input.type as DbMessageType,
      content: input.content,
      mediaUrl: input.mediaUrl,
    });
    await chatRepository.touchConversation(input.conversationId, message.createdAt);

    const receiverId =
      input.senderId === conversation.homeownerId ? conversation.artisanId : conversation.homeownerId;

    eventBus.publish({
      type: "MessageSent",
      messageId: message.id,
      conversationId: input.conversationId,
      senderId: input.senderId,
      receiverId,
      occurredAt: new Date().toISOString(),
    });

    return toMessageRecord(message);
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await chatRepository.markMessagesRead(conversationId, userId);
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const rows = await chatRepository.listConversationsForUser(userId);
    return rows.map((row) => ({
      id: row.id,
      homeownerId: row.homeownerId,
      artisanId: row.artisanId,
      lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
      unreadCount: row._count.messages,
    }));
  }

  async listMessages(conversationId: string): Promise<MessageRecord[]> {
    const rows = await chatRepository.listMessages(conversationId);
    return rows.map(toMessageRecord);
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return chatRepository.countUnread(userId);
  }
}

export const chatService = new ChatService();
