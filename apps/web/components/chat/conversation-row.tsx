"use client";

import { Avatar } from "@/components/shared/avatar";

interface ConversationRowProps {
  id: string;
  counterpartName: string;
  counterpartPhotoUrl?: string | null;
  lastMessageAt: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  selected: boolean;
  onClick: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ConversationRow({
  counterpartName,
  counterpartPhotoUrl,
  lastMessageAt,
  lastMessagePreview,
  unreadCount,
  selected,
  onClick,
}: ConversationRowProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${
        selected ? "bg-muted" : ""
      }`}
    >
      <div className="relative shrink-0">
        <Avatar src={counterpartPhotoUrl} name={counterpartName} size={44} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm ${unreadCount > 0 ? "font-semibold" : "font-medium"}`}>
            {counterpartName}
          </span>
          {lastMessageAt && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(lastMessageAt)}
            </span>
          )}
        </div>
        {lastMessagePreview ? (
          <p className={`mt-0.5 truncate text-xs ${unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {lastMessagePreview}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/50">No messages yet</p>
        )}
      </div>
    </button>
  );
}
