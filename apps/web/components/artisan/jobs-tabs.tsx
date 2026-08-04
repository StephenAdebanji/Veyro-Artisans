"use client";

import { useState } from "react";
import { Inbox, ListChecks, Zap } from "lucide-react";
import { ArtisanJobFeed } from "@/components/dashboard/artisan-job-feed";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
import type { AvailableRequestSummary, SkillCategory } from "@veyro/contracts";

type Tab = "available" | "pending" | "active";

interface ArtisanJobsTabsProps {
  availableJobs: AvailableRequestSummary[];
  artisanId: string;
  category: SkillCategory | null;
  artisanLat?: number;
  artisanLng?: number;
  serviceRadiusKm: number;
  pendingRows: JobsTableRow[];
  activeRows: JobsTableRow[];
}

export function ArtisanJobsTabs({
  availableJobs,
  artisanId,
  category,
  artisanLat,
  artisanLng,
  serviceRadiusKm,
  pendingRows,
  activeRows,
}: ArtisanJobsTabsProps) {
  const [tab, setTab] = useState<Tab>("available");

  const tabs: { id: Tab; label: string; count: number; icon: typeof Inbox; accent: string }[] = [
    { id: "available", label: "Available", count: availableJobs.length, icon: Inbox, accent: "emerald" },
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
