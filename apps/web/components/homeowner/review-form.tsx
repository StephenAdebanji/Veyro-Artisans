"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (rating === 0) return;
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        <p className="font-semibold text-emerald-700">Review submitted!</p>
        <p className="text-sm text-muted-foreground">Your rating has been recorded and will help others.</p>
      </div>
    );
  }

  const active = hovered || rating;

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-1 text-base font-semibold">Rate this service</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        How was your experience? Your rating helps verify this artisan&apos;s reputation.
      </p>

      {/* Stars */}
      <div className="mb-5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                n <= active
                  ? "fill-amber-400 stroke-amber-400"
                  : "fill-none stroke-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4 resize-none"
        rows={3}
      />

      <Button
        className="w-full"
        disabled={rating === 0 || pending}
        onClick={submit}
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit Review
      </Button>
    </div>
  );
}
