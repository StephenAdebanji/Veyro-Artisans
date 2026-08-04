"use client";

import { useEffect, useRef, useState } from "react";
import { Inbox, ListChecks, X, XCircle, Zap } from "lucide-react";
import { ArtisanJobFeed } from "@/components/dashboard/artisan-job-feed";
import { AvailableJobsCountProvider, useAvailableJobsCount } from "@/components/dashboard/available-jobs-count-context";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
import { apiFetch } from "@/lib/api-client";
import type { AvailableRequestSummary, DeclinedOfferNotice, SkillCategory } from "@veyro/contracts";

type Tab = "available" | "pending" | "active";

const DISMISS_AFTER_MS = 10_000;
const SEEN_KEY_PREFIX = "veyro:declined_offer_seen:";

function hasSeenDecline(matchId: string): boolean {
  try {
    return localStorage.getItem(SEEN_KEY_PREFIX + matchId) === "1";
  } catch {
    return false;
  }
}

function markDeclineSeen(matchId: string): void {
  try {
    localStorage.setItem(SEEN_KEY_PREFIX + matchId, "1");
  } catch {
    // Storage unavailable (private browsing, etc.) — the notice will just
    // resurface next visit, which is a harmless degradation.
  }
}

interface ArtisanJobsTabsProps {
  availableJobs: AvailableRequestSummary[];
  artisanId: string;
  category: SkillCategory | null;
  artisanLat?: number;
  artisanLng?: number;
  serviceRadiusKm: number;
  pendingRows: JobsTableRow[];
  activeRows: JobsTableRow[];
  /** Offers declined in the last 48h that this artisan hasn't been shown yet
   * (tracked via localStorage) — surfaced as a dismissible notice with the
   * decline reason, auto-hidden 10s after it's first shown. */
  initialDeclinedNotices: DeclinedOfferNotice[];
}

export function ArtisanJobsTabs(props: ArtisanJobsTabsProps) {
  return (
    <AvailableJobsCountProvider initialCount={props.availableJobs.length}>
      <ArtisanJobsTabsInner {...props} />
    </AvailableJobsCountProvider>
  );
}

function ArtisanJobsTabsInner({
  availableJobs,
  artisanId,
  category,
  artisanLat,
  artisanLng,
  serviceRadiusKm,
  pendingRows,
  activeRows,
  initialDeclinedNotices,
}: ArtisanJobsTabsProps) {
  const jobsCount = useAvailableJobsCount();
  const [tab, setTab] = useState<Tab>("available");
  const [declinedNotices, setDeclinedNotices] = useState<DeclinedOfferNotice[]>([]);
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function dismissNotice(matchId: string) {
    setDeclinedNotices((prev) => prev.filter((n) => n.matchId !== matchId));
    const timer = dismissTimers.current.get(matchId);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.current.delete(matchId);
    }
  }

  function showNotice(notice: DeclinedOfferNotice) {
    if (hasSeenDecline(notice.matchId)) return;
    markDeclineSeen(notice.matchId);
    setDeclinedNotices((prev) => (prev.some((n) => n.matchId === notice.matchId) ? prev : [...prev, notice]));
    const timer = setTimeout(() => dismissNotice(notice.matchId), DISMISS_AFTER_MS);
    dismissTimers.current.set(notice.matchId, timer);
  }

  // Surface any not-yet-seen recently-declined offers on load.
  useEffect(() => {
    initialDeclinedNotices.forEach(showNotice);
    const timers = dismissTimers.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeclinedNotices]);

  // Own socket connection (independent of which tab is active) so a live
  // decline notice arrives even if the artisan isn't on the Available tab.
  useEffect(() => {
    let mounted = true;
    let socket: import("socket.io-client").Socket | undefined;

    async function connect() {
      let token: string;
      try {
        ({ token } = await apiFetch<{ token: string }>("/api/realtime-token"));
      } catch {
        return;
      }
      if (!mounted) return;

      const { io } = await import("socket.io-client");
      socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/matching`, {
        auth: { token },
        transports: ["websocket"],
      });
      socket.on("offer:declined", (notice: DeclinedOfferNotice) => {
        if (!mounted) return;
        showNotice(notice);
      });
    }

    connect().catch(console.error);
    return () => {
      mounted = false;
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artisanId]);

  const tabs: { id: Tab; label: string; count: number; icon: typeof Inbox; accent: string }[] = [
    { id: "available", label: "Available", count: jobsCount?.count ?? availableJobs.length, icon: Inbox, accent: "emerald" },
    { id: "pending", label: "My offers", count: pendingRows.length, icon: Zap, accent: "amber" },
    { id: "active", label: "In progress", count: activeRows.length, icon: ListChecks, accent: "blue" },
  ];

  const accentClasses: Record<string, { active: string; badge: string }> = {
    emerald: {
      active: "border-emerald-500 bg-emerald-500 text-white",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    },
    amber: {
      active: "border-amber-500 bg-amber-500 text-white",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    blue: {
      active: "border-blue-500 bg-blue-500 text-white",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    },
  };

  return (
    <div>
      {declinedNotices.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {declinedNotices.map((notice) => (
            <div
              key={notice.matchId}
              className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900 dark:bg-rose-950/30"
            >
              <div className="flex items-start gap-2.5">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                    Offer declined — {notice.description}
                  </p>
                  <p className="mt-0.5 text-sm text-rose-700 dark:text-rose-400">{notice.reason}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissNotice(notice.matchId)}
                aria-label="Dismiss"
                className="shrink-0 rounded p-0.5 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, count, icon: Icon, accent }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? accentClasses[accent].active : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive ? "bg-white/25 text-white" : accentClasses[accent].badge
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "available" &&
          (category ? (
            <ArtisanJobFeed
              initialJobs={availableJobs}
              artisanId={artisanId}
              category={category}
              artisanLat={artisanLat}
              artisanLng={artisanLng}
              serviceRadiusKm={serviceRadiusKm}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your profile (set your trade category) to see available jobs.
            </p>
          ))}

        {tab === "pending" && (
          <div className="rounded-2xl border bg-card p-4">
            {pendingRows.length > 0 ? (
              <JobsTable rows={pendingRows} />
            ) : (
              <p className="text-sm text-muted-foreground">No pending offers — send one from the Available tab.</p>
            )}
          </div>
        )}

        {tab === "active" && (
          <div className="rounded-2xl border bg-card p-4">
            {activeRows.length > 0 ? (
              <JobsTable rows={activeRows} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing in progress right now.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
