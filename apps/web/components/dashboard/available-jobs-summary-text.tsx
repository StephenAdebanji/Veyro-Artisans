"use client";

import { useAvailableJobsCount } from "./available-jobs-count-context";

/** The "You have N new requests within X km" sentence, reactive to the same
 * live count ArtisanJobFeed reports — includes the plural/singular wording,
 * which a plain <AvailableJobsCount> slot can't handle on its own. */
export function AvailableJobsSummaryText({
  serviceRadiusKm,
  fallback,
}: {
  serviceRadiusKm: number;
  fallback: number;
}) {
  const ctx = useAvailableJobsCount();
  const count = ctx?.count ?? fallback;
  return (
    <>
      You have {count} new request{count === 1 ? "" : "s"} within {serviceRadiusKm} km.
    </>
  );
}
