"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AvailableJobsCountValue {
  count: number;
  setCount: (count: number) => void;
}

const AvailableJobsCountContext = createContext<AvailableJobsCountValue | null>(null);

/** Wraps a section of the page that shows the live "available jobs" count in
 * more than one spot (e.g. a header sentence and a stat card) alongside the
 * ArtisanJobFeed that actually knows the live number — the feed reports
 * count changes in here instead of each display spot staying frozen at the
 * server-rendered initial value. */
export function AvailableJobsCountProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  return (
    <AvailableJobsCountContext.Provider value={{ count, setCount }}>
      {children}
    </AvailableJobsCountContext.Provider>
  );
}

/** Returns null when rendered outside a provider — callers should no-op
 * rather than throw, since ArtisanJobFeed is reused on pages that may not
 * need live count tracking. */
export function useAvailableJobsCount(): AvailableJobsCountValue | null {
  return useContext(AvailableJobsCountContext);
}
