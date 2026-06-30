"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageRecord } from "@veyro/contracts";

interface MessageThreadProps {
  conversationId: string;
  currentProfileId: string;
  counterpartName: string;
  hideHeader?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageThread({ conversationId, currentProfileId, counterpartName, hideHeader }: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Load messages + mark read + connect socket when conversation changes.
  useEffect(() => {
    setMessages([]);

    async function init() {
      const [msgsRes] = await Promise.all([
        fetch(`/api/conversations/${conversationId}/messages`),
        fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }),
      ]);
      if (msgsRes.ok) {
        const { messages: loaded } = (await msgsRes.json()) as { messages: MessageRecord[] };
        setMessages(loaded);
      }
    }
    init().catch(console.error);
  }, [conversationId]);

  // Socket connection — created once, room changes when conversation changes.
  useEffect(() => {
    let mounted = true;

    async function connectSocket() {
      const res = await fetch("/api/realtime-token");
      if (!res.ok || !mounted) return;
      const { token } = (await res.json()) as { token: string };
      if (!mounted) return;

      const { io } = await import("socket.io-client");
      const socket = io(
        `${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/chat`,
        { auth: { token }, transports: ["websocket"] },
      );
      socketRef.current = socket;

      socket.emit("join-conversation", { conversationId });

      socket.on("message-created", (msg: MessageRecord) => {
        if (!mounted || msg.conversationId !== conversationIdRef.current) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Mark incoming as read if we're viewing the conversation.
          fetch(`/api/conversations/${msg.conversationId}/read`, { method: "POST" }).catch(() => {});
          return [...prev, msg];
        });
      });
    }

    connectSocket().catch(console.error);
    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  // Only reconnect if socket URL changes — conversation room switch is handled separately.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch room when conversation changes (socket already connected).
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("join-conversation", { conversationId });
  }, [conversationId]);

  // Auto-scroll to bottom.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function send() {
    const text = input.trim();
    if (!text || sending || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit("send-message", {
      conversationId,
      type: "TEXT",
      content: text,
    });
    setInput("");
    setSending(false);
  }

  // Group messages by day for date separators.
  const grouped: Array<{ day: string; msgs: MessageRecord[] }> = [];
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) {
      last.msgs.push(msg);
    } else {
      grouped.push({ day, msgs: [msg] });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header — hidden on mobile when parent already shows back+name row */}
      {!hideHeader && (
        <div className="border-b px-5 py-3">
          <p className="font-semibold">{counterpartName}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {grouped.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{day}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {msgs.map((msg) => {
                const isMine = msg.senderId === currentProfileId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        isMine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`mt-0.5 text-right text-[10px] ${
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                        {isMine && msg.readAt && " ✓"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            className="min-h-[2.5rem] max-h-32 resize-none py-2"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
