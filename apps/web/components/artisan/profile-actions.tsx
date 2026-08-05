"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

/** Chat/Call for an authenticated homeowner browsing the public artisan
 * profile page — distinct from the page's plain "sign in to chat/call"
 * links shown to anyone not already signed in as a homeowner. */
export function ArtisanProfileActions({ artisanId, phone }: { artisanId: string; phone: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleChat() {
    setError(null);
    startTransition(async () => {
      try {
        const { conversationId } = await apiFetch<{ conversationId: string }>("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artisanId }),
        });
        router.push(`/homeowner/messages?c=${conversationId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start chat. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleChat}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Opening…" : "Chat"}
        </button>
        {phone && revealed ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
          >
            <Phone className="size-3.5" /> {phone}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!phone}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <Phone className="size-3.5" /> Call
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
