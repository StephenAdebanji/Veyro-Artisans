"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DisputeItem {
  id: string;
  jobId: string;
  raisedBy: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "ESCALATED";
  createdAt: string;
  artisanId: string;
  homeownerId: string;
  agreedPrice: number | null;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="text-[10px]">
              {item.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm font-medium line-clamp-2">{item.reason}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Job <span className="font-mono">{item.jobId.slice(0, 10)}…</span>
            {item.agreedPrice !== null && (
              <> &mdash; ₦{item.agreedPrice.toLocaleString()}</>
            )}
          </p>
        </div>
        <span className="text-xs text-primary">{expanded ? "▲ Collapse" : "▼ Resolve"}</span>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Raised by <span className="font-mono">{item.raisedBy.slice(0, 12)}…</span>
          </p>
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
