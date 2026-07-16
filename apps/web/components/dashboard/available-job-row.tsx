"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { AvailableRequestSummary } from "@veyro/contracts";

export function AvailableJobRow({ job }: { job: AvailableRequestSummary }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [price, setPrice] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch(`/api/service-requests/${job.id}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedPrice: Number(price),
        etaMinutes: Number(etaMinutes),
        distanceKm: job.distanceKm,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const msg = typeof body?.error === "string" ? body.error : "Could not send your offer.";
      setError(msg);
      if (response.status === 409) {
        setUnavailable(true);
        setExpanded(false);
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{job.description || SKILL_LABELS[job.category]}</p>
          <p className="text-sm text-muted-foreground">
            {job.address} · {job.distanceKm.toFixed(1)} km away
            {job.budgetMin || job.budgetMax ? ` · Budget ₦${job.budgetMin ?? "?"}-₦${job.budgetMax ?? "?"}` : ""}
          </p>
        </div>
        {!sent && !unavailable && (
          <Button type="button" size="sm" variant={expanded ? "outline" : "default"} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Cancel" : "Send offer"}
          </Button>
        )}
        {sent && <span className="text-sm font-medium text-emerald-600">Offer sent</span>}
        {unavailable && <span className="text-xs font-medium text-muted-foreground">Unavailable</span>}
      </div>

      {expanded && !sent && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
          <Input
            type="number"
            placeholder="Price (₦)"
            className="w-32"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="ETA (min)"
            className="w-32"
            value={etaMinutes}
            onChange={(event) => setEtaMinutes(event.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Sending…" : "Submit offer"}
          </Button>
          {error && <p className="w-full text-sm text-destructive">{error}</p>}
        </form>
      )}

      {unavailable && error && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{error}</p>
      )}
    </div>
  );
}
