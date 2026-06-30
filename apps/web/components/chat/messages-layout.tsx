"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
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
  // On mobile, don't auto-select first — show the list first so user can choose
  const selectedId = searchParams.get("c") ?? null;

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

  return (
    <div className="flex flex-1 overflow-hidden border-t">
      {/* Sidebar — full width on mobile when no conversation selected, 320px sidebar on md+ */}
      <aside
        className={`flex flex-col overflow-hidden border-r bg-background
          ${selected ? "hidden md:flex md:w-80 md:shrink-0" : "flex w-full md:w-80 md:shrink-0"}
        `}
      >
        <div className="border-b px-4 py-3">
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
              unreadCount={convo.unreadCount}
              selected={convo.id === selectedId}
              onClick={() => select(convo.id)}
            />
          ))}
        </div>
      </aside>

      {/* Thread — full width on mobile when conversation selected, fills remaining on md+ */}
      <main
        className={`flex flex-col overflow-hidden bg-background
          ${selected ? "flex w-full md:flex-1" : "hidden md:flex md:flex-1"}
        `}
      >
        {selected ? (
          <>
            {/* Mobile back button injected above the thread header */}
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
