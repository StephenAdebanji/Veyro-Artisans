"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Briefcase, CheckCircle2, ListChecks } from "lucide-react";
import { TrustScoreRing } from "@/components/dashboard/trust-score-ring";
import { StatCard } from "@/components/dashboard/stat-card";

export interface ArtisanDashboardStats {
  trustScore: number;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  totalJobsAccepted: number;
  responseTimeAvgSeconds: number;
  activeJobsCount: number;
  completedJobsCount: number;
}

const StatsContext = createContext<ArtisanDashboardStats | null>(null);

function useStats() {
  return useContext(StatsContext);
}

/** Wraps the artisan dashboard and polls /api/artisan/me/dashboard-stats every 45 s.
 *  All child components (LiveTrustScoreRing, LiveStatTiles) read from this context
 *  so only one request is made per poll cycle regardless of how many consumers exist. */
export function ArtisanDashboardStatsProvider({
  initial,
  children,
}: {
  initial: ArtisanDashboardStats;
  children: ReactNode;
}) {
  const [stats, setStats] = useState<ArtisanDashboardStats>(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/artisan/me/dashboard-stats", { cache: "no-store" });
        if (res.ok) {
          const fresh = (await res.json()) as ArtisanDashboardStats;
          setStats(fresh);
        }
      } catch {
        // keep showing last known values on network blip
      }
    }, 45_000);
    return () => clearInterval(id);
  }, []);

  return <StatsContext.Provider value={stats}>{children}</StatsContext.Provider>;
}

/** Drop-in replacement for the static TrustScoreRing — reads live data from context. */
export function LiveTrustScoreRing() {
  const s = useStats();
  if (!s) return null;
  return (
    <TrustScoreRing
      score={s.trustScore}
      isVerified={s.isVerified}
      ratingAvg={s.ratingAvg}
      ratingCount={s.ratingCount}
      completedJobs={s.completedJobs}
      totalJobsAccepted={s.totalJobsAccepted}
      responseTimeAvgSeconds={s.responseTimeAvgSeconds}
    />
  );
}

/** The three stat tiles (available jobs slot is injected as a node because it
 *  has its own live context via AvailableJobsCountProvider).
 *  ratingSlot is the 4th tile — pass <RatingCard> from the server component. */
export function LiveStatTiles({
  availableJobsSlot,
  ratingSlot,
}: {
  availableJobsSlot: ReactNode;
  ratingSlot: ReactNode;
}) {
  const s = useStats();

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-4">
      {/* Available jobs — controlled by AvailableJobsCountProvider, not this context */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-4">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-indigo-500" />
        <ListChecks className="size-5 text-indigo-600 dark:text-indigo-400" />
        <p className="mt-3 text-3xl font-bold tracking-tight">{availableJobsSlot}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Available jobs</p>
      </div>

      <StatCard
        icon={Briefcase}
        value={s?.activeJobsCount ?? "—"}
        label="Active jobs"
        href="/artisan/history?tab=active"
        accent="blue"
      />
      <StatCard
        icon={CheckCircle2}
        value={s?.completedJobsCount ?? "—"}
        label="Completed"
        href="/artisan/history?tab=completed"
        accent="emerald"
      />
      {ratingSlot}
    </div>
  );
}
