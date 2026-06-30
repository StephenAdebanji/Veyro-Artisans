import type { Server, Socket } from "socket.io";
import { verifyRealtimeToken } from "../auth";

const WEB_INTERNAL_URL = process.env.WEB_INTERNAL_URL ?? "http://localhost:3000";

interface SendMessagePayload {
  conversationId: string;
  type?: "TEXT" | "IMAGE" | "LOCATION";
  content?: string;
  mediaUrl?: string;
}

/**
 * Websocket transport for Chat Service. REST (apps/web's
 * /api/conversations/:id/messages) is the single persistence path; this
 * gateway calls that same endpoint internally so a message is only ever
 * written once, then fans the persisted row out to the room live.
 */
export function registerChatGateway(io: Server): void {
  const namespace = io.of("/chat");

  namespace.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyRealtimeToken(token) : null;
    if (!payload) return next(new Error("Unauthorized"));
    socket.data.userId = payload.userId;
    next();
  });

  namespace.on("connection", (socket: Socket) => {
    socket.on("join-conversation", ({ conversationId }: { conversationId: string }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("send-message", async (payload: SendMessagePayload) => {
      const senderId = socket.data.userId as string;

      const response = await fetch(
        `${WEB_INTERNAL_URL}/api/conversations/${payload.conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId,
            type: payload.type ?? "TEXT",
            content: payload.content,
            mediaUrl: payload.mediaUrl,
          }),
        },
      );

      if (!response.ok) {
        socket.emit("message-error", { conversationId: payload.conversationId });
        return;
      }

      const { message } = (await response.json()) as { message: unknown };
      namespace.to(`conversation:${payload.conversationId}`).emit("message-created", message);
    });
  });
}
