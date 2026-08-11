"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Re-validates the session on every path change within a protected layout
 * (homeowner/artisan/admin) and hard-redirects if it's gone.
 *
 * Why this exists: a Next.js layout persists across navigations between
 * pages it wraps — that's the whole point of nested layouts — so the
 * layout's server-side `auth()` gate only runs once, on first entry into the
 * section. Confirmed experimentally that after sign-out/account deletion,
 * pressing the browser's back button from e.g. /account to /dashboard (both
 * under the same layout) repaints /dashboard from Next's client Router Cache
 * *without* ever re-running that gate — even though the session cookie is
 * genuinely gone by then. Neither `popstate` nor `pageshow`/`persisted`
 * reliably fire for this (Next's router owns back/forward handling), so
 * instead of guessing which browser event applies, this just asks the
 * server directly, keyed off the one thing that's guaranteed to change on
 * every navigation the Router Cache might serve stale: the pathname. */
export function BfcacheGuard() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (!cancelled && !session?.user) {
          window.location.replace("/sign-in");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
