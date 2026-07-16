"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageRecord } from "@veyro/contracts";

interface MessageThreadProps {
  conversationId: string;
  currentProfileId: string;
  counterpartName: string;
  hideHeader?: boolean;
  onRead?: (conversationId: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function ReadTick({ readAt }: { readAt: string | null }) {
  if (readAt) {
    return <span className="text-[10px] font-bold text-blue-300">✓✓</span>;
  }
  return <span className="text-[10px] text-primary-foreground/50">✓</span>;
}

export function MessageThread({
  conversationId,
  currentProfileId,
  counterpartName,
  hideHeader,
  onRead,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;


  // Load messages + mark read when conversation changes.
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
        onRead?.(conversationId);
      }
    }
    init().catch(console.error);
  }, [conversationId, onRead]);

  // Socket connection (created once, room switched on conversationId change).
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
        { auth: { token }, transports: ["websocket"], reconnectionAttempts: 3 },
      );
      socketRef.current = socket;

      socket.on("connect", () => { if (mounted) setSocketConnected(true); });
      socket.on("disconnect", () => { if (mounted) setSocketConnected(false); });
      socket.on("connect_error", () => { if (mounted) setSocketConnected(false); });

      socket.emit("join-conversation", { conversationId: conversationIdRef.current });

      socket.on("message-created", (msg: MessageRecord) => {
        if (!mounted || msg.conversationId !== conversationIdRef.current) return;
        if (msg.senderId === currentProfileId) return; // we already added it via HTTP
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          fetch(`/api/conversations/${msg.conversationId}/read`, { method: "POST" }).catch(() => {});
          return [...prev, msg];
        });
      });
    }

    connectSocket().catch(console.error);
    return () => {
      mounted = false;
      setSocketConnected(false);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch room when conversation changes.
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("join-conversation", { conversationId });
  }, [conversationId]);

  // Polling fallback — runs when socket is not connected.
  useEffect(() => {
    if (socketConnected) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${conversationIdRef.current}/messages`);
      if (!res.ok) return;
      const { messages: fresh } = (await res.json()) as { messages: MessageRecord[] };
      setMessages((prev) => {
        const ids = new Set(prev.filter((m) => !m.id.startsWith("temp:")).map((m) => m.id));
        const incoming = fresh.filter((m) => !ids.has(m.id));
        if (incoming.length === 0) return prev;
        return [...prev.filter((m) => !m.id.startsWith("temp:")), ...fresh];
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [socketConnected]);

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
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const tempId = `temp:${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId,
        senderId: currentProfileId,
        type: "TEXT",
        content: text,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    // Always persist via HTTP — never depend on socket for own messages.
    fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: currentProfileId, type: "TEXT", content: text }),
    })
      .then((r) => r.json())
      .then(({ message }: { message: MessageRecord }) => {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
      })
      .catch(() => {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      })
      .finally(() => setSending(false));
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
      {/* Header */}
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

            <div className="space-y-1.5">
              {msgs.map((msg) => {
                const isMine = msg.senderId === currentProfileId;
                const isPending = msg.id.startsWith("temp:");
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[72%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground"
                      } ${isPending ? "opacity-60" : ""}`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-snug">{msg.content}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 ${
                          isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                        {isMine && !isPending && <ReadTick readAt={msg.readAt} />}
                        {isMine && isPending && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin opacity-50" />
                        )}
                      </div>
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
