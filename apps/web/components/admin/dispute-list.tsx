"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mail, User, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";

export interface DisputeItem {
  id: string;
  jobId: string;
  raisedBy: string;
  raisedByName: string | null;
  raisedByEmail: string | null;
  raisedByRole: string | null;
  reason: string;
  status: "OPEN" | "RESOLVED" | "ESCALATED";
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
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
  return new Date(iso).toLocaleString("en-NG", {
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
  const [error, setError] = useState<string | null>(null);

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

          <p className="mt-2 text-sm font-medium line-clamp-2">{item.reason}</p>

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
                  setError(null);
                  try {
                    await apiFetch(`/api/admin/disputes/${item.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ resolution }),
                    });
                    onResolved(item.id);
                    setDone(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not save. Please try again.");
                  }
                })
              }
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Mark resolved
            </Button>
          </div>
          {error && <p className="mt-2 text-right text-xs text-destructive">{error}</p>}
        </div>
      )}
    </li>
  );
}

function ResolvedHistoryTable({ items }: { items: DisputeItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 py-16">
        <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No resolved disputes yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Raised by</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Resolution notes</th>
            <th className="px-4 py-3 font-medium">Logged</th>
            <th className="px-4 py-3 font-medium">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const displayName = item.raisedByName ?? `User ${item.raisedBy.slice(0, 8)}…`;
            return (
              <tr key={item.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{displayName}</span>
                      {item.raisedByRole && (
                        <Badge className={`text-[10px] ${ROLE_STYLE[item.raisedByRole] ?? "bg-muted text-muted-foreground"}`}>
                          {item.raisedByRole.charAt(0) + item.raisedByRole.slice(1).toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    {item.raisedByEmail && (
                      <a href={`mailto:${item.raisedByEmail}`} className="text-xs text-primary hover:underline">
                        {item.raisedByEmail}
                      </a>
                    )}
                  </div>
                </td>
                <td className="max-w-[180px] px-4 py-3">
                  <p className="line-clamp-3 text-muted-foreground">{item.reason}</p>
                </td>
                <td className="max-w-[200px] px-4 py-3">
                  {item.resolution ? (
                    <p className="line-clamp-3 text-emerald-700">{item.resolution}</p>
                  ) : (
                    <span className="italic text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(item.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.resolvedAt ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {formatDateTime(item.resolvedAt)}
                    </div>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Tab = "open" | "history";

export function DisputeList({
  openItems: initialOpen,
  resolvedItems,
}: {
  openItems: DisputeItem[];
  resolvedItems: DisputeItem[];
}) {
  const [openItems, setOpenItems] = useState(initialOpen);
  const [tab, setTab] = useState<Tab>("open");

  function handleResolved(id: string) {
    setOpenItems((prev) => prev.filter((i) => i.id !== id));
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "open", label: "Open", count: openItems.length },
    { key: "history", label: "History", count: resolvedItems.length },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {tab === "open" && (
        openItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 py-16">
            <AlertTriangle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No open disputes</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {openItems.map((item) => (
              <DisputeRow key={item.id} item={item} onResolved={handleResolved} />
            ))}
          </ul>
        )
      )}

      {tab === "history" && <ResolvedHistoryTable items={resolvedItems} />}
    </div>
  );
}
