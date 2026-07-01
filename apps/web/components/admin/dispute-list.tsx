"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DisputeItem {
  id: string;
  jobId: string;
  raisedBy: string;
  raisedByName: string | null;
  raisedByEmail: string | null;
  raisedByRole: string | null;
  reason: string;
  status: "OPEN" | "RESOLVED" | "ESCALATED";
  createdAt: string;
  artisanId: string | null;
  homeownerId: string | null;
  agreedPrice: number | null;
}

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     "bg-rose-100 text-rose-700",
  ARTISAN:   "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function DisputeRow({
  item,
  onResolved,
}: {
  item: DisputeItem;
  onResolved: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return null;

  const displayName = item.raisedByName ?? `User ${item.raisedBy.slice(0, 8)}…`;
  const role = item.raisedByRole;

  return (
    <li className="rounded-xl border bg-card">
      <div
        className="flex cursor-pointer flex-wrap items-start justify-between gap-3 p-4"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          {/* Name + role category + status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">{displayName}</span>
            </div>
            {role && (
              <Badge className={`text-[10px] ${ROLE_STYLE[role] ?? "bg-muted text-muted-foreground"}`}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </Badge>
            )}
            <Badge variant="destructive" className="text-[10px]">
              {item.status}
            </Badge>
          </div>

          {/* Email — clickable mailto */}
          {item.raisedByEmail && (
            <a
              href={`mailto:${item.raisedByEmail}`}
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" />
              {item.raisedByEmail}
            </a>
          )}

          {/* Dispute reason */}
          <p className="mt-2 text-sm font-medium line-clamp-2">{item.reason}</p>

          {/* Job info + accurate date/time */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {item.jobId ? (
              <span>Job <span className="font-mono">{item.jobId.slice(0, 10)}…</span></span>
            ) : (
              <span className="italic">General dispute (no job)</span>
            )}
            {item.agreedPrice !== null && (
              <span>₦{item.agreedPrice.toLocaleString()}</span>
            )}
            <span>{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-primary">{expanded ? "▲ Collapse" : "▼ Resolve"}</span>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="Enter resolution notes…"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={pending || !resolution.trim()}
              onClick={() =>
                startTransition(async () => {
                  await fetch(`/api/admin/disputes/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resolution }),
                  });
                  onResolved(item.id);
                  setDone(true);
                })
              }
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Mark resolved
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function DisputeList({ initialItems }: { initialItems: DisputeItem[] }) {
  const [items, setItems] = useState(initialItems);

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 py-16">
        <AlertTriangle className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No open disputes</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <DisputeRow key={item.id} item={item} onResolved={handleResolved} />
      ))}
    </ul>
  );
}
