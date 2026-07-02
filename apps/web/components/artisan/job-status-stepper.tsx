"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type JobStatus = "ACTIVE" | "IN_PROGRESS" | "COMPLETED";

const STEPS: { key: JobStatus; label: string }[] = [
  { key: "ACTIVE", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

const ORDER: Record<JobStatus, number> = { ACTIVE: 0, IN_PROGRESS: 1, COMPLETED: 2 };
const NEXT: Record<JobStatus, "IN_PROGRESS" | "COMPLETED" | null> = {
  ACTIVE: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: null,
};

export function JobStatusStepper({ jobId, currentStatus }: { jobId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const status = (currentStatus as JobStatus) ?? "ACTIVE";
  const nextStatus = NEXT[status];
  const isCompleted = status === "COMPLETED";

  function advance() {
    if (!nextStatus) return;
    startTransition(async () => {
      await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    });
  }

  return (
    <div className="mt-5 rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Job Status
      </h2>

      {/* Step track */}
      <div className="relative flex items-start justify-between">
        {/* Connecting line */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-border" />
        <div
          className="absolute left-4 top-4 h-0.5 bg-primary transition-all"
          style={{
            right: `${100 - (ORDER[status] / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step) => {
          const done = ORDER[step.key] < ORDER[status];
          const active = step.key === status;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                    ? "border-primary bg-background text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className={`h-3 w-3 ${active ? "fill-primary" : ""}`} />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action */}
      {!isCompleted && nextStatus && (
        <div className="mt-5">
          <Button
            className={`w-full gap-2 ${
              nextStatus === "COMPLETED"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }`}
            disabled={pending}
            onClick={advance}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {nextStatus === "IN_PROGRESS" ? "Mark as In Progress" : "Mark as Completed"}
          </Button>
        </div>
      )}

      {isCompleted && (
        <p className="mt-4 text-center text-sm font-medium text-emerald-600">
          Job completed — awaiting homeowner review.
        </p>
      )}
    </div>
  );
}
