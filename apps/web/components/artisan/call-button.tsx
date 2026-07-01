"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

interface CallButtonProps {
  phone: string | null;
}

export function CallButton({ phone }: CallButtonProps) {
  const [revealed, setReveal] = useState(false);

  if (!phone) {
    return (
      <span className="flex items-center justify-center gap-2 rounded-xl border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
        <Phone className="h-4 w-4" />
        No number
      </span>
    );
  }

  if (revealed) {
    return (
      <a
        href={`tel:${phone}`}
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-opacity hover:opacity-90 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      >
        <Phone className="h-4 w-4" />
        {phone}
      </a>
    );
  }

  return (
    <button
      onClick={() => setReveal(true)}
      className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
    >
      <Phone className="h-4 w-4" />
      Call customer
    </button>
  );
}
