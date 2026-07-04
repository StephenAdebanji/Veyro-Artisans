"use client";

import { useEffect, useRef, useState } from "react";
import type { AvailableRequestSummary, SkillCategory } from "@veyro/contracts";
import { haversineKm } from "@/platform/geo";
import { AvailableJobRow } from "./available-job-row";

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
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      const res = await fetch("/api/realtime-token");
      if (!res.ok || !mounted) return;
      const { token } = (await res.json()) as { token: string };
      if (!mounted) return;

      const { io } = await import("socket.io-client");
      const socket = io(
        `${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/matching`,
        { auth: { token }, transports: ["websocket"] },
      );
      socketRef.current = socket;

      socket.emit("join-skill", { category });

      socket.on(
        "job:new",
        (job: { id: string; description: string; address: string; budgetMin: number | null; budgetMax: number | null; lat?: number; lng?: number; distanceKm?: number; createdAt: string; category: SkillCategory }) => {
          if (!mounted) return;

          // Compute distance from artisan's GPS to the job location.
          let distanceKm =
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
            };
            return [newJob, ...prev];
          });
        },
      );
    }

    connect().catch(console.error);
    return () => {
      mounted = false;
      socketRef.current?.emit("leave-skill", { category });
      socketRef.current?.disconnect();
    };
  }, [artisanId, category, artisanLat, artisanLng, serviceRadiusKm]);

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No new requests nearby right now.</p>;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <AvailableJobRow key={job.id} job={job} />
      ))}
    </div>
  );
}
