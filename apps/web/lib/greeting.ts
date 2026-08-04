const NIGERIA_TIMEZONE = "Africa/Lagos";

/** Three solid, non-overlapping states — computed in Nigeria's timezone
 * regardless of where the server process itself is running (Vercel's
 * serverless functions run in UTC), so the boundary doesn't silently shift
 * with deployment region. */
export function getTimeOfDayGreeting(date: Date = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: NIGERIA_TIMEZONE }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
