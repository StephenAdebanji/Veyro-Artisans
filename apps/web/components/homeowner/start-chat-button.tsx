"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function StartChatButton({
  artisanId,
  jobId,
}: {
  artisanId: string;
  jobId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const { conversationId } = await apiFetch<{ conversationId: string }>("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artisanId, jobId }),
        });
        router.push(`/homeowner/messages?c=${conversationId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start chat. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        Chat
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
