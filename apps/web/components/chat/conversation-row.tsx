"use client";

interface ConversationRowProps {
  id: string;
  counterpartName: string;
  lastMessageAt: string | null;
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ConversationRow({
  counterpartName,
  lastMessageAt,
  unreadCount,
  selected,
  onClick,
}: ConversationRowProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
        selected ? "bg-muted" : ""
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initials(counterpartName) || "?"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{counterpartName}</span>
          {lastMessageAt && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(lastMessageAt)}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <span className="mt-0.5 inline-block rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
