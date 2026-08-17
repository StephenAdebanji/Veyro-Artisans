"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IDLE_TIMEOUT_MS } from "@/lib/session";

const WARNING_BEFORE_MS = 60 * 1000; // show the "still there?" prompt this long before sign-out
const TOUCH_INTERVAL_MS = 5 * 60 * 1000; // how often genuine activity re-extends the server session
const TICK_MS = 1000;

// mousemove is deliberately excluded — cursor jitter/trackpad drift fires it
// even while someone is genuinely away from the keyboard, which would make
// the 30-minute idle timeout never actually trigger. These are the signals
// that require a person actually doing something.
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "wheel", "scroll"] as const;

const ACTIVITY_STORAGE_KEY = "veyro:lastActivity";
const SIGNOUT_STORAGE_KEY = "veyro:idleSignedOut";

function now() {
  return Date.now();
}

/** Idle-timeout session guard: signs the user out (with a warning first)
 * after IDLE_TIMEOUT_MS of no real activity, synced across tabs via
 * localStorage. Mount once per protected layout (homeowner/artisan/admin) —
 * see platform/auth-session.ts for why the server-side half of this (the
 * JWT's actual expiry) requires this component to work at all. */
export function IdleSessionGuard() {
  const { update } = useSession();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivityRef = useRef(now());
  const lastTouchRef = useRef(now());
  const signingOutRef = useRef(false);

  const recordActivity = useCallback(() => {
    const t = now();
    lastActivityRef.current = t;
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(t));
    } catch {
      // Private browsing / storage disabled — this tab's own timer still works.
    }
  }, []);

  const forceSignOut = useCallback(() => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      localStorage.setItem(SIGNOUT_STORAGE_KEY, String(now()));
    } catch {
      // Ignore — other tabs just won't hear about it, this tab still signs out.
    }
    void signOut({ redirect: false }).finally(() => {
      // Hard navigation + history replace, same reasoning as the account-
      // deletion flow: guarantees the browser back button can't land on a
      // page rendered under the now-dead session.
      window.location.replace("/sign-in?reason=idle");
    });
  }, []);

  useEffect(() => {
    // A fresh tab/page load is itself evidence of presence — but if another
    // tab recorded more recent activity, trust that instead.
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored) lastActivityRef.current = Math.max(lastActivityRef.current, Number(stored));
    } catch {
      // Ignore — falls back to this tab's own mount time.
    }

    let throttled = false;
    function handleActivity() {
      if (throttled) return;
      throttled = true;
      setTimeout(() => {
        throttled = false;
      }, 1000);
      recordActivity();
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === ACTIVITY_STORAGE_KEY && e.newValue) {
        lastActivityRef.current = Math.max(lastActivityRef.current, Number(e.newValue));
      }
      if (e.key === SIGNOUT_STORAGE_KEY) {
        window.location.replace("/sign-in?reason=idle");
      }
    }

    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, handleActivity, { passive: true });
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const t = now();
      const idleFor = t - lastActivityRef.current;

      if (idleFor >= IDLE_TIMEOUT_MS) {
        forceSignOut();
        return;
      }

      if (idleFor >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        setSecondsLeft(Math.max(0, Math.round((IDLE_TIMEOUT_MS - idleFor) / 1000)));
        return;
      }

      setSecondsLeft(null);

      // Only ever extend the server-side session off genuinely recent
      // activity — never just because the overall idle clock hasn't run
      // out yet, or this "touch" would silently turn a 30-minute idle
      // timeout into an unlimited one for anyone with the tab merely open.
      const recentlyActive = idleFor < TOUCH_INTERVAL_MS;
      const dueForTouch = t - lastTouchRef.current >= TOUCH_INTERVAL_MS;
      if (recentlyActive && dueForTouch) {
        lastTouchRef.current = t;
        update().catch(() => {});
      }
    }, TICK_MS);

    return () => {
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, handleActivity);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [recordActivity, forceSignOut, update]);

  function handleStayActive() {
    recordActivity();
    lastTouchRef.current = now();
    update().catch(() => {});
    setSecondsLeft(null);
  }

  return (
    <Dialog open={secondsLeft !== null}>
      <DialogContent
        className="max-w-sm"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{" "}
            <span className="font-semibold tabular-nums text-foreground">{secondsLeft ?? 0}s</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={forceSignOut}>
            Sign out now
          </Button>
          <Button onClick={handleStayActive}>Stay signed in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
