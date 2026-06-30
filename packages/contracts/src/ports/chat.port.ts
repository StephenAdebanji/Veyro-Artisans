import type { MessageType } from "../common";

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
}

export interface ConversationSummary {
  id: string;
  homeownerId: string;
  artisanId: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  readAt: string | null;
  createdAt: string;
}

/** Owns: Conversation, Message. Transport (live delivery) is handled by apps/realtime's chat-gateway, which calls this service's REST surface to persist. */
export interface ChatServicePort {
  getOrCreateConversation(
    homeownerId: string,
    artisanId: string,
    jobId?: string,
  ): Promise<string>;
  sendMessage(input: SendMessageInput): Promise<MessageRecord>;
  markRead(conversationId: string, userId: string): Promise<void>;
  listConversations(userId: string): Promise<ConversationSummary[]>;
  listMessages(conversationId: string): Promise<MessageRecord[]>;
  /** Backs the homeowner/artisan dashboards' "unread messages" stat. */
  countUnreadForUser(userId: string): Promise<number>;
}
