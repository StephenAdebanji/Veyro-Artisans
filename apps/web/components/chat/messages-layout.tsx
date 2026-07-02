"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ConversationRow } from "./conversation-row";
import { MessageThread } from "./message-thread";

export interface EnrichedConversation {
  id: string;
  counterpartId: string;
  counterpartName: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface MessagesLayoutProps {
  conversations: EnrichedConversation[];
  currentProfileId: string;
  backHref: string;
}

export function MessagesLayout({ conversations, currentProfileId, backHref }: MessagesLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c") ?? null;

  // Local unread counts so sidebar updates without a page reload.
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(
    () => Object.fromEntries(conversations.map((c) => [c.id, c.unreadCount])),
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("c", id);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function back() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("c");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const handleRead = useCallback((conversationId: string) => {
    setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }));
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden border-t">
      {/* Sidebar */}
      <aside
        className={`flex flex-col overflow-hidden border-r bg-background
          ${selected ? "hidden md:flex md:w-80 md:shrink-0" : "flex w-full md:w-80 md:shrink-0"}
        `}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-semibold">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
          )}

          {conversations.map((convo) => (
            <ConversationRow
              key={convo.id}
              id={convo.id}
              counterpartName={convo.counterpartName}
              lastMessageAt={convo.lastMessageAt}
              unreadCount={unreadMap[convo.id] ?? convo.unreadCount}
              selected={convo.id === selectedId}
              onClick={() => select(convo.id)}
            />
          ))}
        </div>
      </aside>

      {/* Thread */}
      <main
        className={`flex flex-col overflow-hidden bg-background
          ${selected ? "flex w-full md:flex-1" : "hidden md:flex md:flex-1"}
        `}
      >
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="ml-2 truncate text-sm font-semibold">{selected.counterpartName}</span>
            </div>
            <MessageThread
              key={selected.id}
              conversationId={selected.id}
              currentProfileId={currentProfileId}
              counterpartName={selected.counterpartName}
              hideHeader
              onRead={handleRead}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
