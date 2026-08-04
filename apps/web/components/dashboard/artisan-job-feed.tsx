"use client";

import { useEffect, useRef, useState } from "react";
import type { AvailableRequestSummary, SkillCategory } from "@veyro/contracts";
import { haversineKm } from "@/platform/geo";
import { AvailableJobRow } from "./available-job-row";
import { useAvailableJobsCount } from "./available-jobs-count-context";
import { apiFetch } from "@/lib/api-client";

type IncomingJob = {
  id: string;
  description: string;
  address: string;
  budgetMin: number | null;
  budgetMax: number | null;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  createdAt: string;
  category: SkillCategory;
  homeownerName?: string | null;
};

interface ArtisanJobFeedProps {
  initialJobs: AvailableRequestSummary[];
  artisanId: string;
  category: SkillCategory;
  artisanLat?: number;
  artisanLng?: number;
  serviceRadiusKm?: number;
}

export function ArtisanJobFeed({
  initialJobs,
  artisanId,
  category,
  artisanLat,
  artisanLng,
  serviceRadiusKm,
}: ArtisanJobFeedProps) {
  const [jobs, setJobs] = useState<AvailableRequestSummary[]>(initialJobs);
  // Seeded from every job already on the page, not just ones that arrive
  // live after mount — every available job commands attention on login,
  // regardless of whether it was already there on page load.
  const [newJobIds, setNewJobIds] = useState<Set<string>>(
    () => new Set(initialJobs.filter((j) => !j.isInvited).map((j) => j.id)),
  );
  // Seeded from the server-persisted invite records (survives logout/reload)
  // rather than starting empty and relying purely on a live socket event.
  const [invitedJobIds, setInvitedJobIds] = useState<Set<string>>(
    () => new Set(initialJobs.filter((j) => j.isInvited).map((j) => j.id)),
  );
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);
  const jobsCount = useAvailableJobsCount();
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null);
  const expiredNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The offer window closed out from under this row before the artisan
  // finished submitting — drop it and surface why, rather than leaving a
  // dead card or silently vanishing it with no explanation.
  function removeExpiredJob(jobId: string) {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setExpiredNotice("That offer window closed. Keep an eye out — newer jobs show up here live.");
    if (expiredNoticeTimer.current) clearTimeout(expiredNoticeTimer.current);
    expiredNoticeTimer.current = setTimeout(() => setExpiredNotice(null), 6000);
  }

  useEffect(() => {
    return () => {
      if (expiredNoticeTimer.current) clearTimeout(expiredNoticeTimer.current);
    };
  }, []);

  // Keeps any "Available jobs" count displayed elsewhere on the page (a stat
  // card, a header sentence) in sync with this feed's live list — those are
  // otherwise server-rendered once and go stale as jobs arrive/get sent to.
  useEffect(() => {
    jobsCount?.setCount(jobs.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  // Only clears the "new" highlight — "invited" is a persisted fact about
  // the request (see JobInvite in schema.prisma) and must stay shown until
  // the request itself is cancelled or its offer window closes, not just
  // because the artisan engaged with the row.
  function markSeen(jobId: string) {
    setNewJobIds((prev) => {
      if (!prev.has(jobId)) return prev;
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }

  useEffect(() => {
    let mounted = true;

    async function connect() {
      let token: string;
      try {
        ({ token } = await apiFetch<{ token: string }>("/api/realtime-token"));
      } catch {
        return;
      }
      if (!mounted) return;

      const { io } = await import("socket.io-client");
      const socket = io(
        `${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/matching`,
        { auth: { token }, transports: ["websocket"] },
      );
      socketRef.current = socket;

      socket.emit("join-skill", { category });

      socket.on("job:new", (job: IncomingJob) => {
        if (!mounted) return;

        // Compute distance from artisan's GPS to the job location.
        const distanceKm =
          artisanLat !== undefined && artisanLng !== undefined && job.lat !== undefined && job.lng !== undefined
            ? haversineKm({ lat: artisanLat, lng: artisanLng }, { lat: job.lat, lng: job.lng })
            : (job.distanceKm ?? 0);

        // Drop jobs outside the artisan's service radius.
        if (serviceRadiusKm !== undefined && distanceKm > serviceRadiusKm) return;

        setJobs((prev) => {
          if (prev.some((j) => j.id === job.id)) return prev;
          const newJob: AvailableRequestSummary = {
            id: job.id,
            category: job.category,
            description: job.description,
            address: job.address,
            budgetMin: job.budgetMin,
            budgetMax: job.budgetMax,
            distanceKm,
            createdAt: job.createdAt,
            homeownerName: job.homeownerName ?? null,
            isInvited: false,
          };
          return [newJob, ...prev];
        });
        setNewJobIds((prev) => new Set(prev).add(job.id));
      });

      // A homeowner picked this artisan specifically from the AI panel — show
      // it even if it's outside their usual radius, since they were chosen
      // deliberately rather than matched by the generic broadcast.
      socket.on("job:invited", (job: IncomingJob) => {
        if (!mounted) return;

        const distanceKm =
          artisanLat !== undefined && artisanLng !== undefined && job.lat !== undefined && job.lng !== undefined
            ? haversineKm({ lat: artisanLat, lng: artisanLng }, { lat: job.lat, lng: job.lng })
            : (job.distanceKm ?? 0);

        setJobs((prev) => {
          if (prev.some((j) => j.id === job.id)) return prev;
          const newJob: AvailableRequestSummary = {
            id: job.id,
            category: job.category,
            description: job.description,
            address: job.address,
            budgetMin: job.budgetMin,
            budgetMax: job.budgetMax,
            distanceKm,
            createdAt: job.createdAt,
            homeownerName: job.homeownerName ?? null,
            isInvited: true,
          };
          return [newJob, ...prev];
        });
        setInvitedJobIds((prev) => new Set(prev).add(job.id));
      });
    }

    connect().catch(console.error);
    return () => {
      mounted = false;
      socketRef.current?.emit("leave-skill", { category });
      socketRef.current?.disconnect();
    };
  }, [artisanId, category, artisanLat, artisanLng, serviceRadiusKm]);

  return (
    <div className="space-y-3">
      {expiredNotice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {expiredNotice}
        </div>
      )}
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new requests nearby right now.</p>
      ) : (
        jobs.map((job) => (
          <AvailableJobRow
            key={job.id}
            job={job}
            isNew={newJobIds.has(job.id)}
            isInvited={invitedJobIds.has(job.id)}
            onSeen={() => markSeen(job.id)}
            onExpired={() => removeExpiredJob(job.id)}
          />
        ))
      )}
    </div>
  );
}
