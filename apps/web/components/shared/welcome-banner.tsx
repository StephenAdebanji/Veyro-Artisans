"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function WelcomeBanner({ name, role }: { name: string; role: "homeowner" | "artisan" }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const message =
    role === "homeowner"
      ? `Welcome to VEYRO, ${name}! 🎉 You're all set. Browse artisans near you and post your first request below.`
      : `Welcome aboard, ${name}! 🚀 Complete your profile and verification to start receiving job requests.`;

  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{message}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
