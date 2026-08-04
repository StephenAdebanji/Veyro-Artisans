"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Sparkles, Star } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import type { AvailableRequestSummary } from "@veyro/contracts";

interface AvailableJobRowProps {
  job: AvailableRequestSummary;
  /** True while this job hasn't been acknowledged yet — arrived live via
   * socket since the feed mounted, rather than being part of the initial load. */
  isNew?: boolean;
  /** True while this job was specifically pushed to this artisan by the
   * homeowner picking them from the AI recommendation panel, rather than
   * just being part of the generic category broadcast. */
  isInvited?: boolean;
  /** Called once the artisan engages with the row, clearing the highlight. */
  onSeen?: () => void;
  /** Called when the offer window closed out from under this row (submitted
   * after the 10-minute window elapsed) — removes it from the feed entirely
   * rather than leaving a stale card, so newer jobs stay front and center. */
  onExpired?: () => void;
}

export function AvailableJobRow({ job, isNew, isInvited, onSeen, onExpired }: AvailableJobRowProps) {
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
      const message = err instanceof Error ? err.message : "Could not send your offer.";
      if (err instanceof ApiRequestError && err.status === 409 && message.toLowerCase().includes("offer window")) {
        onExpired?.();
        return;
      }
      setError(message);
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
        isInvited
          ? "border-violet-400/60 bg-violet-50 ring-2 ring-violet-300/40 dark:bg-violet-950/30"
          : isNew
            ? "border-emerald-400 bg-emerald-100 ring-2 ring-emerald-300 dark:border-emerald-500 dark:bg-emerald-900/50"
            : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar src={job.homeownerProfilePhotoUrl} name={job.homeownerName} size={36} className="mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isInvited ? (
                <span className="flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Star className="h-2.5 w-2.5" /> Recommended for you
                </span>
              ) : (
                isNew && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Sparkles className="h-2.5 w-2.5" /> New
                  </span>
                )
              )}
            </div>
            <p className="font-semibold">
              {job.homeownerName ?? "Someone"} is looking for a {SKILL_LABELS[job.category]}
            </p>
            {job.description && (
              <p className="text-sm text-muted-foreground">{job.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {job.address} · {job.distanceKm.toFixed(1)} km away
              {job.budgetMin || job.budgetMax
                ? ` · Budget ₦${job.budgetMin?.toLocaleString() ?? "?"}-₦${job.budgetMax?.toLocaleString() ?? "?"}`
                : ""}
            </p>
          </div>
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
          <CurrencyInput
            placeholder="Price (₦)"
            className="w-32"
            value={price}
            onValueChange={setPrice}
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
