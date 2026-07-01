"use client";

import { useState, useEffect } from "react";
import { X, PartyPopper } from "lucide-react";

export function VerifiedBanner({ artisanId }: { artisanId: string }) {
  const storageKey = `veyro:verified_dismissed:${artisanId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 pr-10 dark:border-emerald-900 dark:bg-emerald-950/30">
      <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Your application has been accepted!
        </p>
        <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">
          You are now fully verified. Go to the{" "}
          <a href="/artisan/jobs" className="font-medium underline underline-offset-2">
            Jobs page
          </a>{" "}
          to start viewing and accepting job requests.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded p-0.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
