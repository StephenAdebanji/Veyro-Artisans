"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReviewSummary } from "@veyro/contracts";

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rating ? "fill-amber-400 stroke-amber-400" : "fill-none stroke-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function RatingCard({
  reviews,
}: {
  reviews: ReviewSummary[];
}) {
  const [open, setOpen] = useState(false);

  const calculated =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const ratingCount = reviews.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Star className="size-5 text-primary" />
        <p className="mt-3 text-2xl font-bold">{calculated.toFixed(1)}</p>
        <p className="text-sm text-muted-foreground">
          Rating{ratingCount > 0 ? ` · ${ratingCount} review${ratingCount === 1 ? "" : "s"}` : ""}
        </p>
        {ratingCount > 0 && (
          <p className="mt-1 text-xs text-primary underline-offset-2 hover:underline">
            View all reviews →
          </p>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Reviews</DialogTitle>
          </DialogHeader>

          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No reviews yet — completed jobs will appear here.
            </p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-3xl font-bold">{calculated.toFixed(1)}</p>
                <div>
                  <Stars rating={Math.round(calculated)} size="lg" />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {reviews.length} review{reviews.length === 1 ? "" : "s"} · average{" "}
                    {calculated.toFixed(2)}/5
                  </p>
                </div>
              </div>

              {/* Review list */}
              <div className="max-h-[420px] divide-y overflow-y-auto">
                {reviews.map((r) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 text-sm leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>

            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
