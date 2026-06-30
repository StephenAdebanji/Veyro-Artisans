"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
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
}

export function MessagesLayout({ conversations, currentProfileId }: MessagesLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c") ?? conversations[0]?.id ?? null;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("c", id);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-t">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 overflow-y-auto border-r">
        <div className="border-b px-4 py-3">
          <h1 className="font-semibold">Messages</h1>
        </div>

        {conversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
        )}

        {conversations.map((convo) => (
          <ConversationRow
            key={convo.id}
            id={convo.id}
            counterpartName={convo.counterpartName}
            lastMessageAt={convo.lastMessageAt}
            unreadCount={convo.unreadCount}
            selected={convo.id === selectedId}
            onClick={() => select(convo.id)}
          />
        ))}
      </aside>

      {/* Thread */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {selected ? (
          <MessageThread
            key={selected.id}
            conversationId={selected.id}
            currentProfileId={currentProfileId}
            counterpartName={selected.counterpartName}
          />
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
