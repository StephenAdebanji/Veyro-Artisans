"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";

export function StartChatButton({
  homeownerId,
  jobId,
}: {
  homeownerId: string;
  jobId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeownerId, jobId }),
      });
      if (!res.ok) return;
      const { conversationId } = await res.json();
      router.push(`/artisan/messages?c=${conversationId}`);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Chat
    </button>
  );
}
