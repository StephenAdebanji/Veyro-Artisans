"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import type { AvailableRequestSummary } from "@veyro/contracts";

interface AvailableJobRowProps {
  job: AvailableRequestSummary;
  /** True while this job hasn't been acknowledged yet — arrived live via
   * socket since the feed mounted, rather than being part of the initial load. */
  isNew?: boolean;
  /** Called once the artisan engages with the row, clearing the "new" highlight. */
  onSeen?: () => void;
}

export function AvailableJobRow({ job, isNew, onSeen }: AvailableJobRowProps) {
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

    try {
      await apiFetch(`/api/service-requests/${job.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPrice: Number(price),
          etaMinutes: Number(etaMinutes),
          distanceKm: job.distanceKm,
        }),
      });
      setSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your offer.");
      if (err instanceof ApiRequestError && err.status === 409) {
        setUnavailable(true);
        setExpanded(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isNew
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10"
          : "bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                <Sparkles className="h-2.5 w-2.5" /> New
              </span>
            )}
            {job.homeownerName && (
              <p className="text-xs font-medium text-muted-foreground">{job.homeownerName}</p>
            )}
          </div>
          <p className="font-semibold">{job.description || SKILL_LABELS[job.category]}</p>
          <p className="text-sm text-muted-foreground">
            {job.address} · {job.distanceKm.toFixed(1)} km away
            {job.budgetMin || job.budgetMax
              ? ` · Budget ₦${job.budgetMin?.toLocaleString() ?? "?"}-₦${job.budgetMax?.toLocaleString() ?? "?"}`
              : ""}
          </p>
        </div>
        {!sent && !unavailable && (
          <Button
            type="button"
            size="sm"
            variant={expanded ? "outline" : "default"}
            onClick={() => {
              setExpanded((v) => !v);
              onSeen?.();
            }}
          >
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
