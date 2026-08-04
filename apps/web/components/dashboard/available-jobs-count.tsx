"use client";

import { useAvailableJobsCount } from "./available-jobs-count-context";

/** Renders the live available-jobs count from context — use anywhere inside
 * an AvailableJobsCountProvider that needs the number to stay in sync with
 * ArtisanJobFeed instead of a server-rendered value frozen at page load. */
export function AvailableJobsCount({ fallback }: { fallback: number }) {
  const ctx = useAvailableJobsCount();
  return <>{ctx?.count ?? fallback}</>;
}
